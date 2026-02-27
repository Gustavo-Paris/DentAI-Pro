import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { evaluations, wizard } from '@/data';
import { getFullRegion } from '../wizard/helpers';
import { useTranslation } from 'react-i18next';
import {
  dispatchTreatmentProtocol,
  DEFAULT_CERAMIC_TYPE,
  evaluationClients,
} from '@/lib/protocol-dispatch';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { EVALUATION_STATUS } from '@/lib/evaluation-status';

import { evaluationKeys } from './useEvaluationData';
import type { EvaluationItem, PatientDataForModal } from '../useEvaluationDetail';
import type { TreatmentType, SubmitTeethPayload } from '@/components/AddTeethModal';
import type { User } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TREATMENT_LABEL_KEYS: Record<TreatmentType, string> = {
  resina: 'treatments.resina.label',
  porcelana: 'treatments.porcelana.label',
  coroa: 'treatments.coroa.label',
  implante: 'treatments.implante.label',
  endodontia: 'treatments.endodontia.label',
  encaminhamento: 'treatments.encaminhamento.label',
  gengivoplastia: 'treatments.gengivoplastia.label',
  recobrimento_radicular: 'treatments.recobrimento_radicular.label',
};

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface UseAddTeethFlowReturn {
  failedTeeth: string[];
  handleSubmitTeeth: (payload: SubmitTeethPayload) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Deps
// ---------------------------------------------------------------------------

export interface UseAddTeethFlowDeps {
  sessionId: string;
  user: User | null;
  evals: EvaluationItem[];
  patientDataForModal: PatientDataForModal | null;
  handleAddTeethSuccess: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAddTeethFlow(deps: UseAddTeethFlowDeps): UseAddTeethFlowReturn {
  const { sessionId, user, evals, patientDataForModal, handleAddTeethSuccess } = deps;
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [failedTeeth, setFailedTeeth] = useState<string[]>([]);

  // Use shared evaluation clients from protocol-dispatch
  const evalClients = evaluationClients;

  // ---- Submit Teeth (AddTeethModal) ----
  const handleSubmitTeeth = useCallback(async (payload: SubmitTeethPayload) => {
    if (!user || !patientDataForModal) return;

    const treatmentCounts: Record<string, number> = {};
    const newEvalIds: string[] = [];
    const results: Array<{ tooth: string; success: boolean; error?: string }> = [];

    // Clear previous failures
    setFailedTeeth([]);

    // Primary-tooth optimization: only ONE tooth per treatment group calls the AI edge function.
    // This avoids concurrent edge-function calls that hit the Supabase 60s timeout.
    // syncGroupProtocols (after the loop) copies the protocol from the primary tooth to siblings.
    const primaryPerGroup: Record<string, string> = {};
    for (const toothNumber of payload.selectedTeeth) {
      const toothData = payload.pendingTeeth.find(t => t.tooth === toothNumber);
      const treatmentType = (payload.toothTreatments[toothNumber] || toothData?.treatment_indication || 'resina') as TreatmentType;
      if (!primaryPerGroup[treatmentType]) primaryPerGroup[treatmentType] = toothNumber;
    }

    for (const toothNumber of payload.selectedTeeth) {
      const toothData = payload.pendingTeeth.find(t => t.tooth === toothNumber);
      if (!toothData) continue;

      const treatmentType = (payload.toothTreatments[toothNumber] || toothData.treatment_indication || 'resina') as TreatmentType;

      try {
        // Create evaluation record
        const insertData = {
          user_id: user.id,
          session_id: sessionId,
          patient_id: patientDataForModal.id || null,
          patient_name: patientDataForModal.name || null,
          patient_age: patientDataForModal.age,
          tooth: toothNumber,
          region: toothData.tooth_region || getFullRegion(toothNumber),
          cavity_class: toothData.cavity_class || 'Classe I',
          restoration_size: toothData.restoration_size || 'Média',
          substrate: toothData.substrate || 'Esmalte e Dentina',
          tooth_color: patientDataForModal.vitaShade,
          depth: toothData.depth || 'Média',
          substrate_condition: toothData.substrate_condition || 'Saudável',
          enamel_condition: toothData.enamel_condition || 'Íntegro',
          bruxism: patientDataForModal.bruxism,
          aesthetic_level: patientDataForModal.aestheticLevel,
          budget: patientDataForModal.budget,
          longevity_expectation: patientDataForModal.longevityExpectation,
          photo_frontal: patientDataForModal.photoPath,
          status: EVALUATION_STATUS.ANALYZING,
          treatment_type: treatmentType,
          desired_tooth_shape: 'natural',
          ai_treatment_indication: toothData.treatment_indication,
          ai_indication_reason: toothData.indication_reason,
          tooth_bounds: toothData.tooth_bounds,
          stratification_needed: treatmentType !== 'gengivoplastia' && treatmentType !== 'recobrimento_radicular',
        };

        const evaluation = await evaluations.insertEvaluation(insertData);
        newEvalIds.push(evaluation.id);

        // Only the primary tooth per treatment group calls the AI edge function.
        // Non-primary resina/porcelana teeth skip the call — syncGroupProtocols
        // copies the protocol from the primary tooth after the loop.
        const isPrimary = primaryPerGroup[treatmentType] === toothNumber;

        // Generic treatments always execute; resina/porcelana only for primary tooth
        const shouldDispatch = isPrimary ||
          (treatmentType !== 'resina' && treatmentType !== 'porcelana');

        if (shouldDispatch) {
          await dispatchTreatmentProtocol(
            {
              treatmentType,
              evaluationId: evaluation.id,
              tooth: toothNumber,
              resinParams: treatmentType === 'resina' ? {
                userId: user.id,
                patientAge: String(patientDataForModal.age),
                tooth: toothNumber,
                region: getFullRegion(toothNumber),
                cavityClass: toothData.cavity_class || 'Classe I',
                restorationSize: toothData.restoration_size || 'Média',
                substrate: toothData.substrate || 'Esmalte e Dentina',
                bruxism: patientDataForModal.bruxism,
                aestheticLevel: patientDataForModal.aestheticLevel,
                toothColor: patientDataForModal.vitaShade,
                stratificationNeeded: true,
                budget: patientDataForModal.budget,
                longevityExpectation: patientDataForModal.longevityExpectation,
              } : undefined,
              cementationParams: treatmentType === 'porcelana' ? {
                teeth: [toothNumber],
                shade: patientDataForModal.vitaShade,
                ceramicType: DEFAULT_CERAMIC_TYPE,
                substrate: toothData.substrate || 'Esmalte e Dentina',
                substrateCondition: toothData.substrate_condition || 'Saudável',
                aestheticGoals: patientDataForModal.aestheticGoals || undefined,
              } : undefined,
              genericToothData: toothData,
            },
            evalClients,
          );
        }

        // Update status to draft
        await evaluations.updateStatus(evaluation.id, EVALUATION_STATUS.DRAFT);

        treatmentCounts[treatmentType] = (treatmentCounts[treatmentType] || 0) + 1;
        results.push({ tooth: toothNumber, success: true });
      } catch (err) {
        logger.error(`Error processing tooth ${toothNumber}:`, err);
        results.push({ tooth: toothNumber, success: false, error: (err as Error).message });

        // Mark any evaluation still in 'analyzing' for this tooth as error
        for (const eid of newEvalIds) {
          try {
            const evalData = await evaluations.getById(eid);
            if (evalData?.tooth === toothNumber && evalData?.status === EVALUATION_STATUS.ANALYZING) {
              await evaluations.updateStatus(eid, EVALUATION_STATUS.ERROR);
            }
          } catch (statusError) {
            logger.error(`Failed to mark evaluation for tooth ${toothNumber} as error:`, statusError);
          }
        }
      }
    }

    // Determine outcome
    const failed = results.filter(r => !r.success);
    const succeeded = results.filter(r => r.success);

    // Update failedTeeth state for UI retry
    setFailedTeeth(failed.map(f => f.tooth));

    if (failed.length === results.length) {
      // Total failure — all teeth failed
      toast.error(t('toasts.evaluationDetail.addTeethError', 'Erro ao adicionar dentes. Tente novamente.'));
    } else if (failed.length > 0) {
      // Partial success — some teeth succeeded, some failed
      toast.warning(
        `${succeeded.length} de ${results.length} dentes processados. ${failed.length} falharam — tente novamente.`,
        { duration: 10000 },
      );
      handleAddTeethSuccess();
    } else {
      // Full success — all teeth processed
      const treatmentMessages = Object.entries(treatmentCounts)
        .map(([type, count]) => `${count} ${TREATMENT_LABEL_KEYS[type as TreatmentType] ? t(TREATMENT_LABEL_KEYS[type as TreatmentType]) : type}`)
        .join(', ');

      toast.success(t('components.addTeeth.casesAdded', { details: treatmentMessages }));
      handleAddTeethSuccess();
    }

    // Re-sync protocols across ALL evaluations in this session (P1-34)
    // Combines existing + newly added IDs so late additions get same protocol.
    if (succeeded.length > 0) {
      try {
        const existingEvalIds = (evals || []).map(e => e.id);
        const allEvalIds = [...new Set([...existingEvalIds, ...newEvalIds])];
        if (allEvalIds.length >= 2) {
          await wizard.syncGroupProtocols(sessionId, allEvalIds);
        }
      } catch (syncError) {
        logger.warn('Post-add protocol sync failed (non-critical):', syncError);
      }
    }

    // Always clean up pending teeth that were successfully processed
    // Keep failed teeth in pending so they can be retried
    try {
      const succeededTeeth = succeeded.map(r => r.tooth);
      if (succeededTeeth.length > 0) {
        await evaluations.deletePendingTeeth(sessionId, succeededTeeth);
      }
    } catch (deleteError) {
      logger.error('Error deleting pending teeth:', deleteError);
    }
  }, [user, sessionId, patientDataForModal, evals, handleAddTeethSuccess, evalClients, t]);

  return {
    failedTeeth,
    handleSubmitTeeth,
  };
}
