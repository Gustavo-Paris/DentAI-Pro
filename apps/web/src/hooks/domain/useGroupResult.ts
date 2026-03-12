import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { evaluations, storage, wizard } from '@/data';
import type { SessionEvaluationRow } from '@/data/evaluations';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
import { EVALUATION_STATUS } from '@/lib/evaluation-status';
import { SIGNED_URL_EXPIRY_SECONDS, QUERY_STALE_TIMES, QUERY_GC_TIMES } from '@/lib/constants';
import { getProtocolFingerprint } from '@/lib/protocol-fingerprint';
import { computeProtocol } from './protocolComputed';
import {
  dispatchTreatmentProtocol,
  DEFAULT_CERAMIC_TYPE,
  evaluationClients,
} from '@/lib/protocol-dispatch';
import { getFullRegion } from './wizard/helpers';
import { resolveAestheticGoalsForAI } from '@/lib/aesthetic-goals';
import { groupResultKeys } from '@/lib/query-keys';

// getProtocolFingerprint imported from @/lib/protocol-fingerprint — single source of truth

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGroupResult() {
  const { sessionId = '', fingerprint = '' } = useParams<{ sessionId: string; fingerprint: string }>();
  const decodedFingerprint = decodeURIComponent(fingerprint);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Load all evaluations for the session
  const { data: allEvaluations, isLoading, isError, error } = useQuery({
    queryKey: groupResultKeys.detail(sessionId),
    queryFn: () => evaluations.listBySession(sessionId, user!.id),
    enabled: !!user && !!sessionId,
    staleTime: QUERY_STALE_TIMES.SHORT,
    gcTime: QUERY_GC_TIMES.PHI_SENSITIVE,
  });

  // Filter to evaluations matching the fingerprint
  const groupEvaluations = useMemo(() => {
    if (!allEvaluations) return [];
    return allEvaluations.filter(
      ev => getProtocolFingerprint(ev) === decodedFingerprint
    );
  }, [allEvaluations, decodedFingerprint]);

  // Use first evaluation as the protocol source
  const primaryEval = groupEvaluations[0] || null;
  const groupTeeth = groupEvaluations.map(ev => ev.tooth === 'GENGIVO' ? t('odontogram.gingiva') : ev.tooth);

  // Protocol data (from first evaluation — they're identical in the group)
  const pc = useMemo(() => computeProtocol(primaryEval), [primaryEval]);
  const {
    treatmentType, isPorcelain, isSpecialTreatment,
    cementationProtocol, genericProtocol, layers,
    checklist, alerts, warnings, confidence,
    protocolAlternative, resin, hasProtocol, currentTreatmentStyle,
  } = pc;
  const protocol = pc.protocol;

  // Signed photo URL
  const { data: photoUrl = null } = useQuery({
    queryKey: groupResultKeys.photo(primaryEval?.photo_frontal),
    queryFn: async () => {
      if (!primaryEval?.photo_frontal) return null;
      return storage.getSignedPhotoUrl(primaryEval.photo_frontal, SIGNED_URL_EXPIRY_SECONDS);
    },
    enabled: !!primaryEval?.photo_frontal,
    staleTime: (SIGNED_URL_EXPIRY_SECONDS - 60) * 1000,
  });

  // DSD simulation signed URL
  const { data: dsdSimulationUrl = null } = useQuery({
    queryKey: groupResultKeys.dsdUrl(primaryEval?.id),
    queryFn: async () => {
      if (!primaryEval?.dsd_simulation_url) return null;
      return storage.getSignedDSDUrl(primaryEval.dsd_simulation_url, SIGNED_URL_EXPIRY_SECONDS);
    },
    enabled: !!primaryEval?.dsd_simulation_url,
    staleTime: (SIGNED_URL_EXPIRY_SECONDS - 60) * 1000,
  });

  // DSD layer signed URLs
  const { data: dsdLayerUrls = {} } = useQuery({
    queryKey: groupResultKeys.dsdLayers(primaryEval?.id),
    queryFn: async () => {
      if (!primaryEval?.dsd_simulation_layers?.length) return {};
      const urls: Record<string, string> = {};
      const storagePaths: string[] = [];
      for (const layer of primaryEval.dsd_simulation_layers) {
        if (!layer.simulation_url) continue;
        if (layer.simulation_url.startsWith('data:') || layer.simulation_url.startsWith('http')) {
          urls[layer.type] = layer.simulation_url;
        } else {
          storagePaths.push(layer.simulation_url);
        }
      }
      if (storagePaths.length > 0) {
        const urlsByPath = await storage.getSignedDSDLayerUrls(storagePaths, SIGNED_URL_EXPIRY_SECONDS);
        for (const layer of primaryEval.dsd_simulation_layers) {
          if (layer.simulation_url && urlsByPath[layer.simulation_url]) {
            urls[layer.type] = urlsByPath[layer.simulation_url];
          }
        }
      }
      return urls;
    },
    enabled: !!primaryEval?.dsd_simulation_layers?.length,
    staleTime: (SIGNED_URL_EXPIRY_SECONDS - 60) * 1000,
  });

  // Unified checklist: checking an item updates ALL evaluations in the group
  const checklistMutation = useMutation({
    mutationFn: async (indices: number[]) => {
      if (!user) throw new Error('User not authenticated');
      const ids = groupEvaluations.map(ev => ev.id);
      await evaluations.updateChecklistBulk(ids, user.id, indices);
    },
    onMutate: async (indices) => {
      await queryClient.cancelQueries({ queryKey: groupResultKeys.detail(sessionId) });
      const previousData = queryClient.getQueryData(groupResultKeys.detail(sessionId));
      // Optimistic update: set checklist_progress on all group evaluations
      queryClient.setQueryData(groupResultKeys.detail(sessionId), (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.map((ev: SessionEvaluationRow) =>
          groupEvaluations.some(ge => ge.id === ev.id)
            ? { ...ev, checklist_progress: indices }
            : ev,
        );
      });
      return { previousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupResultKeys.detail(sessionId) });
    },
    onError: (_err, _vars, context) => {
      // Rollback to previous data on error
      if (context?.previousData) {
        queryClient.setQueryData(groupResultKeys.detail(sessionId), context.previousData);
      }
      logger.error('Error saving group checklist progress');
      toast.error(t('toasts.result.saveError'));
    },
  });

  const handleChecklistChange = useCallback((indices: number[]) => {
    checklistMutation.mutate(indices);
  }, [checklistMutation]);

  // Retry protocol generation for the primary evaluation (in-place, no navigation)
  const [isRetrying, setIsRetrying] = useState(false);
  const handleRetryProtocol = useCallback(async () => {
    if (!user || !primaryEval) return;
    setIsRetrying(true);
    try {
      await evaluations.updateStatus(primaryEval.id, EVALUATION_STATUS.ANALYZING);
      const treatmentType = (primaryEval.treatment_type || 'resina') as 'resina' | 'porcelana';
      const operationId = `${primaryEval.id}:${primaryEval.tooth}:protocol`;
      await dispatchTreatmentProtocol(
        {
          treatmentType,
          evaluationId: primaryEval.id,
          tooth: primaryEval.tooth,
          operationId,
          resinParams: treatmentType === 'resina' ? {
            userId: user.id,
            patientAge: String(primaryEval.patient_age),
            tooth: primaryEval.tooth,
            region: primaryEval.region || getFullRegion(primaryEval.tooth),
            cavityClass: primaryEval.cavity_class || 'Classe I',
            restorationSize: primaryEval.restoration_size || 'Média',
            substrate: primaryEval.substrate || 'Esmalte e Dentina',
            substrateCondition: primaryEval.substrate_condition ?? undefined,
            enamelCondition: primaryEval.enamel_condition ?? undefined,
            depth: primaryEval.depth ?? undefined,
            bruxism: primaryEval.bruxism,
            aestheticLevel: primaryEval.aesthetic_level,
            toothColor: primaryEval.tooth_color,
            stratificationNeeded: true,
            budget: primaryEval.budget,
            longevityExpectation: primaryEval.longevity_expectation,
            aestheticGoals: resolveAestheticGoalsForAI(primaryEval.patient_aesthetic_goals),
            anamnesis: primaryEval.anamnesis ?? undefined,
          } : undefined,
          cementationParams: treatmentType === 'porcelana' ? {
            teeth: [primaryEval.tooth],
            shade: primaryEval.tooth_color,
            ceramicType: DEFAULT_CERAMIC_TYPE,
            substrate: primaryEval.substrate || 'Esmalte e Dentina',
            substrateCondition: 'Saudável',
            aestheticGoals: resolveAestheticGoalsForAI(primaryEval.patient_aesthetic_goals),
            anamnesis: primaryEval.anamnesis ?? undefined,
          } : undefined,
          genericToothData: { indication_reason: primaryEval.ai_indication_reason },
        },
        evaluationClients,
      );
      await evaluations.updateStatus(primaryEval.id, EVALUATION_STATUS.DRAFT);
      // Sync protocols across group
      const allIds = groupEvaluations.map(ev => ev.id);
      if (allIds.length >= 2) {
        try { await wizard.syncGroupProtocols(sessionId, allIds); } catch (error) { logger.warn('syncGroupProtocols failed after retry:', error); }
      }
      // After reprocessing, the protocol fingerprint may change (e.g. resina::no-resin → real fingerprint).
      // Refetch to get updated data, then navigate to the new URL if fingerprint changed.
      await queryClient.invalidateQueries({ queryKey: groupResultKeys.detail(sessionId) });
      const refreshed = await queryClient.fetchQuery({
        queryKey: groupResultKeys.detail(sessionId),
        queryFn: () => evaluations.listBySession(sessionId, user!.id),
      });
      const updatedEval = (refreshed as SessionEvaluationRow[])?.find(ev => ev.id === primaryEval.id);
      const newFingerprint = updatedEval ? getProtocolFingerprint(updatedEval) : decodedFingerprint;
      if (newFingerprint !== decodedFingerprint) {
        navigate(`/result/group/${sessionId}/${encodeURIComponent(newFingerprint)}`, { replace: true });
      }
      toast.success(t('toasts.evaluationDetail.retrySuccess'));
    } catch (err) {
      logger.error('Retry protocol failed:', err);
      await evaluations.updateStatus(primaryEval.id, EVALUATION_STATUS.ERROR).catch((err) => logger.warn('Failed to update evaluation status', { err }));
      toast.error(t('toasts.evaluationDetail.retryError'));
    } finally {
      setIsRetrying(false);
    }
  }, [user, primaryEval, groupEvaluations, sessionId, decodedFingerprint, queryClient, navigate, t]);

  // Mark all evaluations in the group as completed
  const handleMarkAllCompleted = useCallback(async () => {
    if (!user) return;
    if (!hasProtocol) {
      toast.error(t('toasts.result.noProtocolCannotComplete'));
      return;
    }
    try {
      const ids = groupEvaluations.map(ev => ev.id);
      await evaluations.updateStatusBulk(ids, EVALUATION_STATUS.COMPLETED);
      queryClient.invalidateQueries({ queryKey: groupResultKeys.detail(sessionId) });
      toast.success(t('toasts.result.markedComplete', { count: groupEvaluations.length }));
    } catch (error) {
      logger.error('Failed to mark evaluations as completed:', error);
      toast.error(t('toasts.result.saveError'));
    }
  }, [user, hasProtocol, groupEvaluations, queryClient, sessionId, t]);

  return {
    // Data
    sessionId,
    isLoading,
    isError,
    error,
    groupEvaluations,
    primaryEval,
    groupTeeth,

    // Treatment computed
    treatmentType,
    isPorcelain,
    isSpecialTreatment,
    currentTreatmentStyle,
    cementationProtocol,
    genericProtocol,

    // Protocol computed
    layers,
    checklist,
    alerts,
    warnings,
    confidence,
    protocolAlternative,
    hasProtocol,
    resin,
    photoUrl,
    dsdSimulationUrl,
    dsdLayerUrls,
    dsdAnalysis: primaryEval?.dsd_analysis ?? null,
    dsdSimulationLayers: primaryEval?.dsd_simulation_layers ?? null,

    // Actions
    handleChecklistChange,
    handleMarkAllCompleted,
    handleRetryProtocol,
    isRetrying,
  };
}
