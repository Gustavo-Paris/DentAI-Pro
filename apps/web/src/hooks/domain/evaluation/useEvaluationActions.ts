import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { evaluations, wizard } from '@/data';
import { useTranslation } from 'react-i18next';
import {
  dispatchTreatmentProtocol,
  DEFAULT_CERAMIC_TYPE,
  evaluationClients,
} from '@/lib/protocol-dispatch';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { trackEvent } from '@/lib/analytics';
import { EVALUATION_STATUS } from '@/lib/evaluation-status';
import { withRetry } from '@/lib/retry';
import { getFullRegion } from '../wizard/helpers';

import { evaluationKeys, pendingTeethKeys } from '@/lib/query-keys';
import { resolveAestheticGoalsForAI } from '@/lib/aesthetic-goals';
import type { EvaluationItem, PendingChecklistResult } from '../useEvaluationDetail';
import type { TreatmentType } from '@/types/evaluation';
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
  regenerationProgress: { current: number; total: number } | null;
  handleMarkAsCompleted: (id: string, force?: boolean) => PendingChecklistResult | void;
  handleMarkAllAsCompleted: () => void;
  handleBulkComplete: (ids: string[]) => void;
  handleExportPDF: (id: string) => void;
  handleShareCase: () => void;
  handleShareWhatsApp: () => void;
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
  const [regenerationProgress, setRegenerationProgress] = useState<{ current: number; total: number } | null>(null);

  // Use shared evaluation clients from protocol-dispatch
  const evalClients = evaluationClients;

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
    [evals, isChecklistComplete, getChecklistProgress, updateStatusMutation, t],
  );

  const handleMarkAllAsCompleted = useCallback(() => {
    const pending = evals.filter((e) =>
      e.status !== EVALUATION_STATUS.COMPLETED && isChecklistComplete(e)
    );

    if (pending.length === 0) {
      toast.info(t('toasts.evaluationDetail.allCompleted'));
      return;
    }

    bulkCompleteMutation.mutate(pending.map((e) => e.id), {
      onSuccess: () => {
        toast.success(t('toasts.evaluationDetail.bulkCompleted', { count: pending.length }));
        queryClient.invalidateQueries({ queryKey: evaluationKeys.session(sessionId) });
      },
      onError: () => {
        toast.error(t('toasts.evaluationDetail.statusError'));
      },
    });
  }, [evals, isChecklistComplete, bulkCompleteMutation, queryClient, sessionId, t]);

  const handleExportPDF = useCallback((id: string) => {
    window.open(`/result/${id}?print=true`, '_blank');
    toast.info(t('toasts.evaluationDetail.openingPrint'));
  }, [t]);

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
  }, [user, sessionId, t]);

  const handleShareWhatsApp = useCallback(async () => {
    if (!user || !sessionId) return;
    setIsSharing(true);

    try {
      const token = await evaluations.getOrCreateShareLink(sessionId, user.id);
      const shareUrl = `${window.location.origin}/shared/${token}`;
      const message = t('toasts.evaluationDetail.whatsappMessage', { url: shareUrl });
      const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      trackEvent('evaluation_shared', { method: 'whatsapp' });
    } catch (error) {
      logger.error('Error sharing via WhatsApp:', error);
      toast.error(t('toasts.evaluationDetail.shareError'));
    } finally {
      setIsSharing(false);
    }
  }, [user, sessionId, t]);

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
    queryClient.invalidateQueries({ queryKey: pendingTeethKeys.session(sessionId) });
  }, [queryClient, sessionId]);

  const handleBulkComplete = useCallback((ids: string[]) => {
    const pending = ids.filter((id) => {
      const e = evals.find((ev) => ev.id === id);
      return e && e.status !== EVALUATION_STATUS.COMPLETED && isChecklistComplete(e);
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
  }, [evals, isChecklistComplete, bulkCompleteMutation, queryClient, sessionId, clearSelection, t]);

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
      const operationId = `${evaluationId}:${evaluation.tooth}:protocol`;
      await withRetry(
        () => dispatchTreatmentProtocol(
          {
            treatmentType,
            evaluationId,
            tooth: evaluation.tooth,
            operationId,
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
              substrateCondition: evaluation.substrate_condition ?? undefined,
              enamelCondition: evaluation.enamel_condition ?? undefined,
              depth: evaluation.depth ?? undefined,
              aestheticGoals: resolveAestheticGoalsForAI(evaluation.patient_aesthetic_goals),
              anamnesis: evaluation.anamnesis ?? undefined,
            } : undefined,
            cementationParams: treatmentType === 'porcelana' ? {
              teeth: [evaluation.tooth],
              shade: evaluation.tooth_color,
              ceramicType: DEFAULT_CERAMIC_TYPE,
              substrate: evaluation.substrate || 'Esmalte e Dentina',
              substrateCondition: 'Saudável',
              aestheticGoals: resolveAestheticGoalsForAI(evaluation.patient_aesthetic_goals),
              anamnesis: evaluation.anamnesis ?? undefined,
            } : undefined,
            genericToothData: { indication_reason: evaluation.ai_indication_reason },
          },
          evalClients,
        ),
        {
          maxRetries: 2,
          baseDelay: 2000,
          onRetry: (attempt, err) => {
            logger.warn(`Retry ${attempt} for evaluation ${evaluationId}:`, err);
          },
        },
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
      toast.success(t('toasts.evaluationDetail.retrySuccess'));
    } catch (error) {
      logger.error('Error retrying evaluation:', error);
      await evaluations.updateStatus(evaluationId, EVALUATION_STATUS.ERROR).catch((err) => logger.warn('Failed to update evaluation status', { err }));
      toast.error(t('toasts.evaluationDetail.retryError'));
    } finally {
      setRetryingEvaluationId(null);
    }
  }, [user, evals, sessionId, queryClient, evalClients, t]);

  // ---- Regenerate all protocols with different budget tier ----
  const handleRegenerateWithBudget = useCallback(async (newBudget: 'padrão' | 'premium') => {
    if (!user || evals.length === 0) return;

    setIsRegenerating(true);
    const newAestheticLevel = newBudget === 'premium' ? 'estético' : 'funcional';

    let successCount = 0;

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

      setRegenerationProgress({ current: 0, total: aiEvals.length });

      for (const evaluation of aiEvals) {
        try {
          await evaluations.updateStatus(evaluation.id, EVALUATION_STATUS.ANALYZING);
          queryClient.invalidateQueries({ queryKey: evaluationKeys.session(sessionId) });

          const regenTreatment = (evaluation.treatment_type || 'resina') as TreatmentType;
          const operationId = `${evaluation.id}:${evaluation.tooth}:protocol`;
          await dispatchTreatmentProtocol(
            {
              treatmentType: regenTreatment,
              evaluationId: evaluation.id,
              tooth: evaluation.tooth,
              operationId,
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
                aestheticGoals: resolveAestheticGoalsForAI(evaluation.patient_aesthetic_goals),
                substrateCondition: evaluation.substrate_condition ?? undefined,
                enamelCondition: evaluation.enamel_condition ?? undefined,
                depth: evaluation.depth ?? undefined,
                anamnesis: evaluation.anamnesis ?? undefined,
              } : undefined,
              cementationParams: regenTreatment === 'porcelana' ? {
                teeth: [evaluation.tooth],
                shade: evaluation.tooth_color,
                ceramicType: DEFAULT_CERAMIC_TYPE,
                substrate: evaluation.substrate || 'Esmalte e Dentina',
                substrateCondition: 'Saudável',
                aestheticGoals: resolveAestheticGoalsForAI(evaluation.patient_aesthetic_goals),
                anamnesis: evaluation.anamnesis ?? undefined,
              } : undefined,
            },
            evalClients,
          );

          await evaluations.updateStatus(evaluation.id, EVALUATION_STATUS.DRAFT);
          successCount++;
          setRegenerationProgress({ current: successCount, total: aiEvals.length });
          queryClient.invalidateQueries({ queryKey: evaluationKeys.session(sessionId) });
        } catch (err) {
          logger.error(`Regenerate failed for ${evaluation.tooth}:`, err);
          await evaluations.updateStatus(evaluation.id, EVALUATION_STATUS.ERROR).catch((err) => logger.warn('Failed to update evaluation status', { err }));
        }
      }

      // If no evaluations succeeded, throw to trigger error handling
      if (successCount === 0 && aiEvals.length > 0) {
        throw new Error('All regenerations failed');
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
        ? t('toasts.evaluationDetail.budgetPremium')
        : t('toasts.evaluationDetail.budgetStandard');
      const failedCount = aiEvals.length - successCount;
      if (failedCount > 0) {
        toast.warning(
          t('toasts.evaluationDetail.partialRegenError', { count: successCount }),
        );
      } else {
        toast.success(
          t('toasts.evaluationDetail.regenerateSuccess', {
            count: successCount,
            budget: budgetLabel,
          }),
        );
      }
    } catch (error) {
      logger.error('Regeneration failed:', error);
      if (successCount > 0) {
        toast.warning(
          t('toasts.evaluationDetail.partialRegenError', { count: successCount }),
        );
      } else {
        toast.error(
          t('toasts.evaluationDetail.regenerateError', {
            }),
        );
      }
    } finally {
      setIsRegenerating(false);
      setRegenerationProgress(null);
      queryClient.invalidateQueries({ queryKey: evaluationKeys.session(sessionId) });
    }
  }, [user, evals, sessionId, queryClient, evalClients, t]);

  return {
    showAddTeethModal,
    setShowAddTeethModal,
    isSharing,
    retryingEvaluationId,
    isRegenerating,
    regenerationProgress,
    handleMarkAsCompleted,
    handleMarkAllAsCompleted,
    handleBulkComplete,
    handleExportPDF,
    handleShareCase,
    handleShareWhatsApp,
    handleDeleteSession,
    handleAddTeethSuccess,
    handleRetryEvaluation,
    handleRegenerateWithBudget,
  };
}
