import { useState, useCallback, useMemo, useRef } from 'react';
import type {
  PhotoAnalysisResult,
  ReviewFormData,
  DetectedTooth,
  TreatmentType,
} from '@/types/wizard';
import type { DSDResult } from '@/types/dsd';
import type { PatientPreferences } from '@/types/dsd';
import type { AdditionalPhotos } from '@/hooks/useWizardDraft';
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
import { inferCavityClass, getFullRegion, getToothData, getToothTreatment } from './helpers';

import {
  dispatchTreatmentProtocol,
  DEFAULT_CERAMIC_TYPE,
  type ProtocolDispatchClients,
  type GenericProtocolResult,
} from '@/lib/protocol-dispatch';

/** Type guard: checks whether an unknown caught error has a `context` Response property. */
function hasContext(err: unknown): err is { context: Response } {
  return typeof err === 'object' && err !== null && 'context' in err;
}

/** Wizard submission progress steps */
const SUBMISSION_STEPS = {
  PATIENT: 1,
  EVALUATIONS: 2,
  PROTOCOLS: 3,
  FINALIZING: 4,
  COMPLETE: 5,
  ERROR: 6,
} as const;

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
  additionalPhotos: AdditionalPhotos;
  anamnesis?: string;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  clearDraft: () => void;
  navigate: (path: string) => void;
}

// ---------------------------------------------------------------------------
// Module-level extracted functions
// ---------------------------------------------------------------------------

/** Mutable counters / state passed by reference into module-level helpers. */
interface SubmissionContext {
  successCount: number;
  fallbackCount: number;
  failedTeeth: Array<{ tooth: string; error: unknown }>;
  radiographPath: string | null;
}

/** Create or find the patient record, advancing the submission step indicator. */
async function createOrFindPatient(
  user: { id: string },
  formData: ReviewFormData,
  selectedPatientId: string | null,
  patientBirthDate: string | null,
  originalPatientBirthDate: string | null,
  setSubmissionStep: (step: number) => void,
): Promise<string | null> {
  setSubmissionStep(SUBMISSION_STEPS.PATIENT);
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

  return patientId;
}

/** Build the evaluation insert payload for a single tooth. */
function buildEvaluationInsertData(
  tooth: string,
  normalizedTreatment: string,
  toothData: DetectedTooth | undefined,
  patientId: string | null,
  user: { id: string },
  formData: ReviewFormData,
  sessionId: string,
  analysisResult: PhotoAnalysisResult | null,
  dsdResult: DSDResult | null,
  uploadedPhotoPath: string | null,
  patientPreferences: PatientPreferences,
  fullAnamnesis: string | null,
  ctx: SubmissionContext,
) {
  const isGengivoplasty = tooth === 'GENGIVO' || normalizedTreatment === 'gengivoplastia';

  return {
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
    tooth_color: analysisResult?.vita_shade || formData.vitaShade || 'A2',
    depth: isGengivoplasty ? null : (toothData?.depth || formData.depth),
    substrate_condition: isGengivoplasty ? null : (toothData?.substrate_condition || formData.substrateCondition),
    enamel_condition: isGengivoplasty ? null : (toothData?.enamel_condition || formData.enamelCondition),
    bruxism: formData.bruxism,
    aesthetic_level: formData.budget === 'premium' ? 'estético' : 'funcional',
    budget: formData.budget || 'padrão',
    longevity_expectation: formData.longevityExpectation || 'longo',
    photo_frontal: uploadedPhotoPath,
    status: EVALUATION_STATUS.ANALYZING,
    treatment_type: normalizedTreatment,
    desired_tooth_shape: 'natural',
    ai_treatment_indication:
      isGengivoplasty ? 'gengivoplastia' : (toothData?.treatment_indication || analysisResult?.treatment_indication || null),
    ai_indication_reason:
      isGengivoplasty
        ? (analysisResult?.detected_teeth?.some(t => t.treatment_indication === 'gengivoplastia')
          ? 'dsd_gingival_analysis'
          : 'dsd_professional_choice')
        : (toothData?.indication_reason || analysisResult?.indication_reason || null),
    dsd_analysis: analysisResult ? {
      facial_midline: analysisResult.facial_midline,
      dental_midline: analysisResult.dental_midline,
      smile_line: analysisResult.smile_line,
      buccal_corridor: analysisResult.buccal_corridor,
      occlusal_plane: analysisResult.occlusal_plane,
      golden_ratio_compliance: analysisResult.golden_ratio_compliance,
      symmetry_score: analysisResult.symmetry_score,
      lip_thickness: analysisResult.lip_thickness,
      overbite_suspicion: analysisResult.overbite_suspicion,
      smile_arc: analysisResult.smile_arc,
      face_shape: analysisResult.face_shape,
      perceived_temperament: analysisResult.perceived_temperament,
      recommended_tooth_shape: analysisResult.recommended_tooth_shape,
      visagism_notes: analysisResult.visagism_notes,
      suggestions: analysisResult.detected_teeth
        .filter(t => t.current_issue)
        .map(t => ({
          tooth: t.tooth,
          current_issue: t.current_issue,
          proposed_change: t.proposed_change,
          treatment_indication: t.treatment_indication,
        })),
      observations: analysisResult.observations,
      confidence: analysisResult.confidence != null
        ? (analysisResult.confidence >= 80 ? 'alta' : analysisResult.confidence >= 50 ? 'média' : 'baixa')
        : 'alta',
      dsd_simulation_suitability: analysisResult.dsd_simulation_suitability,
    } : null,
    dsd_simulation_url: dsdResult?.simulation_url || null,
    dsd_simulation_layers: dsdResult?.layers || null,
    tooth_bounds: toothData?.tooth_bounds || null,
    patient_aesthetic_goals:
      patientPreferences.whiteningLevel === 'hollywood'
        ? 'whitening_hollywood'
        : 'whitening_natural',
    patient_desired_changes: null,
    stratification_needed: !isGengivoplasty,
    anamnesis: fullAnamnesis,
    radiograph_url: ctx.radiographPath,
  };
}

