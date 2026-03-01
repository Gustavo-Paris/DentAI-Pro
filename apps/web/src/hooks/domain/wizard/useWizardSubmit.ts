import { useState, useCallback, useMemo, useRef } from 'react';
import type {
  PhotoAnalysisResult,
  ReviewFormData,
  DetectedTooth,
  TreatmentType,
} from '@/types/wizard';
import type { DSDResult } from '@/types/dsd';
import type { PatientPreferences } from '@/types/dsd';
import type { SubmissionStep } from './types';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
import { trackEvent } from '@/lib/analytics';
import { withRetry } from '@/lib/retry';
import { classifyEdgeFunctionError } from '@/lib/edge-function-errors';
import { TIMING } from '@/lib/constants';
import { EVALUATION_STATUS } from '@/lib/evaluation-status';
import { wizard as wizardData } from '@/data';
import { normalizeTreatmentType } from '@/lib/treatment-config';
import { inferCavityClass, getFullRegion } from './helpers';
import {
  dispatchTreatmentProtocol,
  DEFAULT_CERAMIC_TYPE,
  type ProtocolDispatchClients,
  type GenericProtocolResult,
} from '@/lib/protocol-dispatch';

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export interface UseWizardSubmitParams {
  user: { id: string } | null;
  formData: ReviewFormData;
  setFormData: React.Dispatch<React.SetStateAction<ReviewFormData>>;
  selectedTeeth: string[];
  selectedPatientId: string | null;
  patientBirthDate: string | null;
  originalPatientBirthDate: string | null;
  uploadedPhotoPath: string | null;
  analysisResult: PhotoAnalysisResult | null;
  dsdResult: DSDResult | null;
  patientPreferences: PatientPreferences;
  toothTreatments: Record<string, TreatmentType>;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  clearDraft: () => void;
  navigate: (path: string) => void;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

export function getToothData(
  analysisResult: PhotoAnalysisResult | null,
  toothNumber: string,
): DetectedTooth | undefined {
  return analysisResult?.detected_teeth?.find((t) => t.tooth === toothNumber);
}

export function getToothTreatment(
  tooth: string,
  toothTreatments: Record<string, TreatmentType>,
  analysisResult: PhotoAnalysisResult | null,
  formData: ReviewFormData,
): TreatmentType {
  return (
    toothTreatments[tooth] ||
    getToothData(analysisResult, tooth)?.treatment_indication ||
    formData.treatmentType ||
    'resina'
  );
}

/** @deprecated Use normalizeTreatmentType from @/lib/treatment-config directly */
export function normalizeTreatment(treatment: string): TreatmentType {
  return normalizeTreatmentType(treatment) as TreatmentType;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWizardSubmit({
  user,
  formData,
  setFormData,
  selectedTeeth,
  selectedPatientId,
  patientBirthDate,
  originalPatientBirthDate,
  uploadedPhotoPath,
  analysisResult,
  dsdResult,
  patientPreferences,
  toothTreatments,
  setStep,
  clearDraft,
  navigate,
}: UseWizardSubmitParams) {
  const { t } = useTranslation();
  const isSubmittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
  const [submissionStep, setSubmissionStep] = useState(0);
  const [currentToothIndex, setCurrentToothIndex] = useState(-1);

  // -------------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------------

  const submissionSteps = useMemo(() => {
    const teethToShow = selectedTeeth.length > 0 ? selectedTeeth : [formData.tooth].filter(Boolean);
    const steps: SubmissionStep[] = [
      { label: t('wizard.submission.preparingPatient'), completed: submissionStep >= 1 },
    ];

    if (submissionStep >= 2 && teethToShow.length > 0) {
      for (let i = 0; i < teethToShow.length; i++) {
        const isCompleted = i < currentToothIndex || submissionStep >= 4;
        const isActive = i === currentToothIndex && submissionStep >= 2 && submissionStep < 4;
        const toothLabel = teethToShow[i] === 'GENGIVO'
          ? t('components.wizard.review.treatmentGengivoplastia')
          : t('toothLabel.tooth', { number: teethToShow[i] });
        steps.push({
          label: `${toothLabel}${isActive ? ` — ${t('wizard.submission.generatingProtocol')}` : ''}`,
          completed: isCompleted,
        });
      }
    }

    steps.push({ label: t('wizard.submission.finalizing'), completed: submissionStep >= 4 });
    return steps;
  }, [submissionStep, selectedTeeth, formData.tooth, currentToothIndex, t]);

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  const validateForm = useCallback((): boolean => {
    if (!formData.patientAge || !patientBirthDate) {
      // DOB is optional — show soft warning and default age to 30
      toast.warning(t('toasts.wizard.dobWarning'), {
        duration: 4000,
      });
      setFormData((prev) => ({ ...prev, patientAge: prev.patientAge || '30' }));
    }
    const teethToProcess = selectedTeeth.length > 0 ? selectedTeeth : [formData.tooth];
    if (teethToProcess.length === 0 || !teethToProcess[0]) {
      toast.error(t('toasts.wizard.selectTooth'));
      return false;
    }
    return true;
  }, [formData.patientAge, formData.tooth, patientBirthDate, selectedTeeth, setFormData]);

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    if (isSubmittingRef.current || !user || !validateForm()) return;
    isSubmittingRef.current = true;

    setIsSubmitting(true);
    setSubmissionStep(0);
    setCurrentToothIndex(-1);
    setStep(6);

    const rawTeeth = selectedTeeth.length > 0 ? selectedTeeth : [formData.tooth];

    // Deduplicate gengivoplasty: when GENGIVO is present, remove per-tooth
    // entries whose treatment is gengivoplastia (they'd all map to GENGIVO anyway)
    const hasGengivo = rawTeeth.includes('GENGIVO');
    const teethToProcess = hasGengivo
      ? rawTeeth.filter(tooth => {
          if (tooth === 'GENGIVO') return true; // keep the virtual entry
          const tt = getToothTreatment(tooth, toothTreatments, analysisResult, formData);
          return normalizeTreatmentType(tt) !== 'gengivoplastia';
        })
      : rawTeeth;

    const sessionId = crypto.randomUUID();
    const treatmentCounts: Record<string, number> = {};
    let successCount = 0;
    const failedTeeth: Array<{ tooth: string; error: unknown }> = [];

    // -------------------------------------------------------------------
    // Sub-function: create or find patient record
    // -------------------------------------------------------------------
    async function createOrFindPatient(): Promise<string | null> {
      setSubmissionStep(1);
      let patientId = selectedPatientId;

      if (formData.patientName && !patientId) {
        const { data: newPatient, error: patientError } = await wizardData.createPatient(
          user!.id,
          formData.patientName,
          patientBirthDate,
        );

        if (patientError) {
          if (patientError.code === '23505') {
            const existingPatient = await wizardData.findPatientByName(
              user!.id,
              formData.patientName,
            );
            if (existingPatient) patientId = existingPatient.id;
          } else {
            logger.error('Error creating patient:', patientError);
          }
        } else if (newPatient) {
          patientId = newPatient.id;
          trackEvent('patient_created');
        }
      }

      if (patientId && patientBirthDate && !originalPatientBirthDate) {
        await wizardData.updatePatientBirthDate(patientId, patientBirthDate);
      }

      return patientId;
    }

    // -------------------------------------------------------------------
    // Sub-function: build the evaluation insert payload for a single tooth
    // -------------------------------------------------------------------
    function buildEvaluationInsertData(
      tooth: string,
      normalizedTreatment: string,
      toothData: DetectedTooth | undefined,
      patientId: string | null,
    ) {
      const isGengivoplasty = tooth === 'GENGIVO' || normalizedTreatment === 'gengivoplastia';

      return {
        user_id: user!.id,
        session_id: sessionId,
        patient_id: patientId || null,
        patient_name: formData.patientName || null,
        patient_age: parseInt(formData.patientAge) || 30,
        tooth: isGengivoplasty ? 'GENGIVO' : tooth,
        region: isGengivoplasty ? 'anterior-superior' : getFullRegion(tooth),
        cavity_class: isGengivoplasty ? 'N/A' : inferCavityClass(toothData, formData.cavityClass, normalizedTreatment),
        restoration_size: isGengivoplasty ? 'N/A' : (toothData?.restoration_size || formData.restorationSize),
        substrate: isGengivoplasty ? 'N/A' : (toothData?.substrate || formData.substrate),
        tooth_color: formData.vitaShade || 'A2',
        depth: isGengivoplasty ? null : (toothData?.depth || formData.depth),
        substrate_condition: isGengivoplasty ? null : (toothData?.substrate_condition || formData.substrateCondition),
        enamel_condition: isGengivoplasty ? null : (toothData?.enamel_condition || formData.enamelCondition),
        bruxism: formData.bruxism,
        aesthetic_level: formData.budget === 'premium' ? 'estético' : 'funcional',
        budget: formData.budget || 'moderado',
        longevity_expectation: formData.longevityExpectation || 'longo',
        photo_frontal: uploadedPhotoPath,
        status: EVALUATION_STATUS.ANALYZING,
        treatment_type: normalizedTreatment,
        desired_tooth_shape: 'natural',
        ai_treatment_indication:
          isGengivoplasty ? 'gengivoplastia' : (toothData?.treatment_indication || analysisResult?.treatment_indication || null),
        ai_indication_reason:
          isGengivoplasty ? 'dsd_gingival_harmonization' : (toothData?.indication_reason || analysisResult?.indication_reason || null),
        dsd_analysis: dsdResult?.analysis || null,
        dsd_simulation_url: dsdResult?.simulation_url || null,
        dsd_simulation_layers: dsdResult?.layers || null,
        tooth_bounds: toothData?.tooth_bounds || null,
        patient_aesthetic_goals:
          patientPreferences.whiteningLevel === 'hollywood'
            ? 'whitening_hollywood'
            : 'whitening_natural',
        patient_desired_changes: null,
        stratification_needed: !isGengivoplasty,
      };
    }

    // -------------------------------------------------------------------
    // Sub-function: dispatch the AI protocol call for a single tooth
    // -------------------------------------------------------------------
    async function dispatchProtocolForTooth(
      tooth: string,
      normalizedTreatment: string,
      evaluationId: string,
      toothData: DetectedTooth | undefined,
    ): Promise<void> {
      // Build DSD context for this tooth if available
      const dsdSuggestion = dsdResult?.analysis?.suggestions?.find(
        s => s.tooth === tooth,
      );

      // Data-client adapters for wizard context
      const wizardClients: ProtocolDispatchClients = {
        invokeResin: (p) => wizardData.invokeRecommendResin(p),
        invokeCementation: (p) => wizardData.invokeRecommendCementation(p),
        saveGenericProtocol: (id, protocol) => wizardData.updateEvaluationProtocol(id, protocol),
      };

      // Generate protocol WITH retry (2 retries, 2s exponential backoff)
      await withRetry(
        async () => {
          await dispatchTreatmentProtocol(
            {
              treatmentType: normalizedTreatment,
              evaluationId,
              tooth,
              resinParams: normalizedTreatment === 'resina' ? {
                userId: user!.id,
                patientAge: formData.patientAge || '30',
                tooth,
                region: getFullRegion(tooth),
                cavityClass: inferCavityClass(toothData, formData.cavityClass, normalizedTreatment),
                restorationSize: toothData?.restoration_size || formData.restorationSize,
                substrate: toothData?.substrate || formData.substrate,
                bruxism: formData.bruxism,
                aestheticLevel: formData.budget === 'premium' ? 'estético' : 'funcional',
                toothColor: formData.vitaShade,
                stratificationNeeded: true,
                budget: formData.budget,
                longevityExpectation: formData.longevityExpectation,
                aestheticGoals:
                  patientPreferences.whiteningLevel === 'hollywood'
                    ? 'Paciente deseja clareamento INTENSO - nível Hollywood (BL1). Ajustar todas as camadas 2-3 tons mais claras que a cor detectada.'
                    : 'Paciente prefere aparência NATURAL (A1/A2). Manter tons naturais.',
                dsdContext: dsdSuggestion
                  ? {
                      currentIssue: dsdSuggestion.current_issue,
                      proposedChange: dsdSuggestion.proposed_change,
                      observations: dsdResult?.analysis?.observations || [],
                      smileLine: dsdResult?.analysis?.smile_line,
                      faceShape: dsdResult?.analysis?.face_shape,
                      symmetryScore: dsdResult?.analysis?.symmetry_score,
                      smileArc: dsdResult?.analysis?.smile_arc,
                    }
                  : undefined,
              } : undefined,
              cementationParams: normalizedTreatment === 'porcelana' ? {
                teeth: [tooth],
                shade: formData.vitaShade,
                ceramicType: DEFAULT_CERAMIC_TYPE,
                substrate: toothData?.substrate || formData.substrate,
                substrateCondition:
                  toothData?.substrate_condition || formData.substrateCondition,
                aestheticGoals:
                  patientPreferences.whiteningLevel === 'hollywood'
                    ? 'Paciente deseja clareamento INTENSO - nível Hollywood (BL1). A cor ALVO da faceta e do cimento deve ser BL1 ou compatível.'
                    : 'Paciente prefere aparência NATURAL (A1/A2).',
                dsdContext: dsdSuggestion
                  ? {
                      currentIssue: dsdSuggestion.current_issue,
                      proposedChange: dsdSuggestion.proposed_change,
                      observations: dsdResult?.analysis?.observations || [],
                    }
                  : undefined,
              } : undefined,
              genericToothData: toothData,
              enrichGenericProtocol: normalizedTreatment === 'gengivoplastia' && dsdResult?.analysis?.suggestions
                ? (protocol: GenericProtocolResult) => {
                    const gingivoSuggestions = dsdResult.analysis.suggestions.filter(s => {
                      const text = `${s.current_issue} ${s.proposed_change}`.toLowerCase();
                      return text.includes('gengiv') || text.includes('zênite') || text.includes('zenite');
                    });
                    if (gingivoSuggestions.length > 0) {
                      protocol.summary += ` Dentes envolvidos: ${gingivoSuggestions.map(s => s.tooth).join(', ')}. Observações DSD: ${gingivoSuggestions.map(s => s.proposed_change).join('; ')}.`;
                    }
                  }
                : undefined,
            },
            wizardClients,
          );
        },
        {
          maxRetries: 2,
          baseDelay: 2000,
          onRetry: (attempt, err) => {
            logger.warn(`Retry ${attempt} for tooth ${tooth}:`, err);
          },
        },
      );
    }

    // -------------------------------------------------------------------
    // Sub-function: create evaluations and dispatch AI protocols
    // -------------------------------------------------------------------
    async function createEvaluationsWithProtocols(
      patientId: string | null,
    ): Promise<string[]> {
      // Strategy: call AI only for ONE representative tooth per treatment group,
      // then syncGroupProtocols copies the protocol to siblings. This avoids
      // concurrent edge-function calls that hit the Supabase 60s timeout.
      setSubmissionStep(2);

      // Pre-compute treatment types and pick one "primary" tooth per group
      const primaryPerGroup: Record<string, string> = {}; // treatmentType -> first tooth
      for (const tooth of teethToProcess) {
        const tt = normalizeTreatmentType(
          getToothTreatment(tooth, toothTreatments, analysisResult, formData),
        );
        if (!primaryPerGroup[tt]) primaryPerGroup[tt] = tooth;
      }

      // Track groups where the primary tooth failed — siblings will be promoted
      const failedPrimaryGroups = new Set<string>();

      // Process ALL teeth sequentially — only primary teeth call the AI edge function
      const successfulEvalIds: string[] = [];
      let loopIndex = 0;
      for (const tooth of teethToProcess) {
        // Update progress BEFORE processing so the UI shows which tooth is active
        setCurrentToothIndex(loopIndex);

        const toothData = getToothData(analysisResult, tooth);
        const treatmentType = getToothTreatment(tooth, toothTreatments, analysisResult, formData);
        // Normalize treatment type: Gemini sometimes returns English values
        const normalizedTreatment = normalizeTreatmentType(treatmentType);

        let evaluationId: string | null = null;

        try {
          const isGengivoplasty = tooth === 'GENGIVO' || normalizedTreatment === 'gengivoplastia';

          // Is this tooth the primary (first) in its treatment group?
          const isPrimary = primaryPerGroup[normalizedTreatment] === tooth;

          // If the primary of this group already failed, promote this sibling
          const promotedAsPrimary = !isPrimary && failedPrimaryGroups.has(normalizedTreatment);

          const insertData = buildEvaluationInsertData(tooth, normalizedTreatment, toothData, patientId);
          const evaluation = await wizardData.createEvaluation(insertData);
          evaluationId = evaluation.id;

          // Only call AI edge functions for the primary tooth of each group
          // (or promoted sibling if primary failed).
          // Non-primary teeth of the same type will be synced via syncGroupProtocols.
          const needsAICall = isPrimary ||
            promotedAsPrimary ||
            normalizedTreatment === 'implante' ||
            normalizedTreatment === 'coroa' ||
            normalizedTreatment === 'endodontia' ||
            normalizedTreatment === 'encaminhamento' ||
            normalizedTreatment === 'gengivoplastia' ||
            normalizedTreatment === 'recobrimento_radicular';

          if (needsAICall) {
            await dispatchProtocolForTooth(tooth, normalizedTreatment, evaluation.id, toothData);
            // Promoted sibling succeeded — clear the failed flag so remaining
            // siblings won't each redundantly call the AI
            if (promotedAsPrimary) {
              failedPrimaryGroups.delete(normalizedTreatment);
            }
          }

          await wizardData.updateEvaluationStatus(evaluation.id, EVALUATION_STATUS.DRAFT);

          successCount++;
          treatmentCounts[normalizedTreatment] = (treatmentCounts[normalizedTreatment] || 0) + 1;
          if (evaluationId) successfulEvalIds.push(evaluationId);
        } catch (err) {
          logger.error(`Failed to process tooth ${tooth}:`, err);
          failedTeeth.push({ tooth, error: err });

          // Track failed primary so next sibling in the group can be promoted
          if (primaryPerGroup[normalizedTreatment] === tooth) {
            failedPrimaryGroups.add(normalizedTreatment);
          }

          // Mark the evaluation as error so the user can identify it
          if (evaluationId) {
            await wizardData.updateEvaluationStatus(evaluationId, EVALUATION_STATUS.ERROR);
          }
        }

        loopIndex++;
      }

      // Synchronize protocols across teeth in same treatment group
      // (all resina teeth get same brand/protocol, all porcelana teeth get same cementation)
      if (successfulEvalIds.length >= 2) {
        try {
          await wizardData.syncGroupProtocols(sessionId, successfulEvalIds);
        } catch (syncError) {
          logger.warn('Protocol sync failed (non-critical):', syncError);
        }
      }

      // Save pending teeth (detected but not selected by user)
      setSubmissionStep(4);
      const allDetectedTeeth = analysisResult?.detected_teeth || [];
      const unselectedTeeth = allDetectedTeeth.filter((dt) => !teethToProcess.includes(dt.tooth));

      if (unselectedTeeth.length > 0) {
        try {
          await wizardData.savePendingTeeth(
            unselectedTeeth.map((dt) => ({
              session_id: sessionId,
              user_id: user!.id,
              tooth: dt.tooth,
              priority: dt.priority,
              treatment_indication: dt.treatment_indication || 'resina',
              indication_reason: dt.indication_reason || null,
              cavity_class: dt.cavity_class,
              restoration_size: dt.restoration_size,
              substrate: dt.substrate,
              substrate_condition: dt.substrate_condition,
              enamel_condition: dt.enamel_condition,
              depth: dt.depth,
              tooth_region: dt.tooth_region,
              tooth_bounds: dt.tooth_bounds || null,
            })),
          );
        } catch (pendingError) {
          logger.error('Error saving pending teeth:', pendingError);
        }
      }

      return successfulEvalIds;
    }

    // -------------------------------------------------------------------
    // Sub-function: finalize submission — analytics, toasts, navigation
    // -------------------------------------------------------------------
    async function finalizeSubmission(): Promise<void> {
      // Track protocol/wizard completion
      if (successCount > 0) {
        trackEvent('protocol_generated', { teeth_count: successCount, has_inventory: selectedTeeth.length > 0 });
        trackEvent('wizard_completed', { total_teeth: successCount });
      }

      if (successCount === 0) {
        // ALL failed — stay on step 5
        const firstErr = failedTeeth[0]?.error as { message?: string; code?: string } | undefined;
        let errorMessage = t('toasts.wizard.allFailed');
        if (firstErr?.message?.includes('Failed to fetch') || firstErr?.message?.includes('edge function')) {
          errorMessage = t('toasts.wizard.connectionErrorSubmit');
        }
        toast.error(errorMessage, { duration: 5000 });
        setStep(5);
      } else {
        // At least some succeeded — show success animation then navigate
        clearDraft();
        setCompletedSessionId(sessionId);
        toast.dismiss();
        setSubmissionComplete(true);

        if (failedTeeth.length > 0) {
          // Partial success — warn about failures
          const failedList = failedTeeth.map((f) => f.tooth).join(', ');
          toast.warning(
            t('toasts.wizard.partialSuccess', { success: successCount, total: teethToProcess.length, failed: failedList }),
            { duration: 8000 },
          );
        } else {
          // All succeeded
          toast.success(
            t('toasts.wizard.allSuccess', { count: successCount }),
          );
        }

        // Brief delay for success animation — user chooses next action via buttons
        await new Promise((resolve) => setTimeout(resolve, TIMING.WIZARD_SUBMIT_DELAY));
      }
    }

    // -------------------------------------------------------------------
    // Main flow: patient -> evaluations -> finalize
    // -------------------------------------------------------------------
    try {
      const patientId = await createOrFindPatient();
      await createEvaluationsWithProtocols(patientId);
      await finalizeSubmission();
    } catch (error: unknown) {
      // This catch handles errors BEFORE the loop (patient creation, etc.)
      const err = error as { message?: string; code?: string };
      logger.error('Error creating case:', error);

      let errorMessage = t('toasts.wizard.createCaseError');
      let shouldGoBack = true;

      if (err.code === '23505') {
        errorMessage = t('toasts.wizard.duplicatePatient');
      } else if (err.code === '23503') {
        errorMessage = t('toasts.wizard.referenceError');
      } else {
        const errorType = classifyEdgeFunctionError(error);
        if (errorType === 'connection') {
          errorMessage = t('toasts.wizard.networkErrorSubmit');
        } else if (errorType === 'rate_limited') {
          errorMessage = t('toasts.wizard.tooManyRequests');
          shouldGoBack = false;
        } else if (err.message && err.message.length < 100) {
          errorMessage = `Erro: ${err.message}`;
        }
      }

      toast.error(errorMessage, { duration: 5000 });
      if (shouldGoBack) setStep(5);
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [
    user,
    validateForm,
    selectedTeeth,
    formData,
    selectedPatientId,
    patientBirthDate,
    originalPatientBirthDate,
    uploadedPhotoPath,
    analysisResult,
    dsdResult,
    patientPreferences,
    toothTreatments,
    clearDraft,
    navigate,
    setStep,
    setFormData,
  ]);

  const resetSubmission = useCallback(() => {
    setSubmissionComplete(false);
    setCompletedSessionId(null);
    setSubmissionStep(0);
    setCurrentToothIndex(-1);
  }, []);

  return {
    isSubmitting,
    submissionComplete,
    completedSessionId,
    submissionStep,
    submissionSteps,
    currentToothIndex,
    handleSubmit,
    validateForm,
    resetSubmission,
  };
}
