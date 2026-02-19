import { useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/data';
import { evaluations, storage } from '@/data';
import type { Resin, StratificationProtocol, ProtocolLayer, CementationProtocol } from '@/types/protocol';
import type { SimulationLayer } from '@/types/dsd';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
import { SIGNED_URL_EXPIRY_SECONDS, QUERY_STALE_TIMES } from '@/lib/constants';
import { getTreatmentStyle } from '@/lib/treatment-config';
import { getProtocolFingerprint } from '@/lib/protocol-fingerprint';

// ---------------------------------------------------------------------------
// Types (reuse from useResult where possible)
// ---------------------------------------------------------------------------

interface GroupEvaluation {
  id: string;
  created_at: string;
  patient_name: string | null;
  patient_age: number;
  tooth: string;
  region: string;
  cavity_class: string;
  restoration_size: string;
  substrate: string;
  aesthetic_level: string;
  tooth_color: string;
  stratification_needed: boolean;
  bruxism: boolean;
  longevity_expectation: string;
  budget: string;
  recommendation_text: string | null;
  alternatives: unknown[] | null;
  resins: Resin | null;
  photo_frontal: string | null;
  stratification_protocol: StratificationProtocol | null;
  protocol_layers: ProtocolLayer[] | null;
  alerts: string[] | null;
  warnings: string[] | null;
  checklist_progress: number[] | null;
  dsd_analysis: import('@/types/dsd').DSDAnalysis | null;
  dsd_simulation_url: string | null;
  dsd_simulation_layers: SimulationLayer[] | null;
  treatment_type: string | null;
  cementation_protocol: CementationProtocol | null;
  ai_treatment_indication: string | null;
  ai_indication_reason: string | null;
  generic_protocol: {
    treatment_type: string;
    tooth: string;
    summary: string;
    checklist: string[];
    alerts: string[];
    recommendations: string[];
    ai_reason?: string;
  } | null;
  session_id: string;
  patient_aesthetic_goals: string | null;
}

// getProtocolFingerprint imported from @/lib/protocol-fingerprint — single source of truth

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGroupResult() {
  const { sessionId = '', fingerprint = '' } = useParams<{ sessionId: string; fingerprint: string }>();
  const decodedFingerprint = decodeURIComponent(fingerprint);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Load all evaluations for the session
  const { data: allEvaluations, isLoading } = useQuery({
    queryKey: ['group-result', sessionId],
    queryFn: () => evaluations.listBySession(sessionId, user!.id),
    enabled: !!user && !!sessionId,
    staleTime: QUERY_STALE_TIMES.SHORT,
  });

  // Filter to evaluations matching the fingerprint
  const groupEvaluations = useMemo(() => {
    if (!allEvaluations) return [];
    return (allEvaluations as unknown as GroupEvaluation[]).filter(
      ev => getProtocolFingerprint(ev) === decodedFingerprint
    );
  }, [allEvaluations, decodedFingerprint]);

  // Use first evaluation as the protocol source
  const primaryEval = groupEvaluations[0] || null;
  const groupTeeth = groupEvaluations.map(ev => ev.tooth === 'GENGIVO' ? 'Gengiva' : ev.tooth);

  // Protocol data (from first evaluation — they're identical in the group)
  const treatmentType = primaryEval?.treatment_type || 'resina';
  const isPorcelain = treatmentType === 'porcelana';
  const isSpecialTreatment = ['implante', 'coroa', 'endodontia', 'encaminhamento', 'gengivoplastia', 'recobrimento_radicular'].includes(treatmentType);
  const cementationProtocol = primaryEval?.cementation_protocol as CementationProtocol | null;
  const genericProtocol = primaryEval?.generic_protocol ?? null;
  const protocol = primaryEval?.stratification_protocol ?? null;

  const layers = protocol?.layers || primaryEval?.protocol_layers || [];
  const checklist = useMemo(() => isPorcelain
    ? (cementationProtocol?.checklist || [])
    : isSpecialTreatment && genericProtocol
      ? genericProtocol.checklist
      : (protocol?.checklist || []),
    [isPorcelain, cementationProtocol?.checklist, isSpecialTreatment, genericProtocol, protocol?.checklist]);
  const alerts = isPorcelain
    ? (cementationProtocol?.alerts || [])
    : isSpecialTreatment && genericProtocol
      ? genericProtocol.alerts
      : (primaryEval?.alerts || []);
  const warnings = isPorcelain ? (cementationProtocol?.warnings || []) : (primaryEval?.warnings || []);
  const confidence = isPorcelain ? (cementationProtocol?.confidence || 'média') : (protocol?.confidence || 'média');
  const protocolAlternative = protocol?.alternative;

  const resin = primaryEval?.resins ?? null;
  const hasProtocol = isPorcelain ? !!cementationProtocol : isSpecialTreatment ? !!genericProtocol : layers.length > 0;
  const currentTreatmentStyle = getTreatmentStyle(treatmentType);

  // Signed photo URL
  const { data: photoUrl = null } = useQuery({
    queryKey: ['group-photo', primaryEval?.photo_frontal],
    queryFn: async () => {
      if (!primaryEval?.photo_frontal) return null;
      return storage.getSignedPhotoUrl(primaryEval.photo_frontal, SIGNED_URL_EXPIRY_SECONDS);
    },
    enabled: !!primaryEval?.photo_frontal,
    staleTime: (SIGNED_URL_EXPIRY_SECONDS - 60) * 1000,
  });

  // DSD simulation signed URL
  const { data: dsdSimulationUrl = null } = useQuery({
    queryKey: ['group-dsd-url', primaryEval?.id],
    queryFn: async () => {
      if (!primaryEval?.dsd_simulation_url) return null;
      return storage.getSignedDSDUrl(primaryEval.dsd_simulation_url, SIGNED_URL_EXPIRY_SECONDS);
    },
    enabled: !!primaryEval?.dsd_simulation_url,
    staleTime: (SIGNED_URL_EXPIRY_SECONDS - 60) * 1000,
  });

  // DSD layer signed URLs
  const { data: dsdLayerUrls = {} } = useQuery({
    queryKey: ['group-dsd-layers', primaryEval?.id],
    queryFn: async () => {
      if (!primaryEval?.dsd_simulation_layers?.length) return {};
      const paths = primaryEval.dsd_simulation_layers
        .map(l => l.simulation_url)
        .filter((p): p is string => !!p);
      const urlsByPath = await storage.getSignedDSDLayerUrls(paths, SIGNED_URL_EXPIRY_SECONDS);
      const urls: Record<string, string> = {};
      for (const layer of primaryEval.dsd_simulation_layers) {
        if (layer.simulation_url && urlsByPath[layer.simulation_url]) {
          urls[layer.type] = urlsByPath[layer.simulation_url];
        }
      }
      return urls;
    },
    enabled: !!primaryEval?.dsd_simulation_layers?.length,
    staleTime: (SIGNED_URL_EXPIRY_SECONDS - 60) * 1000,
  });

  // Unified checklist: checking an item updates ALL evaluations in the group
  // TODO: could be optimized with a bulk updateChecklistBulk in data/evaluations.ts
  const checklistMutation = useMutation({
    mutationFn: async (indices: number[]) => {
      if (!user) throw new Error('User not authenticated');
      const ids = groupEvaluations.map(ev => ev.id);
      // Update all evaluations in the group sequentially (no bulk endpoint yet)
      for (const id of ids) {
        const { error } = await supabase
          .from('evaluations')
          .update({ checklist_progress: indices })
          .eq('id', id)
          .eq('user_id', user.id);
        if (error) throw error;
      }
    },
    onMutate: async (indices) => {
      await queryClient.cancelQueries({ queryKey: ['group-result', sessionId] });
      const previousData = queryClient.getQueryData(['group-result', sessionId]);
      // Optimistic update: set checklist_progress on all group evaluations
      queryClient.setQueryData(['group-result', sessionId], (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.map((ev: GroupEvaluation) =>
          groupEvaluations.some(ge => ge.id === ev.id)
            ? { ...ev, checklist_progress: indices }
            : ev,
        );
      });
      return { previousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-result', sessionId] });
    },
    onError: (_err, _vars, context) => {
      // Rollback to previous data on error
      if (context?.previousData) {
        queryClient.setQueryData(['group-result', sessionId], context.previousData);
      }
      logger.error('Error saving group checklist progress');
      toast.error(t('toasts.result.saveError'));
    },
  });

  const handleChecklistChange = useCallback((indices: number[]) => {
    checklistMutation.mutate(indices);
  }, [checklistMutation]);

  // Mark all evaluations in the group as completed
  const handleMarkAllCompleted = useCallback(async () => {
    if (!user) return;
    try {
      const ids = groupEvaluations.map(ev => ev.id);
      await evaluations.updateStatusBulk(ids, 'completed');
      queryClient.invalidateQueries({ queryKey: ['group-result', sessionId] });
      toast.success(t('toasts.result.markedComplete', { count: groupEvaluations.length }));
    } catch {
      toast.error(t('toasts.result.saveError'));
    }
  }, [user, groupEvaluations, queryClient, sessionId]);

  return {
    // Data
    sessionId,
    isLoading,
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
    generatingPDF,
  };
}
