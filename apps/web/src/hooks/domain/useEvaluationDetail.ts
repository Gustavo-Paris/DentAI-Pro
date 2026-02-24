import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { evaluations, wizard } from '@/data';
import { getFullRegion, getGenericProtocol } from './wizard/helpers';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logger } from '@/lib/logger';
import { trackEvent } from '@/lib/analytics';
import { QUERY_STALE_TIMES } from '@/lib/constants';

import type { StratificationProtocol, CementationProtocol } from '@/types/protocol';
import type { PendingTooth, TreatmentType, SubmitTeethPayload } from '@/components/AddTeethModal';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const evaluationKeys = {
  all: ['evaluations'] as const,
  lists: () => [...evaluationKeys.all, 'list'] as const,
  sessions: () => [...evaluationKeys.all, 'sessions'] as const,
  session: (id: string) => [...evaluationKeys.sessions(), id] as const,
  details: () => [...evaluationKeys.all, 'detail'] as const,
  detail: (id: string) => [...evaluationKeys.details(), id] as const,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EvaluationItem {
  id: string;
  created_at: string;
  patient_name: string | null;
  patient_id: string | null;
  patient_age: number;
  tooth: string;
  cavity_class: string;
  restoration_size: string;
  status: string | null;
  photo_frontal: string | null;
  checklist_progress: number[] | null;
  stratification_protocol: StratificationProtocol | null;
  treatment_type: string | null;
  ai_treatment_indication: string | null;
  cementation_protocol: CementationProtocol | null;
  generic_protocol: { checklist?: string[] } | null;
  tooth_color: string;
  bruxism: boolean;
  aesthetic_level: string;
  budget: string;
  longevity_expectation: string;
  region?: string | null;
  substrate?: string | null;
  patient_aesthetic_goals?: string | null;
  dsd_analysis?: Record<string, unknown> | null;
  dsd_simulation_url?: string | null;
  dsd_simulation_layers?: Array<{ type: string; simulation_url: string | null; includes_gengivoplasty?: boolean }> | null;
  resins?: {
    name: string;
    manufacturer: string;
  } | null;
}

export interface ChecklistProgress {
  current: number;
  total: number;
}

export interface PatientDataForModal {
  name: string | null;
  age: number;
  id: string | null;
  vitaShade: string;
  bruxism: boolean;
  aestheticLevel: string;
  budget: string;
  longevityExpectation: string;
  photoPath: string | null;
  aestheticGoals: string | null;
}

export interface EvaluationDetailState {
  sessionId: string;
  evaluations: EvaluationItem[];
  isLoading: boolean;
  pendingTeeth: PendingTooth[];
  showAddTeethModal: boolean;
  isSharing: boolean;
  patientName: string;
  evaluationDate: string;
  evaluationDateShort: string;
  completedCount: number;
  patientDataForModal: PatientDataForModal | null;
  selectedIds: Set<string>;
  failedTeeth: string[];
}

export interface PendingChecklistResult {
  pending: true;
  current: number;
  total: number;
}

export interface EvaluationDetailActions {
  handleMarkAsCompleted: (id: string, force?: boolean) => PendingChecklistResult | void;
  handleMarkAllAsCompleted: () => void;
  handleBulkComplete: (ids: string[]) => void;
  handleExportPDF: (id: string) => void;
  handleShareCase: () => void;
  handleDeleteSession: () => Promise<void>;
  setShowAddTeethModal: (show: boolean) => void;
  handleAddTeethSuccess: () => void;
  handleSubmitTeeth: (payload: SubmitTeethPayload) => Promise<void>;
  handleRetryEvaluation: (evaluationId: string) => Promise<void>;
  retryingEvaluationId: string | null;
  toggleSelection: (id: string) => void;
  toggleSelectAll: () => void;
  clearSelection: () => void;
  getChecklist: (evaluation: EvaluationItem) => string[];
  isChecklistComplete: (evaluation: EvaluationItem) => boolean;
  getChecklistProgress: (evaluation: EvaluationItem) => ChecklistProgress;
  canMarkAsCompleted: (evaluation: EvaluationItem) => boolean;
  getClinicalDetails: (evaluation: EvaluationItem) => string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TREATMENT_LABEL_KEYS: Record<TreatmentType, string> = {
  resina: 'components.wizard.review.treatmentResina',
  porcelana: 'components.wizard.review.treatmentPorcelana',
  coroa: 'components.wizard.review.treatmentCoroa',
  implante: 'components.wizard.review.treatmentImplante',
  endodontia: 'components.wizard.review.treatmentEndodontia',
  encaminhamento: 'components.wizard.review.treatmentEncaminhamento',
  gengivoplastia: 'components.wizard.review.treatmentGengivoplastia',
};

const AESTHETIC_PROCEDURES = [
  'Faceta Direta',
  'Recontorno Estético',
  'Fechamento de Diastema',
  'Reparo de Restauração',
  'Lente de Contato',
];

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useEvaluationDetail(): EvaluationDetailState & EvaluationDetailActions {
  const { evaluationId: sessionId = '' } = useParams<{ evaluationId: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ---- Queries ----
  const {
    data: rawEvaluations,
    isLoading: loadingEvaluations,
    isError: evaluationsError,
  } = useQuery({
    queryKey: evaluationKeys.session(sessionId),
    queryFn: () => evaluations.listBySession(sessionId, user!.id),
    enabled: !!user && !!sessionId,
    staleTime: QUERY_STALE_TIMES.SHORT,
    retry: 1,
  });

  const evals = useMemo(
    () => (rawEvaluations as unknown as EvaluationItem[]) || [],
    [rawEvaluations],
  );

  // Redirect if error or empty data after loading (matches original behavior)
  useEffect(() => {
    if (loadingEvaluations || !sessionId) return;
    if (evaluationsError) {
      toast.error(t('toasts.evaluationDetail.loadError'));
      navigate('/dashboard');
    } else if (rawEvaluations && rawEvaluations.length === 0) {
      toast.error(t('toasts.evaluationDetail.notFound'));
      navigate('/dashboard');
    }
  }, [loadingEvaluations, evaluationsError, rawEvaluations, sessionId, navigate]);

  const {
    data: pendingTeeth = [],
    isLoading: loadingPendingTeeth,
  } = useQuery({
    queryKey: ['pendingTeeth', sessionId],
    queryFn: () => evaluations.listPendingTeeth(sessionId, user!.id),
    enabled: !!user && !!sessionId,
    staleTime: QUERY_STALE_TIMES.SHORT,
  });

  // ---- Mutations ----
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await evaluations.updateStatus(id, status);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: evaluationKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: evaluationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: evaluationKeys.sessions() });
    },
  });

  const bulkCompleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await evaluations.updateStatusBulk(ids, 'completed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evaluationKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: evaluationKeys.lists() });
    },
  });

  // ---- Local state ----
  const [showAddTeethModal, setShowAddTeethModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [retryingEvaluationId, setRetryingEvaluationId] = useState<string | null>(null);
  const [failedTeeth, setFailedTeeth] = useState<string[]>([]);

  // ---- Computed ----
  const patientName = evals[0]?.patient_name || t('evaluation.patientNoName', { defaultValue: 'Paciente sem nome' });
  const evaluationDate = evals[0]?.created_at
    ? format(new Date(evals[0].created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '';
  const evaluationDateShort = evals[0]?.created_at
    ? format(new Date(evals[0].created_at), 'dd/MM/yyyy', { locale: ptBR })
    : '';
  const completedCount = evals.filter((e) => e.status === 'completed').length;

  const patientDataForModal = useMemo<PatientDataForModal | null>(() => {
    if (evals.length === 0) return null;
    const first = evals[0];
    return {
      name: first.patient_name,
      age: first.patient_age || 30,
      id: first.patient_id,
      vitaShade: first.tooth_color || 'A2',
      bruxism: first.bruxism || false,
      aestheticLevel: first.aesthetic_level || 'estético',
      budget: first.budget || 'padrão',
      longevityExpectation: first.longevity_expectation || 'médio',
      photoPath: first.photo_frontal,
      aestheticGoals: first.patient_aesthetic_goals ?? null,
    };
  }, [evals]);

  const isLoading = loadingEvaluations || loadingPendingTeeth;

  // ---- Helpers ----
  const getChecklist = useCallback((evaluation: EvaluationItem): string[] => {
    const treatmentType = evaluation.treatment_type || 'resina';
    switch (treatmentType) {
      case 'porcelana':
        return (evaluation.cementation_protocol as CementationProtocol)?.checklist || [];
      case 'coroa':
      case 'implante':
      case 'endodontia':
      case 'encaminhamento':
        return evaluation.generic_protocol?.checklist || [];
      default:
        return evaluation.stratification_protocol?.checklist || [];
    }
  }, []);

  const isChecklistComplete = useCallback(
    (evaluation: EvaluationItem): boolean => {
      const checklist = getChecklist(evaluation);
      const progress = evaluation.checklist_progress || [];
      if (checklist.length === 0) return true;
      return progress.length >= checklist.length;
    },
    [getChecklist],
  );

  const getChecklistProgressFn = useCallback(
    (evaluation: EvaluationItem): ChecklistProgress => {
      const checklist = getChecklist(evaluation);
      const progress = evaluation.checklist_progress || [];
      return { current: progress.length, total: checklist.length };
    },
    [getChecklist],
  );

  const canMarkAsCompleted = useCallback(
    (evaluation: EvaluationItem): boolean => {
      return evaluation.status !== 'completed';
    },
    [],
  );

  const getClinicalDetails = useCallback((evaluation: EvaluationItem): string => {
    const treatmentType = evaluation.treatment_type || 'resina';
    const showCavityInfo = treatmentType === 'resina';

    if (showCavityInfo) {
      if (AESTHETIC_PROCEDURES.includes(evaluation.cavity_class)) {
        return evaluation.cavity_class;
      }
      const cavityLabel = evaluation.cavity_class.startsWith('Classe ')
        ? evaluation.cavity_class
        : `Classe ${evaluation.cavity_class}`;
      return `${cavityLabel} • ${evaluation.restoration_size}`;
    }

    return evaluation.ai_treatment_indication || '-';
  }, []);

  // ---- Actions ----
  const handleMarkAsCompleted = useCallback(
    (id: string, force?: boolean): PendingChecklistResult | void => {
      const evaluation = evals.find((e) => e.id === id);
      if (!evaluation) return;

      if (!force && !isChecklistComplete(evaluation)) {
        const progress = getChecklistProgressFn(evaluation);
        return { pending: true, current: progress.current, total: progress.total };
      }

      updateStatusMutation.mutate(
        { id, status: 'completed' },
        {
          onSuccess: () => {
            toast.success(t('toasts.evaluationDetail.caseCompleted'));
          },
          onError: () => {
            toast.error(t('toasts.evaluationDetail.statusError'));
          },
        },
      );
    },
    [evals, isChecklistComplete, getChecklistProgressFn, updateStatusMutation],
  );

  const handleMarkAllAsCompleted = useCallback(() => {
    const pending = evals.filter((e) => e.status !== 'completed');

    if (pending.length === 0) {
      toast.info(t('toasts.evaluationDetail.allCompleted'));
      return;
    }

    const withIncompleteChecklist = pending.filter((e) => !isChecklistComplete(e)).length;

    bulkCompleteMutation.mutate(pending.map((e) => e.id), {
      onSuccess: () => {
        if (withIncompleteChecklist > 0) {
          toast.success(
            t('toasts.evaluationDetail.completedWithIncomplete', { count: pending.length, incomplete: withIncompleteChecklist }),
          );
        } else {
          toast.success(t('toasts.evaluationDetail.bulkCompleted', { count: pending.length }));
        }
        queryClient.invalidateQueries({ queryKey: evaluationKeys.session(sessionId) });
      },
      onError: () => {
        toast.error(t('toasts.evaluationDetail.statusError'));
      },
    });
  }, [evals, isChecklistComplete, bulkCompleteMutation, queryClient, sessionId]);

  const handleExportPDF = useCallback((id: string) => {
    window.open(`/result/${id}?print=true`, '_blank');
    toast.info(t('toasts.evaluationDetail.openingPrint'));
  }, []);

  const handleShareCase = useCallback(async () => {
    if (!user || !sessionId) return;
    setIsSharing(true);

    try {
      const token = await evaluations.getOrCreateShareLink(sessionId, user.id);
      const shareUrl = `${window.location.origin}/shared/${token}`;
      await navigator.clipboard.writeText(shareUrl);
      trackEvent('evaluation_shared', { method: 'clipboard_link' });
      toast.success(t('toasts.evaluationDetail.linkCopied'), {
        description: t('toasts.evaluationDetail.linkExpiry'),
      });
    } catch (error) {
      logger.error('Error sharing case:', error);
      toast.error(t('toasts.evaluationDetail.shareError'));
    }

    setIsSharing(false);
  }, [user, sessionId]);

  const handleDeleteSession = useCallback(async () => {
    if (!user || !sessionId) return;

    try {
      await evaluations.deleteSession(sessionId, user.id);
      trackEvent('session_deleted', { session_id: sessionId });
      queryClient.invalidateQueries({ queryKey: evaluationKeys.all });
      toast.success(t('toasts.evaluationDetail.sessionDeleted'));
      navigate('/evaluations');
    } catch (error) {
      logger.error('Error deleting session:', error);
      toast.error(t('toasts.evaluationDetail.deleteError'));
    }
  }, [user, sessionId, queryClient, navigate, t]);

  const handleAddTeethSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: evaluationKeys.session(sessionId) });
    queryClient.invalidateQueries({ queryKey: ['pendingTeeth', sessionId] });
  }, [queryClient, sessionId]);

  // ---- Selection ----
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === evals.length) return new Set();
      return new Set(evals.map((e) => e.id));
    });
  }, [evals]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBulkComplete = useCallback((ids: string[]) => {
    const pending = ids.filter((id) => {
      const e = evals.find((ev) => ev.id === id);
      return e && e.status !== 'completed';
    });

    if (pending.length === 0) {
      toast.info(t('toasts.evaluationDetail.allSelectedCompleted'));
      return;
    }

    bulkCompleteMutation.mutate(pending, {
      onSuccess: () => {
        toast.success(t('toasts.evaluationDetail.bulkCompleted', { count: pending.length }));
        queryClient.invalidateQueries({ queryKey: evaluationKeys.session(sessionId) });
        setSelectedIds(new Set());
      },
      onError: () => {
        toast.error(t('toasts.evaluationDetail.statusError'));
      },
    });
  }, [evals, bulkCompleteMutation, queryClient, sessionId]);

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
          status: 'analyzing',
          treatment_type: treatmentType,
          desired_tooth_shape: 'natural',
          ai_treatment_indication: toothData.treatment_indication,
          ai_indication_reason: toothData.indication_reason,
          tooth_bounds: toothData.tooth_bounds,
          stratification_needed: treatmentType !== 'gengivoplastia',
        };

        const evaluation = await evaluations.insertEvaluation(insertData);
        newEvalIds.push(evaluation.id);

        // Only the primary tooth per treatment group calls the AI edge function.
        // Non-primary resina/porcelana teeth skip the call — syncGroupProtocols
        // copies the protocol from the primary tooth after the loop.
        const isPrimary = primaryPerGroup[treatmentType] === toothNumber;

        // Call appropriate edge function based on treatment type
        switch (treatmentType) {
          case 'porcelana':
            if (isPrimary) {
              await evaluations.invokeEdgeFunction('recommend-cementation', {
                evaluationId: evaluation.id,
                teeth: [toothNumber],
                shade: patientDataForModal.vitaShade,
                ceramicType: 'Dissilicato de lítio',
                substrate: toothData.substrate || 'Esmalte e Dentina',
                substrateCondition: toothData.substrate_condition || 'Saudável',
                aestheticGoals: patientDataForModal.aestheticGoals || undefined,
              });
            }
            break;

          case 'resina':
            if (isPrimary) {
              await evaluations.invokeEdgeFunction('recommend-resin', {
                evaluationId: evaluation.id,
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
              });
            }
            break;

          case 'implante':
          case 'coroa':
          case 'endodontia':
          case 'encaminhamento': {
            // Generic treatments don't call edge functions — always execute
            const genericProtocol = getGenericProtocol(treatmentType, toothNumber, toothData);
            await evaluations.updateEvaluation(evaluation.id, {
              generic_protocol: genericProtocol,
              recommendation_text: genericProtocol.summary,
            });
            break;
          }
        }

        // Update status to draft
        await evaluations.updateStatus(evaluation.id, 'draft');

        treatmentCounts[treatmentType] = (treatmentCounts[treatmentType] || 0) + 1;
        results.push({ tooth: toothNumber, success: true });
      } catch (err) {
        logger.error(`Error processing tooth ${toothNumber}:`, err);
        results.push({ tooth: toothNumber, success: false, error: (err as Error).message });

        // Mark any evaluation still in 'analyzing' for this tooth as error
        for (const eid of newEvalIds) {
          try {
            const evalData = await evaluations.getById(eid);
            if (evalData?.tooth === toothNumber && evalData?.status === 'analyzing') {
              await evaluations.updateStatus(eid, 'error');
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
  }, [user, sessionId, patientDataForModal, evals, handleAddTeethSuccess, t]);

  // ---- Retry failed evaluation ----
  const handleRetryEvaluation = useCallback(async (evaluationId: string) => {
    if (!user) return;
    const evaluation = evals.find(e => e.id === evaluationId);
    if (!evaluation) return;

    setRetryingEvaluationId(evaluationId);
    try {
      await evaluations.updateStatus(evaluationId, 'analyzing');
      queryClient.invalidateQueries({ queryKey: evaluationKeys.session(sessionId) });

      const treatmentType = evaluation.treatment_type || 'resina';
      switch (treatmentType) {
        case 'resina':
          await evaluations.invokeEdgeFunction('recommend-resin', {
            evaluationId,
            userId: user.id,
            patientAge: String(evaluation.patient_age),
            tooth: evaluation.tooth,
            region: evaluation.region || getFullRegion(evaluation.tooth),
            cavityClass: evaluation.cavity_class || 'Classe I',
            restorationSize: evaluation.restoration_size || 'Média',
            substrate: evaluation.substrate || 'Esmalte e Dentina',
            bruxism: evaluation.bruxism,
            aestheticLevel: evaluation.aesthetic_level,
            toothColor: evaluation.tooth_color,
            stratificationNeeded: true,
            budget: evaluation.budget,
            longevityExpectation: evaluation.longevity_expectation,
          });
          break;
        case 'porcelana':
          await evaluations.invokeEdgeFunction('recommend-cementation', {
            evaluationId,
            teeth: [evaluation.tooth],
            shade: evaluation.tooth_color,
            ceramicType: 'Dissilicato de lítio',
            substrate: evaluation.substrate || 'Esmalte e Dentina',
            substrateCondition: 'Saudável',
          });
          break;
        default: {
          const genericProtocol = getGenericProtocol(
            treatmentType as TreatmentType,
            evaluation.tooth,
            { indication_reason: evaluation.ai_indication_reason },
          );
          await evaluations.updateEvaluation(evaluationId, {
            generic_protocol: genericProtocol,
            recommendation_text: genericProtocol.summary,
          });
          break;
        }
      }

      await evaluations.updateStatus(evaluationId, 'draft');

      // Sync protocols so the retried tooth joins the group
      const allEvalIds = evals.map(e => e.id);
      if (allEvalIds.length >= 2) {
        try {
          await wizard.syncGroupProtocols(sessionId, allEvalIds);
        } catch (syncError) {
          logger.warn('Post-retry protocol sync failed (non-critical):', syncError);
        }
      }

      queryClient.invalidateQueries({ queryKey: evaluationKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: evaluationKeys.lists() });
      toast.success(t('toasts.evaluationDetail.retrySuccess', { defaultValue: 'Protocolo regenerado com sucesso' }));
    } catch (error) {
      logger.error('Error retrying evaluation:', error);
      await evaluations.updateStatus(evaluationId, 'error').catch(() => {});
      toast.error(t('toasts.evaluationDetail.retryError', { defaultValue: 'Erro ao reprocessar. Tente novamente.' }));
    } finally {
      setRetryingEvaluationId(null);
    }
  }, [user, evals, sessionId, queryClient, t]);

  return {
    // State
    sessionId,
    evaluations: evals,
    isLoading,
    pendingTeeth: pendingTeeth as PendingTooth[],
    showAddTeethModal,
    isSharing,
    patientName,
    evaluationDate,
    evaluationDateShort,
    completedCount,
    patientDataForModal,
    selectedIds,
    failedTeeth,

    // Actions
    handleMarkAsCompleted,
    handleMarkAllAsCompleted,
    handleBulkComplete,
    handleExportPDF,
    handleShareCase,
    handleDeleteSession,
    setShowAddTeethModal,
    handleAddTeethSuccess,
    handleSubmitTeeth,
    handleRetryEvaluation,
    retryingEvaluationId,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    getChecklist,
    isChecklistComplete,
    getChecklistProgress: getChecklistProgressFn,
    canMarkAsCompleted,
    getClinicalDetails,
  };
}
