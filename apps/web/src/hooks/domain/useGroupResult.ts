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
import { Layers, Crown, Stethoscope, ArrowUpRight, CircleX, Smile, HeartPulse } from 'lucide-react';
import type { TreatmentStyle } from './useResult';

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

// Must match getProtocolFingerprint in EvaluationDetails.tsx
function getProtocolFingerprint(ev: GroupEvaluation): string {
  const resinKey = ev.resins
    ? `${ev.resins.name}|${ev.resins.manufacturer}`
    : 'unknown';
  const protocol = ev.stratification_protocol;
  if (!protocol?.layers?.length) return resinKey;
  const layersKey = [...protocol.layers]
    .sort((a, b) => a.order - b.order)
    .map(l => `${l.resin_brand}:${l.shade}`)
    .join('|');
  return `${resinKey}::${layersKey}`;
}

// ---------------------------------------------------------------------------
// Treatment styles (same as useResult)
// ---------------------------------------------------------------------------

const treatmentStyles: Record<string, TreatmentStyle> = {
  resina: { label: 'Restauração em Resina', icon: Layers, bgClass: 'bg-primary/5 dark:bg-primary/10', borderClass: 'border-primary/20 dark:border-primary/30', iconClass: 'text-primary', badgeVariant: 'default', ringClass: 'ring-blue-500', solidBgClass: 'bg-blue-600', glowClass: 'bg-blue-400', overlayColor: 'rgba(59, 130, 246, 0.45)' },
  porcelana: { label: 'Faceta de Porcelana', icon: Crown, bgClass: 'bg-amber-50 dark:bg-amber-950/20', borderClass: 'border-amber-200 dark:border-amber-800', iconClass: 'text-amber-600 dark:text-amber-400', badgeVariant: 'secondary', ringClass: 'ring-amber-500', solidBgClass: 'bg-amber-600', glowClass: 'bg-amber-400', overlayColor: 'rgba(249, 115, 22, 0.45)' },
  gengivoplastia: { label: 'Gengivoplastia Estética', icon: Smile, bgClass: 'bg-emerald-50 dark:bg-emerald-950/20', borderClass: 'border-emerald-200 dark:border-emerald-800', iconClass: 'text-emerald-600 dark:text-emerald-400', badgeVariant: 'secondary', ringClass: 'ring-emerald-500', solidBgClass: 'bg-emerald-600', glowClass: 'bg-emerald-400', overlayColor: 'rgba(16, 185, 129, 0.45)' },
  coroa: { label: 'Coroa Protética', icon: Crown, bgClass: 'bg-purple-50 dark:bg-purple-950/20', borderClass: 'border-purple-200 dark:border-purple-800', iconClass: 'text-purple-600 dark:text-purple-400', badgeVariant: 'secondary', ringClass: 'ring-purple-500', solidBgClass: 'bg-purple-600', glowClass: 'bg-purple-400', overlayColor: 'rgba(147, 51, 234, 0.45)' },
  implante: { label: 'Indicação de Implante', icon: CircleX, bgClass: 'bg-orange-50 dark:bg-orange-950/20', borderClass: 'border-orange-200 dark:border-orange-800', iconClass: 'text-orange-600 dark:text-orange-400', badgeVariant: 'secondary', ringClass: 'ring-orange-500', solidBgClass: 'bg-orange-600', glowClass: 'bg-orange-400', overlayColor: 'rgba(239, 68, 68, 0.45)' },
  endodontia: { label: 'Tratamento de Canal', icon: Stethoscope, bgClass: 'bg-rose-50 dark:bg-rose-950/20', borderClass: 'border-rose-200 dark:border-rose-800', iconClass: 'text-rose-600 dark:text-rose-400', badgeVariant: 'destructive', ringClass: 'ring-rose-500', solidBgClass: 'bg-rose-600', glowClass: 'bg-rose-400', overlayColor: 'rgba(244, 63, 94, 0.45)' },
  encaminhamento: { label: 'Encaminhamento', icon: ArrowUpRight, bgClass: 'bg-muted/50', borderClass: 'border-border', iconClass: 'text-muted-foreground', badgeVariant: 'outline', ringClass: 'ring-gray-400', solidBgClass: 'bg-gray-600', glowClass: 'bg-gray-400', overlayColor: 'rgba(107, 114, 128, 0.45)' },
  recobrimento_radicular: { label: 'Recobrimento Radicular', icon: HeartPulse, bgClass: 'bg-teal-50 dark:bg-teal-950/20', borderClass: 'border-teal-200 dark:border-teal-800', iconClass: 'text-teal-600 dark:text-teal-400', badgeVariant: 'secondary', ringClass: 'ring-teal-500', solidBgClass: 'bg-teal-600', glowClass: 'bg-teal-400', overlayColor: 'rgba(20, 184, 166, 0.45)' },
};

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
  const currentTreatmentStyle = treatmentStyles[treatmentType] || treatmentStyles.resina;

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

  // Unified checklist: checking an item updates ALL evaluations in the group
  const checklistMutation = useMutation({
    mutationFn: async (indices: number[]) => {
      if (!user) throw new Error('User not authenticated');
      const ids = groupEvaluations.map(ev => ev.id);
      // Update all evaluations in the group
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-result', sessionId] });
    },
    onError: () => {
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
      for (const ev of groupEvaluations) {
        await supabase
          .from('evaluations')
          .update({ status: 'completed' })
          .eq('id', ev.id)
          .eq('user_id', user.id);
      }
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

    // Actions
    handleChecklistChange,
    handleMarkAllCompleted,
    generatingPDF,
  };
}
