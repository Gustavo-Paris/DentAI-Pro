import React, { useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/data';
import { evaluations, profiles } from '@/data';
import type { Resin, StratificationProtocol, ProtocolLayer, CementationProtocol } from '@/types/protocol';
import type { SimulationLayer } from '@/types/dsd';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { SIGNED_URL_EXPIRY_SECONDS } from '@/lib/constants';
import { Layers, Crown, Stethoscope, ArrowUpRight, CircleX } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Alternative {
  name: string;
  manufacturer: string;
  reason: string;
}

export interface Evaluation {
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
  alternatives: Alternative[] | null;
  resins: Resin | null;
  photo_frontal: string | null;
  photo_45: string | null;
  photo_face: string | null;
  stratification_protocol: StratificationProtocol | null;
  protocol_layers: ProtocolLayer[] | null;
  alerts: string[] | null;
  warnings: string[] | null;
  is_from_inventory: boolean;
  ideal_resin_id: string | null;
  ideal_reason: string | null;
  ideal_resin: Resin | null;
  has_inventory_at_creation: boolean;
  checklist_progress: number[] | null;
  dsd_analysis: import('@/components/wizard/DSDStep').DSDAnalysis | null;
  dsd_simulation_url: string | null;
  dsd_simulation_layers: SimulationLayer[] | null;
  treatment_type: 'resina' | 'porcelana' | 'coroa' | 'implante' | 'endodontia' | 'encaminhamento' | null;
  cementation_protocol: CementationProtocol | null;
  ai_treatment_indication: string | null;
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
  tooth_bounds: { x: number; y: number; width: number; height: number } | null;
  patient_aesthetic_goals: string | null;
  patient_desired_changes: string[] | null;
}

interface DentistProfile {
  full_name: string | null;
  cro: string | null;
  clinic_name: string | null;
  clinic_logo_url: string | null;
}

interface PhotoUrls {
  frontal: string | null;
  angle45: string | null;
  face: string | null;
}

export interface TreatmentStyle {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  bgClass: string;
  borderClass: string;
  iconClass: string;
  badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
  ringClass: string;
  solidBgClass: string;
  glowClass: string;
  overlayColor: string;
}

// ---------------------------------------------------------------------------
// Treatment styles config
// ---------------------------------------------------------------------------

const treatmentStyles: Record<string, TreatmentStyle> = {
  resina: {
    label: 'Restauração em Resina',
    icon: Layers,
    bgClass: 'bg-primary/5 dark:bg-primary/10',
    borderClass: 'border-primary/20 dark:border-primary/30',
    iconClass: 'text-primary',
    badgeVariant: 'default',
    ringClass: 'ring-blue-500',
    solidBgClass: 'bg-blue-600',
    glowClass: 'bg-blue-400',
    overlayColor: 'rgba(59, 130, 246, 0.45)',
  },
  porcelana: {
    label: 'Faceta de Porcelana',
    icon: Crown,
    bgClass: 'bg-amber-50 dark:bg-amber-950/20',
    borderClass: 'border-amber-200 dark:border-amber-800',
    iconClass: 'text-amber-600 dark:text-amber-400',
    badgeVariant: 'secondary',
    ringClass: 'ring-amber-500',
    solidBgClass: 'bg-amber-600',
    glowClass: 'bg-amber-400',
    overlayColor: 'rgba(249, 115, 22, 0.45)',
  },
  coroa: {
    label: 'Coroa Protética',
    icon: Crown,
    bgClass: 'bg-purple-50 dark:bg-purple-950/20',
    borderClass: 'border-purple-200 dark:border-purple-800',
    iconClass: 'text-purple-600 dark:text-purple-400',
    badgeVariant: 'secondary',
    ringClass: 'ring-purple-500',
    solidBgClass: 'bg-purple-600',
    glowClass: 'bg-purple-400',
    overlayColor: 'rgba(147, 51, 234, 0.45)',
  },
  implante: {
    label: 'Indicação de Implante',
    icon: CircleX,
    bgClass: 'bg-orange-50 dark:bg-orange-950/20',
    borderClass: 'border-orange-200 dark:border-orange-800',
    iconClass: 'text-orange-600 dark:text-orange-400',
    badgeVariant: 'secondary',
    ringClass: 'ring-orange-500',
    solidBgClass: 'bg-orange-600',
    glowClass: 'bg-orange-400',
    overlayColor: 'rgba(239, 68, 68, 0.45)',
  },
  endodontia: {
    label: 'Tratamento de Canal',
    icon: Stethoscope,
    bgClass: 'bg-rose-50 dark:bg-rose-950/20',
    borderClass: 'border-rose-200 dark:border-rose-800',
    iconClass: 'text-rose-600 dark:text-rose-400',
    badgeVariant: 'destructive',
    ringClass: 'ring-rose-500',
    solidBgClass: 'bg-rose-600',
    glowClass: 'bg-rose-400',
    overlayColor: 'rgba(244, 63, 94, 0.45)',
  },
  encaminhamento: {
    label: 'Encaminhamento',
    icon: ArrowUpRight,
    bgClass: 'bg-muted/50',
    borderClass: 'border-border',
    iconClass: 'text-muted-foreground',
    badgeVariant: 'outline',
    ringClass: 'ring-gray-400',
    solidBgClass: 'bg-gray-600',
    glowClass: 'bg-gray-400',
    overlayColor: 'rgba(107, 114, 128, 0.45)',
  },
};

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const resultKeys = {
  detail: (id: string) => ['result', id] as const,
  dentistProfile: (userId: string) => ['dentist-profile', userId] as const,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useResult() {
  const { id = '' } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showPdfConfirmDialog, setShowPdfConfirmDialog] = useState(false);

  // ---- Queries ----
  const {
    data: evaluation,
    isLoading: loadingEvaluation,
  } = useQuery({
    queryKey: resultKeys.detail(id),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      return evaluations.getByIdWithRelations(id, user.id) as Promise<Evaluation | null>;
    },
    enabled: !!user && !!id,
    staleTime: 30 * 1000,
  });

  const { data: dentistProfile } = useQuery({
    queryKey: resultKeys.dentistProfile(user?.id || ''),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      const { data } = await supabase
        .from('profiles')
        .select('full_name, cro, clinic_name, clinic_logo_url')
        .eq('user_id', user.id)
        .single();
      return data as DentistProfile | null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: photoUrls = { frontal: null, angle45: null, face: null } } = useQuery({
    queryKey: ['result-photos', id],
    queryFn: async () => {
      if (!evaluation) return { frontal: null, angle45: null, face: null };
      const urls: PhotoUrls = { frontal: null, angle45: null, face: null };

      const signPhoto = async (path: string | null, bucket = 'clinical-photos') => {
        if (!path) return null;
        const { data } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);
        return data?.signedUrl || null;
      };

      [urls.frontal, urls.angle45, urls.face] = await Promise.all([
        signPhoto(evaluation.photo_frontal),
        signPhoto(evaluation.photo_45),
        signPhoto(evaluation.photo_face),
      ]);

      return urls;
    },
    enabled: !!evaluation,
    staleTime: (SIGNED_URL_EXPIRY_SECONDS - 60) * 1000,
  });

  const { data: dsdSimulationUrl = null } = useQuery({
    queryKey: ['result-dsd-url', id],
    queryFn: async () => {
      if (!evaluation?.dsd_simulation_url) return null;
      const { data } = await supabase.storage
        .from('dsd-simulations')
        .createSignedUrl(evaluation.dsd_simulation_url, SIGNED_URL_EXPIRY_SECONDS);
      return data?.signedUrl || null;
    },
    enabled: !!evaluation?.dsd_simulation_url,
    staleTime: (SIGNED_URL_EXPIRY_SECONDS - 60) * 1000,
  });

  // Load signed URLs for all simulation layers
  const { data: dsdLayerUrls = {} } = useQuery({
    queryKey: ['result-dsd-layers', id],
    queryFn: async () => {
      if (!evaluation?.dsd_simulation_layers?.length) return {};
      const urls: Record<string, string> = {};
      await Promise.all(
        evaluation.dsd_simulation_layers.map(async (layer) => {
          if (!layer.simulation_url) return;
          const { data } = await supabase.storage
            .from('dsd-simulations')
            .createSignedUrl(layer.simulation_url, SIGNED_URL_EXPIRY_SECONDS);
          if (data?.signedUrl) {
            urls[layer.type] = data.signedUrl;
          }
        })
      );
      return urls;
    },
    enabled: !!evaluation?.dsd_simulation_layers?.length,
    staleTime: (SIGNED_URL_EXPIRY_SECONDS - 60) * 1000,
  });

  // ---- Checklist mutation ----
  const checklistMutation = useMutation({
    mutationFn: async (indices: number[]) => {
      if (!user) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('evaluations')
        .update({ checklist_progress: indices })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onMutate: async (indices) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: resultKeys.detail(id) });
      const prev = queryClient.getQueryData<Evaluation>(resultKeys.detail(id));
      if (prev) {
        queryClient.setQueryData(resultKeys.detail(id), { ...prev, checklist_progress: indices });
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(resultKeys.detail(id), context.prev);
      }
      logger.error('Error saving checklist progress');
      toast.error('Erro ao salvar progresso');
    },
  });

  const handleChecklistChange = useCallback((indices: number[]) => {
    checklistMutation.mutate(indices);
  }, [checklistMutation]);

  // ---- Computed values ----
  const treatmentType = evaluation?.treatment_type || 'resina';
  const isPorcelain = treatmentType === 'porcelana';
  const isSpecialTreatment = ['implante', 'coroa', 'endodontia', 'encaminhamento'].includes(treatmentType);
  const cementationProtocol = evaluation?.cementation_protocol as CementationProtocol | null;
  const genericProtocol = evaluation?.generic_protocol ?? null;
  const protocol = evaluation?.stratification_protocol ?? null;

  const layers = protocol?.layers || evaluation?.protocol_layers || [];
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
      : (evaluation?.alerts || []);
  const warnings = isPorcelain ? (cementationProtocol?.warnings || []) : (evaluation?.warnings || []);
  const confidence = isPorcelain ? (cementationProtocol?.confidence || 'média') : (protocol?.confidence || 'média');
  const protocolAlternative = protocol?.alternative;

  const resin = evaluation?.resins ?? null;
  const idealResin = evaluation?.ideal_resin ?? null;
  const alternatives = evaluation?.alternatives as Alternative[] | null;
  const showIdealResin = !!(idealResin && resin && idealResin.id !== resin.id);
  const hasProtocol = isPorcelain ? !!cementationProtocol : isSpecialTreatment ? !!genericProtocol : layers.length > 0;
  const hasPhotos = !!(photoUrls.frontal || photoUrls.angle45 || photoUrls.face);

  const currentTreatmentStyle = treatmentStyles[treatmentType] || treatmentStyles.resina;

  // ---- PDF export ----
  const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const getChecklistCompletionStatus = useCallback(() => {
    if (!evaluation) return { complete: true, total: 0, progress: 0 };
    const progressIndices = evaluation.checklist_progress || [];
    return {
      complete: checklist.length === 0 || progressIndices.length === checklist.length,
      total: checklist.length,
      progress: progressIndices.length,
    };
  }, [evaluation, checklist]);

  const handleExportPDF = useCallback(async () => {
    if (!evaluation) return;

    setShowPdfConfirmDialog(false);
    setGeneratingPDF(true);

    try {
      const evalProtocol = evaluation.stratification_protocol;

      let clinicLogoBase64: string | null = null;
      if (dentistProfile?.clinic_logo_url) {
        const { data: logoUrl } = supabase.storage
          .from('avatars')
          .getPublicUrl(dentistProfile.clinic_logo_url);
        clinicLogoBase64 = await fetchImageAsBase64(logoUrl.publicUrl);
      }

      const [photoFrontalBase64, photo45Base64, photoFaceBase64, dsdSimBase64] = await Promise.all([
        photoUrls.frontal ? fetchImageAsBase64(photoUrls.frontal) : Promise.resolve(null),
        photoUrls.angle45 ? fetchImageAsBase64(photoUrls.angle45) : Promise.resolve(null),
        photoUrls.face ? fetchImageAsBase64(photoUrls.face) : Promise.resolve(null),
        dsdSimulationUrl ? fetchImageAsBase64(dsdSimulationUrl) : Promise.resolve(null),
      ]);

      const { generateProtocolPDF } = await import('@/lib/generatePDF');

      await generateProtocolPDF({
        createdAt: evaluation.created_at,
        dentistName: dentistProfile?.full_name || undefined,
        dentistCRO: dentistProfile?.cro || undefined,
        clinicName: dentistProfile?.clinic_name || undefined,
        clinicLogo: clinicLogoBase64 || undefined,
        patientName: evaluation.patient_name || undefined,
        patientAge: evaluation.patient_age,
        tooth: evaluation.tooth,
        region: evaluation.region,
        cavityClass: evaluation.cavity_class,
        restorationSize: evaluation.restoration_size,
        toothColor: evaluation.tooth_color,
        aestheticLevel: evaluation.aesthetic_level,
        bruxism: evaluation.bruxism,
        stratificationNeeded: evaluation.stratification_needed,
        resin: evaluation.resins,
        recommendationText: evaluation.recommendation_text,
        layers: evalProtocol?.layers || evaluation.protocol_layers || [],
        alternative: evalProtocol?.alternative,
        checklist: evalProtocol?.checklist || [],
        alerts: evaluation.alerts || [],
        warnings: evaluation.warnings || [],
        confidence: evalProtocol?.confidence || 'média',
        photoFrontal: photoFrontalBase64 || undefined,
        photo45: photo45Base64 || undefined,
        photoFace: photoFaceBase64 || undefined,
        dsdAnalysis: evaluation.dsd_analysis ? {
          facial_midline: evaluation.dsd_analysis.facial_midline,
          dental_midline: evaluation.dsd_analysis.dental_midline,
          smile_line: evaluation.dsd_analysis.smile_line,
          buccal_corridor: evaluation.dsd_analysis.buccal_corridor,
          occlusal_plane: evaluation.dsd_analysis.occlusal_plane,
          golden_ratio_compliance: evaluation.dsd_analysis.golden_ratio_compliance,
          symmetry_score: evaluation.dsd_analysis.symmetry_score,
          suggestions: evaluation.dsd_analysis.suggestions,
          observations: evaluation.dsd_analysis.observations,
        } : undefined,
        dsdSimulationImage: dsdSimBase64 || undefined,
        substrate: evaluation.substrate,
        longevityExpectation: evaluation.longevity_expectation,
        budget: evaluation.budget,
        idealResin: evaluation.ideal_resin || undefined,
        idealReason: evaluation.ideal_reason || undefined,
        isFromInventory: evaluation.is_from_inventory,
        treatmentType: (evaluation.treatment_type === 'porcelana' ? 'porcelana' : 'resina') as 'resina' | 'porcelana',
        cementationProtocol: evaluation.cementation_protocol || undefined,
      });

      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      logger.error('Error generating PDF:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setGeneratingPDF(false);
    }
  }, [evaluation, dentistProfile, photoUrls, dsdSimulationUrl]);

  const handlePdfButtonClick = useCallback(() => {
    const status = getChecklistCompletionStatus();
    if (!status.complete) {
      setShowPdfConfirmDialog(true);
    } else {
      handleExportPDF();
    }
  }, [getChecklistCompletionStatus, handleExportPDF]);

  return {
    // Data
    evaluation,
    isLoading: loadingEvaluation,
    dentistProfile: dentistProfile ?? null,
    photoUrls,
    dsdSimulationUrl,
    dsdLayerUrls,
    dsdSimulationLayers: evaluation?.dsd_simulation_layers || null,

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

    // Resin computed
    resin,
    idealResin,
    alternatives,
    showIdealResin,
    hasPhotos,

    // Actions
    handleChecklistChange,
    handlePdfButtonClick,
    handleExportPDF,
    generatingPDF,
    showPdfConfirmDialog,
    setShowPdfConfirmDialog,
  };
}