/** Dispatch the AI protocol call for a single tooth. */
async function dispatchProtocolForTooth(
  tooth: string,
  normalizedTreatment: string,
  evaluationId: string,
  toothData: DetectedTooth | undefined,
  user: { id: string },
  formData: ReviewFormData,
  analysisResult: PhotoAnalysisResult | null,
  patientPreferences: PatientPreferences,
  fullAnamnesis: string | null,
  setCurrentRetryAttempt: (attempt: number) => void,
): Promise<{ aiGenerated: boolean }> {
  // Build DSD context from unified analysis (replaces legacy dsdResult.analysis.suggestions)
  const dsdContext = toothData?.current_issue ? {
    currentIssue: toothData.current_issue,
    proposedChange: toothData.proposed_change,
    observations: analysisResult?.observations || [],
    smileLine: analysisResult?.smile_line,
    symmetryScore: analysisResult?.symmetry_score,
    smileArc: analysisResult?.smile_arc,
    faceShape: analysisResult?.face_shape,
  } : undefined;

  // Data-client adapters for wizard context
  const wizardClients: ProtocolDispatchClients = {
    invokeResin: (p) => wizardData.invokeRecommendResin(p),
    invokeCementation: (p) => wizardData.invokeRecommendCementation(p),
    saveGenericProtocol: (id, protocol) => wizardData.updateEvaluationProtocol(id, protocol),
  };

  // Credit idempotency key: ensures this tooth's protocol is only charged once
  const operationId = `${evaluationId}:${tooth}:protocol`;

  // Generate protocol WITH retry (2 retries, 2s exponential backoff)
  const result = await withRetry(
    async () => {
      return await dispatchTreatmentProtocol(
        {
          treatmentType: normalizedTreatment,
          evaluationId,
          tooth,
          operationId,
          resinParams: normalizedTreatment === 'resina' ? {
            userId: user.id,
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
            dsdContext,
            anamnesis: fullAnamnesis,
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
            anamnesis: fullAnamnesis,
            dsdContext: dsdContext
              ? {
                  currentIssue: dsdContext.currentIssue,
                  proposedChange: dsdContext.proposedChange,
                  observations: dsdContext.observations,
                }
              : undefined,
          } : undefined,
          genericToothData: toothData,
          enrichGenericProtocol: normalizedTreatment === 'gengivoplastia'
            ? (protocol: GenericProtocolResult) => {
                const gingivoTeeth = analysisResult?.detected_teeth?.filter(t => {
                  const text = `${t.current_issue ?? ''} ${t.proposed_change ?? ''}`.toLowerCase();
                  return text.includes('gengiv') || text.includes('zênite') || text.includes('zenite');
                }) ?? [];
                if (gingivoTeeth.length > 0) {
                  // Recommended: AI detected per-tooth gingival issues
                  const perToothDetail = gingivoTeeth.map(t =>
                    `${t.tooth}: ${t.proposed_change}`
                  ).join('. ');
                  protocol.summary += ` Planejamento por dente: ${perToothDetail}.`;
                  protocol.summary += ` Sequência: gengivoplastia ANTES das restaurações (60-90 dias de maturação tecidual).`;
                } else {
                  // Optional: user approved without AI detection
                  protocol.summary += ` Aprovada pelo profissional via planejamento digital — medidas a definir clinicamente. Requer avaliação periodontal (sondagem + radiografia periapical).`;
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
      onRetry: async (attempt, err) => {
        // Update UI to show retry indicator
        setCurrentRetryAttempt(attempt);

        // Extract edge function response body for better debugging
        const context = hasContext(err) ? err.context : undefined;
        if (context && typeof context.json === 'function') {
          try {
            const body = await context.json();
            logger.warn(`Retry ${attempt} for tooth ${tooth}: ${body?.error || body?.message || 'unknown'}`, body);
          } catch {
            logger.warn(`Retry ${attempt} for tooth ${tooth}:`, err);
          }
        } else {
          logger.warn(`Retry ${attempt} for tooth ${tooth}:`, err);
        }
      },
    },
  );
  return result;
}

/** Create evaluations and dispatch AI protocols for all teeth in the session. */
async function createEvaluationsWithProtocols(
  patientId: string | null,
  user: { id: string },
  formData: ReviewFormData,
  sessionId: string,
  teethToProcess: string[],
  toothTreatments: Record<string, TreatmentType>,
  analysisResult: PhotoAnalysisResult | null,
  dsdResult: DSDResult | null,
  uploadedPhotoPath: string | null,
  patientPreferences: PatientPreferences,
  fullAnamnesis: string | null,
  ctx: SubmissionContext,
  setSubmissionStep: (step: number) => void,
  setCurrentToothIndex: (index: number) => void,
  setCurrentRetryAttempt: (attempt: number) => void,
): Promise<string[]> {
  // Strategy: call AI only for ONE representative tooth per treatment group,
  // then syncGroupProtocols copies the protocol to siblings. This avoids
  // concurrent edge-function calls that hit the Supabase 60s timeout.
  setSubmissionStep(SUBMISSION_STEPS.EVALUATIONS);

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
    setCurrentRetryAttempt(0);

    const toothData = getToothData(analysisResult, tooth);
    const treatmentType = getToothTreatment(tooth, toothTreatments, analysisResult, formData);
    // Normalize treatment type: Gemini sometimes returns English values
    const normalizedTreatment = normalizeTreatmentType(treatmentType);

    let evaluationId: string | null = null;

    try {
      // Is this tooth the primary (first) in its treatment group?
      const isPrimary = primaryPerGroup[normalizedTreatment] === tooth;

      // If the primary of this group already failed, promote this sibling
      const promotedAsPrimary = !isPrimary && failedPrimaryGroups.has(normalizedTreatment);

      const insertData = buildEvaluationInsertData(
        tooth, normalizedTreatment, toothData, patientId,
        user, formData, sessionId, analysisResult, dsdResult,
        uploadedPhotoPath, patientPreferences, fullAnamnesis, ctx,
      );
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
        const dispatchResult = await dispatchProtocolForTooth(
          tooth, normalizedTreatment, evaluation.id, toothData,
          user, formData, analysisResult, patientPreferences, fullAnamnesis,
          setCurrentRetryAttempt,
        );
        if (!dispatchResult.aiGenerated) ctx.fallbackCount++;
        // Promoted sibling succeeded — clear the failed flag so remaining
        // siblings won't each redundantly call the AI
        if (promotedAsPrimary) {
          failedPrimaryGroups.delete(normalizedTreatment);
        }
      }

      await wizardData.updateEvaluationStatus(evaluation.id, EVALUATION_STATUS.DRAFT);

      ctx.successCount++;
      if (evaluationId) successfulEvalIds.push(evaluationId);
    } catch (err) {
      // Extract edge function response body for debugging
      const errContext = (err as { context?: Response }).context;
      if (errContext && typeof errContext.json === 'function') {
        try {
          const body = await errContext.json();
          logger.error(`Failed to process tooth ${tooth}: ${body?.error || body?.message || 'unknown'}`, body);
        } catch {
          logger.error(`Failed to process tooth ${tooth}:`, err);
        }
      } else {
        logger.error(`Failed to process tooth ${tooth}:`, err);
      }
      ctx.failedTeeth.push({ tooth, error: err });

      // Track failed primary so next sibling in the group can be promoted
      if (primaryPerGroup[normalizedTreatment] === tooth) {
        failedPrimaryGroups.add(normalizedTreatment);
      }

      // Mark the evaluation as error so the user can identify it
      if (evaluationId) {
        await wizardData.updateEvaluationStatus(evaluationId, EVALUATION_STATUS.ERROR)
          .catch((statusErr) => logger.warn('Failed to set evaluation error status:', statusErr));
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
  setSubmissionStep(SUBMISSION_STEPS.FINALIZING);
  const allDetectedTeeth = analysisResult?.detected_teeth || [];
  const unselectedTeeth = allDetectedTeeth.filter((dt) => !teethToProcess.includes(dt.tooth));

  if (unselectedTeeth.length > 0) {
    try {
      await wizardData.savePendingTeeth(
        unselectedTeeth.map((dt) => ({
          session_id: sessionId,
          user_id: user.id,
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

/** Finalize submission — analytics, toasts, navigation. */
async function finalizeSubmission(
  ctx: SubmissionContext,
  teethToProcess: string[],
  sessionId: string,
  t: (key: string, opts?: Record<string, unknown>) => string,
  clearDraft: () => void,
  setStep: (step: number) => void,
  setCompletedSessionId: (id: string | null) => void,
): Promise<boolean> {
  // Track protocol/wizard completion
  if (ctx.successCount > 0) {
    trackEvent('protocol_generated', { teeth_count: ctx.successCount, has_inventory: teethToProcess.length > 0 });
    trackEvent('wizard_completed', { total_teeth: ctx.successCount });
  }

  if (ctx.successCount === 0) {
    // ALL failed — stay on step 5
    const firstErr = ctx.failedTeeth[0]?.error as { message?: string; code?: string } | undefined;
    let errorMessage = t('toasts.wizard.allFailed');
    if (firstErr?.message?.includes('Failed to fetch') || firstErr?.message?.includes('edge function')) {
      errorMessage = t('toasts.wizard.connectionErrorSubmit');
    }
    toast.error(errorMessage, { duration: 5000 });
    setStep(5);
    return false;
  } else {
    // At least some succeeded — show success animation then navigate
    clearDraft();
    setCompletedSessionId(sessionId);
    toast.dismiss();

    if (ctx.failedTeeth.length > 0) {
      // Partial success — warn about failures
      const failedList = ctx.failedTeeth.map((f) => f.tooth).join(', ');
      toast.warning(
        t('toasts.wizard.partialSuccess', { success: ctx.successCount, total: teethToProcess.length, failed: failedList }),
        { duration: 8000 },
      );
    } else if (ctx.fallbackCount > 0) {
      // All teeth processed but some used generic fallback instead of AI
      toast.warning(
        t('toasts.wizard.fallbackWarning', { total: ctx.successCount, fallback: ctx.fallbackCount }),
        { duration: 8000 },
      );
    } else {
      // All succeeded with AI protocols
      toast.success(
        t('toasts.wizard.allSuccess', { count: ctx.successCount }),
      );
    }

    // Brief delay for success animation — user chooses next action via buttons
    await new Promise((resolve) => setTimeout(resolve, TIMING.WIZARD_SUBMIT_DELAY));
    return true;
  }
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
  additionalPhotos,
  anamnesis,
  setStep,
  clearDraft,
  navigate,
}: UseWizardSubmitParams) {
  const { t } = useTranslation();
  const isSubmittingRef = useRef(false);

  // Merge dentist's clinical notes into anamnesis so both reach the AI and persist to DB
  const fullAnamnesis = [
    anamnesis?.trim(),
    formData.clinicalNotes?.trim() ? `Notas clínicas do dentista: ${formData.clinicalNotes.trim()}` : undefined,
  ].filter(Boolean).join('\n\n') || null;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
  const [submissionStep, setSubmissionStep] = useState(0);
  const [currentToothIndex, setCurrentToothIndex] = useState(-1);
  const [currentRetryAttempt, setCurrentRetryAttempt] = useState(0);

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
        const retryLabel = isActive && currentRetryAttempt > 0
          ? ` — ${t('wizard.submission.retryAttempt', { attempt: currentRetryAttempt + 1, total: 3 })}`
          : isActive ? ` — ${t('wizard.submission.generatingProtocol')}` : '';
        steps.push({
          label: `${toothLabel}${retryLabel}`,
          completed: isCompleted,
        });
      }
    }

    steps.push({ label: t('wizard.submission.finalizing'), completed: submissionStep >= 4 });
    return steps;
  }, [submissionStep, selectedTeeth, formData.tooth, currentToothIndex, currentRetryAttempt, t]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.patientAge, formData.tooth, patientBirthDate, selectedTeeth, setFormData]);

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    if (isSubmittingRef.current || !user || !validateForm()) return;
    isSubmittingRef.current = true;

    // Wake up edge function runtimes in parallel (fire-and-forget).
    // Avoids cold-start delays when the first real AI call hits.
    wizardData.warmupEdgeFunctions();

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

    // Shared mutable counters — passed by reference to module-level helpers
    const ctx: SubmissionContext = {
      successCount: 0,
      fallbackCount: 0,
      failedTeeth: [],
      radiographPath: null,
    };

    // -------------------------------------------------------------------
    // Main flow: patient -> evaluations -> finalize (with global timeout)
    // -------------------------------------------------------------------
    let globalTimeoutId: ReturnType<typeof setTimeout>;
    const globalTimeout = new Promise<never>((_, reject) => {
      globalTimeoutId = setTimeout(() => reject(new Error('CASE_GENERATION_TIMEOUT')), TIMING.CASE_GENERATION_TIMEOUT);
    });

    try {
      const patientId = await Promise.race([
        createOrFindPatient(
          user, formData, selectedPatientId, patientBirthDate, originalPatientBirthDate,
          setSubmissionStep,
        ),
        globalTimeout,
      ]);

      // Upload radiograph to storage (follows same pattern as frontal photo)
      if (additionalPhotos.radiograph && user) {
        try {
          const base64Data = additionalPhotos.radiograph.split(',')[1] || additionalPhotos.radiograph;
          const byteString = atob(base64Data);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: 'image/jpeg' });
          ctx.radiographPath = await wizardData.uploadPhoto(user.id, blob, `${sessionId}/radiograph`);
        } catch (uploadErr) {
          logger.warn('Radiograph upload failed (non-critical):', uploadErr);
        }
      }

      await Promise.race([
        createEvaluationsWithProtocols(
          patientId, user, formData, sessionId, teethToProcess,
          toothTreatments, analysisResult, dsdResult, uploadedPhotoPath,
          patientPreferences, fullAnamnesis, ctx,
          setSubmissionStep, setCurrentToothIndex, setCurrentRetryAttempt,
        ),
        globalTimeout,
      ]);

      const succeeded = await finalizeSubmission(
        ctx, teethToProcess, sessionId, t,
        clearDraft, setStep, setCompletedSessionId,
      );
      if (succeeded) setSubmissionComplete(true);
    } catch (error: unknown) {
      // This catch handles errors BEFORE the loop (patient creation, etc.)
      const err = error as { message?: string; code?: string };
      logger.error('Error creating case:', error);

      let errorMessage = t('toasts.wizard.createCaseError');
      let shouldGoBack = true;

      if (err.message === 'CASE_GENERATION_TIMEOUT') {
        errorMessage = t('toasts.wizard.globalTimeout');
      } else if (err.code === '23505') {
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
          errorMessage = t('toasts.wizard.unknownError', { message: err.message });
        }
      }

      toast.error(errorMessage, { duration: 5000 });
      if (shouldGoBack) setStep(5);
    } finally {
      clearTimeout(globalTimeoutId!);
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    additionalPhotos,
    anamnesis,
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
    setCurrentRetryAttempt(0);
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
