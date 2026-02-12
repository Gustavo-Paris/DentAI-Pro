import { useState, useCallback, useMemo } from 'react';
import type {
  PhotoAnalysisResult,
  ReviewFormData,
  DetectedTooth,
  TreatmentType,
} from '@/components/wizard/ReviewAnalysisStep';
import type { DSDResult } from '@/types/dsd';
import type { PatientPreferences } from '@/components/wizard/PatientPreferencesStep';
import type { SubmissionStep } from './types';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
import { trackEvent } from '@/lib/analytics';
import { withRetry } from '@/lib/retry';
import { TIMING } from '@/lib/constants';
import { wizard as wizardData } from '@/data';
import { inferCavityClass, getFullRegion, getGenericProtocol } from './helpers';

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

export function normalizeTreatment(treatment: string): TreatmentType {
  const mapping: Record<string, TreatmentType> = {
    porcelain: 'porcelana',
    resin: 'resina',
    crown: 'coroa',
    implant: 'implante',
    endodontics: 'endodontia',
    referral: 'encaminhamento',
    gingivoplasty: 'gengivoplastia',
  };
  return mapping[treatment] || (treatment as TreatmentType);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [submissionStep, setSubmissionStep] = useState(0);
  const [currentToothIndex, setCurrentToothIndex] = useState(-1);

  // -------------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------------

  const submissionSteps = useMemo(() => {
    const teethToShow = selectedTeeth.length > 0 ? selectedTeeth : [formData.tooth].filter(Boolean);
    const steps: SubmissionStep[] = [
      { label: 'Preparando dados do paciente...', completed: submissionStep >= 1 },
    ];

    if (submissionStep >= 2 && teethToShow.length > 0) {
      for (let i = 0; i < teethToShow.length; i++) {
        const isCompleted = i < currentToothIndex || submissionStep >= 4;
        const isActive = i === currentToothIndex && submissionStep >= 2 && submissionStep < 4;
        const toothLabel = teethToShow[i] === 'GENGIVO'
          ? 'Gengivoplastia'
          : `Dente ${teethToShow[i]}`;
        steps.push({
          label: `${toothLabel}${isActive ? ' — gerando protocolo...' : ''}`,
          completed: isCompleted,
        });
      }
    }

    steps.push({ label: 'Finalizando e salvando...', completed: submissionStep >= 4 });
    return steps;
  }, [submissionStep, selectedTeeth, formData.tooth, currentToothIndex]);

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
    if (!user || !validateForm()) return;

    setIsSubmitting(true);
    setSubmissionStep(0);
    setCurrentToothIndex(-1);
    setStep(6);

    const rawTeeth = selectedTeeth.length > 0 ? selectedTeeth : [formData.tooth];

    // Deduplicate gengivoplasty: when GENGIVO is present, remove per-tooth
    // entries whose treatment is gengivoplastia (they'd all map to GENGIVO anyway)
    const hasGengivo = rawTeeth.includes('GENGIVO');
    const teethToProcess = hasGengivo
      ? rawTeeth.filter(t => {
          if (t === 'GENGIVO') return true; // keep the virtual entry
          const tt = getToothTreatment(t, toothTreatments, analysisResult, formData);
          return normalizeTreatment(tt) !== 'gengivoplastia';
        })
      : rawTeeth;

    const createdEvaluationIds: string[] = [];
    const sessionId = crypto.randomUUID();
    const treatmentCounts: Record<string, number> = {};
    let successCount = 0;
    const failedTeeth: Array<{ tooth: string; error: unknown }> = [];

    try {
      // Step 1: Patient
      setSubmissionStep(1);
      let patientId = selectedPatientId;

      if (formData.patientName && !patientId) {
        const { data: newPatient, error: patientError } = await wizardData.createPatient(
          user.id,
          formData.patientName,
          patientBirthDate,
        );

        if (patientError) {
          if (patientError.code === '23505') {
            const existingPatient = await wizardData.findPatientByName(
              user.id,
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

      // Step 2: Evaluations + Protocols (per-tooth with retry) — PARALLEL
      setSubmissionStep(2);

      const resolvedCount = { value: 0 };

      const results = await Promise.allSettled(
        teethToProcess.map(async (tooth) => {
          const toothData = getToothData(analysisResult, tooth);
          const treatmentType = getToothTreatment(tooth, toothTreatments, analysisResult, formData);
          // Normalize treatment type: Gemini sometimes returns English values
          const normalizedTreatment = normalizeTreatment(treatmentType);

          let evaluationId: string | null = null;

          // Gengivoplasty is a tissue procedure, not per-tooth — use sensible defaults
          const isGengivoplasty = tooth === 'GENGIVO' || normalizedTreatment === 'gengivoplastia';

          // Insert evaluation (DB is fast, no retry needed)
          const insertData = {
            user_id: user.id,
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
            aesthetic_level: formData.aestheticLevel || 'estético',
            budget: formData.budget || 'moderado',
            longevity_expectation: formData.longevityExpectation || 'longo',
            photo_frontal: uploadedPhotoPath,
            status: 'analyzing',
            treatment_type: normalizedTreatment,
            desired_tooth_shape: 'natural',
            ai_treatment_indication:
              isGengivoplasty ? 'gengivoplastia' : (toothData?.treatment_indication || analysisResult?.treatment_indication || null),
            ai_indication_reason:
              isGengivoplasty ? 'Harmonização gengival identificada pela análise DSD' : (toothData?.indication_reason || analysisResult?.indication_reason || null),
            dsd_analysis: dsdResult?.analysis || null,
            dsd_simulation_url: dsdResult?.simulation_url || null,
            dsd_simulation_layers: dsdResult?.layers || null,
            tooth_bounds: toothData?.tooth_bounds || null,
            patient_aesthetic_goals:
              patientPreferences.whiteningLevel === 'hollywood'
                ? 'Clareamento intenso - nível Hollywood (BL1)'
                : 'Aparência natural e sutil (A1/A2)',
            patient_desired_changes: null,
            stratification_needed: !isGengivoplasty,
          };

          const evaluation = await wizardData.createEvaluation(insertData);
          evaluationId = evaluation.id;
          createdEvaluationIds.push(evaluation.id);

          // Generate protocol WITH retry (2 retries, 2s exponential backoff)
          await withRetry(
            async () => {
              switch (normalizedTreatment) {
                case 'porcelana': {
                  // Build DSD context for this tooth if available
                  const cementDsdSuggestion = dsdResult?.analysis?.suggestions?.find(
                    s => s.tooth === tooth,
                  );
                  await wizardData.invokeRecommendCementation({
                    evaluationId: evaluation.id,
                    teeth: [tooth],
                    shade: formData.vitaShade,
                    ceramicType: 'Dissilicato de lítio',
                    substrate: toothData?.substrate || formData.substrate,
                    substrateCondition:
                      toothData?.substrate_condition || formData.substrateCondition,
                    aestheticGoals:
                      patientPreferences.whiteningLevel === 'hollywood'
                        ? 'Paciente deseja clareamento INTENSO - nível Hollywood (BL1). A cor ALVO da faceta e do cimento deve ser BL1 ou compatível.'
                        : 'Paciente prefere aparência NATURAL (A1/A2).',
                    dsdContext: cementDsdSuggestion
                      ? {
                          currentIssue: cementDsdSuggestion.current_issue,
                          proposedChange: cementDsdSuggestion.proposed_change,
                          observations: dsdResult?.analysis?.observations || [],
                        }
                      : undefined,
                  });
                  break;
                }
                case 'resina': {
                  // Build DSD context for this tooth if available
                  const resinDsdSuggestion = dsdResult?.analysis?.suggestions?.find(
                    s => s.tooth === tooth,
                  );
                  await wizardData.invokeRecommendResin({
                    evaluationId: evaluation.id,
                    userId: user.id,
                    patientAge: formData.patientAge || '30',
                    tooth,
                    region: getFullRegion(tooth),
                    cavityClass: inferCavityClass(toothData, formData.cavityClass, normalizedTreatment),
                    restorationSize: toothData?.restoration_size || formData.restorationSize,
                    substrate: toothData?.substrate || formData.substrate,
                    bruxism: formData.bruxism,
                    aestheticLevel: formData.aestheticLevel,
                    toothColor: formData.vitaShade,
                    stratificationNeeded: true,
                    budget: formData.budget,
                    longevityExpectation: formData.longevityExpectation,
                    aestheticGoals:
                      patientPreferences.whiteningLevel === 'hollywood'
                        ? 'Paciente deseja clareamento INTENSO - nível Hollywood (BL1). Ajustar todas as camadas 2-3 tons mais claras que a cor detectada.'
                        : 'Paciente prefere aparência NATURAL (A1/A2). Manter tons naturais.',
                    dsdContext: resinDsdSuggestion
                      ? {
                          currentIssue: resinDsdSuggestion.current_issue,
                          proposedChange: resinDsdSuggestion.proposed_change,
                          observations: dsdResult?.analysis?.observations || [],
                        }
                      : undefined,
                  });
                  break;
                }
                case 'implante':
                case 'coroa':
                case 'endodontia':
                case 'encaminhamento':
                case 'gengivoplastia': {
                  const genericProtocol = getGenericProtocol(normalizedTreatment, tooth, toothData);
                  // Enrich gengivoplasty summary with DSD details if available
                  if (normalizedTreatment === 'gengivoplastia' && dsdResult?.analysis?.suggestions) {
                    const gingivoSuggestions = dsdResult.analysis.suggestions.filter(s => {
                      const text = `${s.current_issue} ${s.proposed_change}`.toLowerCase();
                      return text.includes('gengiv') || text.includes('zênite') || text.includes('zenite');
                    });
                    if (gingivoSuggestions.length > 0) {
                      genericProtocol.summary += ` Dentes envolvidos: ${gingivoSuggestions.map(s => s.tooth).join(', ')}. Observações DSD: ${gingivoSuggestions.map(s => s.proposed_change).join('; ')}.`;
                    }
                  }
                  await wizardData.updateEvaluationProtocol(evaluation.id, genericProtocol);
                  break;
                }
              }
            },
            {
              maxRetries: 2,
              baseDelay: 2000,
              onRetry: (attempt, err) => {
                logger.warn(`Retry ${attempt} for tooth ${tooth}:`, err);
              },
            },
          );

          await wizardData.updateEvaluationStatus(evaluation.id, 'draft');

          // Update progress counter as promises resolve
          resolvedCount.value++;
          setCurrentToothIndex(resolvedCount.value - 1);

          return { tooth, evaluationId, normalizedTreatment };
        }),
      );

      // Process results
      for (const [index, result] of results.entries()) {
        if (result.status === 'fulfilled') {
          successCount++;
          const { normalizedTreatment } = result.value;
          treatmentCounts[normalizedTreatment] = (treatmentCounts[normalizedTreatment] || 0) + 1;
        } else {
          const tooth = teethToProcess[index];
          logger.error(`Error processing tooth ${tooth}:`, result.reason);
          failedTeeth.push({ tooth, error: result.reason });

          // Mark the evaluation as 'error' so the user can identify it
          // Find if an evaluation was created before the failure
          // (the evaluationId may have been set before the protocol generation failed)
          const evalId = createdEvaluationIds[index];
          if (evalId) {
            await wizardData.updateEvaluationStatus(evalId, 'error');
          }
        }
      }

      // Step 4: Save pending teeth
      setSubmissionStep(4);
      const allDetectedTeeth = analysisResult?.detected_teeth || [];
      const unselectedTeeth = allDetectedTeeth.filter((t) => !teethToProcess.includes(t.tooth));

      if (unselectedTeeth.length > 0) {
        try {
          await wizardData.savePendingTeeth(
            unselectedTeeth.map((t) => ({
              session_id: sessionId,
              user_id: user.id,
              tooth: t.tooth,
              priority: t.priority,
              treatment_indication: t.treatment_indication || 'resina',
              indication_reason: t.indication_reason || null,
              cavity_class: t.cavity_class,
              restoration_size: t.restoration_size,
              substrate: t.substrate,
              substrate_condition: t.substrate_condition,
              enamel_condition: t.enamel_condition,
              depth: t.depth,
              tooth_region: t.tooth_region,
              tooth_bounds: t.tooth_bounds || null,
            })),
          );
        } catch (pendingError) {
          logger.error('Error saving pending teeth:', pendingError);
        }
      }

      // Determine outcome: all success, partial success, or all failed
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
        toast.dismiss();
        setIsSubmitting(false);
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

        // Brief success animation before navigating
        await new Promise((resolve) => setTimeout(resolve, TIMING.WIZARD_SUBMIT_DELAY));
        setSubmissionComplete(false);
        navigate(`/evaluation/${sessionId}`);
      }
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
      } else if (
        err.message?.includes('network') ||
        err.message?.includes('fetch') ||
        err.message?.includes('Failed to fetch')
      ) {
        errorMessage = t('toasts.wizard.networkErrorSubmit');
      } else if (err.message?.includes('429') || err.code === 'RATE_LIMITED') {
        errorMessage = t('toasts.wizard.tooManyRequests');
        shouldGoBack = false;
      } else if (err.message && err.message.length < 100) {
        errorMessage = `Erro: ${err.message}`;
      }

      toast.error(errorMessage, { duration: 5000 });
      if (shouldGoBack) setStep(5);
    } finally {
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

  return {
    isSubmitting,
    submissionComplete,
    submissionStep,
    submissionSteps,
    currentToothIndex,
    handleSubmit,
    validateForm,
  };
}
