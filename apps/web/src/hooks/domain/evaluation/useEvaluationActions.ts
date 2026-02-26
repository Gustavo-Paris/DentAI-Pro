import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { evaluations, wizard } from '@/data';
import { useTranslation } from 'react-i18next';
import {
  dispatchTreatmentProtocol,
  DEFAULT_CERAMIC_TYPE,
  type ProtocolDispatchClients,
} from '@/lib/protocol-dispatch';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { trackEvent } from '@/lib/analytics';
import { EVALUATION_STATUS } from '@/lib/evaluation-status';
import { getFullRegion } from '../wizard/helpers';

import { evaluationKeys } from './useEvaluationData';
import type { EvaluationItem, PendingChecklistResult } from '../useEvaluationDetail';
import type { TreatmentType } from '@/components/AddTeethModal';
import type { User } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface UseEvaluationActionsReturn {
  showAddTeethModal: boolean;
  setShowAddTeethModal: (show: boolean) => void;
  isSharing: boolean;
  retryingEvaluationId: string | null;
  isRegenerating: boolean;
  handleMarkAsCompleted: (id: string, force?: boolean) => PendingChecklistResult | void;
  handleMarkAllAsCompleted: () => void;
  handleBulkComplete: (ids: string[]) => void;
  handleExportPDF: (id: string) => void;
  handleShareCase: () => void;
  handleDeleteSession: () => Promise<void>;
  handleAddTeethSuccess: () => void;
  handleRetryEvaluation: (evaluationId: string) => Promise<void>;
  handleRegenerateWithBudget: (newBudget: 'padrão' | 'premium') => Promise<void>;
}

// ---------------------------------------------------------------------------
// Deps
// ---------------------------------------------------------------------------

export interface UseEvaluationActionsDeps {
  sessionId: string;
  user: User | null;
  evals: EvaluationItem[];
  isChecklistComplete: (evaluation: EvaluationItem) => boolean;
  getChecklistProgress: (evaluation: EvaluationItem) => { current: number; total: number };
  clearSelection: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useEvaluationActions(deps: UseEvaluationActionsDeps): UseEvaluationActionsReturn {
  const { sessionId, user, evals, isChecklistComplete, getChecklistProgress, clearSelection } = deps;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ---- Mutations ----
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await evaluations.updateStatus(id, status);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: evaluationKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: evaluationKeys.session(sessionId) });
      queryClient.invalidateQueries({ queryKey: evaluationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: evaluationKeys.sessions() });
    },
  });

  const bulkCompleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await evaluations.updateStatusBulk(ids, EVALUATION_STATUS.COMPLETED);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evaluationKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: evaluationKeys.lists() });
    },
  });

  // ---- Local state ----
  const [showAddTeethModal, setShowAddTeethModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [retryingEvaluationId, setRetryingEvaluationId] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // ---- Data-client adapters for protocol dispatch ----
  const evalClients: ProtocolDispatchClients = useMemo(() => ({
    invokeResin: (p) => evaluations.invokeEdgeFunction('recommend-resin', p as unknown as Record<string, unknown>),
    invokeCementation: (p) => evaluations.invokeEdgeFunction('recommend-cementation', p as unknown as Record<string, unknown>),
    saveGenericProtocol: async (id, protocol) => {
      await evaluations.updateEvaluation(id, {
        generic_protocol: protocol,
        recommendation_text: protocol.summary,
      });
    },
  }), []);

  // ---- Actions ----
  const handleMarkAsCompleted = useCallback(
    (id: string, force?: boolean): PendingChecklistResult | void => {
      const evaluation = evals.find((e) => e.id === id);
      if (!evaluation) return;

      if (!force && !isChecklistComplete(evaluation)) {
        const progress = getChecklistProgress(evaluation);
        return { pending: true, current: progress.current, total: progress.total };
      }

      updateStatusMutation.mutate(
        { id, status: EVALUATION_STATUS.COMPLETED },
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
    [evals, isChecklistComplete, getChecklistProgress, updateStatusMutation],
  );

  const handleMarkAllAsCompleted = useCallback(() => {
    const pending = evals.filter((e) => e.status !== EVALUATION_STATUS.COMPLETED);

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
    } finally {
      setIsSharing(false);
    }
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

  const handleBulkComplete = useCallback((ids: string[]) => {
    const pending = ids.filter((id) => {
      const e = evals.find((ev) => ev.id === id);
      return e && e.status !== EVALUATION_STATUS.COMPLETED;
    });

    if (pending.length === 0) {
      toast.info(t('toasts.evaluationDetail.allSelectedCompleted'));
      return;
    }

    bulkCompleteMutation.mutate(pending, {
      onSuccess: () => {
        toast.success(t('toasts.evaluationDetail.bulkCompleted', { count: pending.length }));
        queryClient.invalidateQueries({ queryKey: evaluationKeys.session(sessionId) });
        clearSelection();
      },
      onError: () => {
        toast.error(t('toasts.evaluationDetail.statusError'));
      },
    });
  }, [evals, bulkCompleteMutation, queryClient, sessionId, clearSelection]);

  // ---- Retry failed evaluation ----
  const handleRetryEvaluation = useCallback(async (evaluationId: string) => {
    if (!user) return;
    const evaluation = evals.find(e => e.id === evaluationId);
    if (!evaluation) return;

    setRetryingEvaluationId(evaluationId);
    try {
      await evaluations.updateStatus(evaluationId, EVALUATION_STATUS.ANALYZING);
      queryClient.invalidateQueries({ queryKey: evaluationKeys.session(sessionId) });

      const treatmentType = (evaluation.treatment_type || 'resina') as TreatmentType;
      await dispatchTreatmentProtocol(
        {
          treatmentType,
          evaluationId,
          tooth: evaluation.tooth,
          resinParams: treatmentType === 'resina' ? {
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
          } : undefined,
          cementationParams: treatmentType === 'porcelana' ? {
            teeth: [evaluation.tooth],
            shade: evaluation.tooth_color,
            ceramicType: DEFAULT_CERAMIC_TYPE,
            substrate: evaluation.substrate || 'Esmalte e Dentina',
            substrateCondition: 'Saudável',
          } : undefined,
          genericToothData: { indication_reason: evaluation.ai_indication_reason },
        },
        evalClients,
      );

      await evaluations.updateStatus(evaluationId, EVALUATION_STATUS.DRAFT);

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
      await evaluations.updateStatus(evaluationId, EVALUATION_STATUS.ERROR).catch(() => {});
      toast.error(t('toasts.evaluationDetail.retryError', { defaultValue: 'Erro ao reprocessar. Tente novamente.' }));
    } finally {
      setRetryingEvaluationId(null);
    }
  }, [user, evals, sessionId, queryClient, evalClients, t]);

  // ---- Regenerate all protocols with different budget tier ----
  const handleRegenerateWithBudget = useCallback(async (newBudget: 'padrão' | 'premium') => {
    if (!user || evals.length === 0) return;

    setIsRegenerating(true);
    const newAestheticLevel = newBudget === 'premium' ? 'estético' : 'funcional';

    try {
      // 1. Update all evaluations with new budget
      const allIds = evals.map(e => e.id);
      await evaluations.updateEvaluationsBulk(allIds, {
        budget: newBudget,
        aesthetic_level: newAestheticLevel,
      });

      // 2. Retry each resina/porcelana evaluation sequentially
      const aiEvals = evals.filter(e =>
        e.treatment_type === 'resina' || e.treatment_type === 'porcelana'
      );

      let successCount = 0;
      for (const evaluation of aiEvals) {
        try {
          await evaluations.updateStatus(evaluation.id, EVALUATION_STATUS.ANALYZING);

          const regenTreatment = (evaluation.treatment_type || 'resina') as TreatmentType;
          await dispatchTreatmentProtocol(
            {
              treatmentType: regenTreatment,
              evaluationId: evaluation.id,
              tooth: evaluation.tooth,
              resinParams: regenTreatment === 'resina' ? {
                userId: user.id,
                patientAge: String(evaluation.patient_age),
                tooth: evaluation.tooth,
                region: evaluation.region || getFullRegion(evaluation.tooth),
                cavityClass: evaluation.cavity_class || 'Classe I',
                restorationSize: evaluation.restoration_size || 'Média',
                substrate: evaluation.substrate || 'Esmalte e Dentina',
                bruxism: evaluation.bruxism,
                aestheticLevel: newAestheticLevel,
                toothColor: evaluation.tooth_color,
                stratificationNeeded: true,
                budget: newBudget,
                longevityExpectation: evaluation.longevity_expectation,
                aestheticGoals: evaluation.patient_aesthetic_goals || undefined,
              } : undefined,
              cementationParams: regenTreatment === 'porcelana' ? {
                teeth: [evaluation.tooth],
                shade: evaluation.tooth_color,
                ceramicType: DEFAULT_CERAMIC_TYPE,
                substrate: evaluation.substrate || 'Esmalte e Dentina',
                substrateCondition: 'Saudável',
                aestheticGoals: evaluation.patient_aesthetic_goals || undefined,
              } : undefined,
            },
            evalClients,
          );

          await evaluations.updateStatus(evaluation.id, EVALUATION_STATUS.DRAFT);
          successCount++;
        } catch (err) {
          logger.error(`Regenerate failed for ${evaluation.tooth}:`, err);
          await evaluations.updateStatus(evaluation.id, EVALUATION_STATUS.ERROR).catch(() => {});
        }
      }

      // 3. Sync protocols across group
      if (successCount >= 2) {
        try {
          await wizard.syncGroupProtocols(sessionId, allIds);
        } catch (syncError) {
          logger.warn('Post-regenerate sync failed:', syncError);
        }
      }

      // 4. Refresh and notify
      queryClient.invalidateQueries({ queryKey: evaluationKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: evaluationKeys.lists() });

      const budgetLabel = newBudget === 'premium'
        ? t('toasts.evaluationDetail.budgetPremium', { defaultValue: 'Premium' })
        : t('toasts.evaluationDetail.budgetStandard', { defaultValue: 'Padrão' });
      toast.success(
        t('toasts.evaluationDetail.regenerateSuccess', {
          count: successCount,
          budget: budgetLabel,
          defaultValue: '{{count}} protocolo(s) regenerado(s) como {{budget}}',
        }),
      );
    } catch (error) {
      logger.error('Regeneration failed:', error);
      toast.error(
        t('toasts.evaluationDetail.regenerateError', {
          defaultValue: 'Erro ao regenerar protocolos. Tente novamente.',
        }),
      );
    } finally {
      setIsRegenerating(false);
      queryClient.invalidateQueries({ queryKey: evaluationKeys.session(sessionId) });
    }
  }, [user, evals, sessionId, queryClient, evalClients, t]);

  return {
    showAddTeethModal,
    setShowAddTeethModal,
    isSharing,
    retryingEvaluationId,
    isRegenerating,
    handleMarkAsCompleted,
    handleMarkAllAsCompleted,
    handleBulkComplete,
    handleExportPDF,
    handleShareCase,
    handleDeleteSession,
    handleAddTeethSuccess,
    handleRetryEvaluation,
    handleRegenerateWithBudget,
  };
}
