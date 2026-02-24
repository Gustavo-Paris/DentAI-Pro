import { useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/data';
import { evaluations, storage, profiles } from '@/data';
import type { Resin, StratificationProtocol, ProtocolLayer, CementationProtocol } from '@/types/protocol';
import type { SimulationLayer } from '@/types/dsd';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
import { SIGNED_URL_EXPIRY_SECONDS, QUERY_STALE_TIMES } from '@/lib/constants';
import type { TreatmentStyle } from '@/lib/treatment-config';
import { fetchImageAsBase64 } from '@/lib/imageUtils';
import { computeProtocol } from './protocolComputed';

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
  dsd_analysis: import('@/types/dsd').DSDAnalysis | null;
  dsd_simulation_url: string | null;
  dsd_simulation_layers: SimulationLayer[] | null;
  treatment_type: 'resina' | 'porcelana' | 'coroa' | 'implante' | 'endodontia' | 'encaminhamento' | 'gengivoplastia' | 'recobrimento_radicular' | null;
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

export type { TreatmentStyle } from '@/lib/treatment-config';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const resultKeys = {
  detail: (id: string) => ['result', id] as const,
  dentistProfile: (userId: string) => ['profile', userId] as const,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useResult() {
  const { id = '' } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showPdfConfirmDialog, setShowPdfConfirmDialog] = useState(false);

  // ---- Queries ----
  const {
    data: evaluation,
    isLoading: loadingEvaluation,
    isError,
    error,
  } = useQuery({
    queryKey: resultKeys.detail(id),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      return evaluations.getByIdWithRelations(id, user.id) as Promise<Evaluation | null>;
    },
    enabled: !!user && !!id,
    staleTime: QUERY_STALE_TIMES.SHORT,
  });

  const { data: dentistProfile } = useQuery({
    queryKey: resultKeys.dentistProfile(user?.id || ''),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      return profiles.getFullByUserId(user.id) as Promise<DentistProfile | null>;
    },
    enabled: !!user,
    staleTime: QUERY_STALE_TIMES.LONG,
  });

  const { data: photoUrls = { frontal: null, angle45: null, face: null } } = useQuery({
    queryKey: ['result-photos', id],
    queryFn: async () => {
      if (!evaluation) return { frontal: null, angle45: null, face: null };
      const urls: PhotoUrls = { frontal: null, angle45: null, face: null };

      const signPhoto = async (path: string | null) => {
        if (!path) return null;
        return storage.getSignedPhotoUrl(path, SIGNED_URL_EXPIRY_SECONDS);
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
      return storage.getSignedDSDUrl(evaluation.dsd_simulation_url, SIGNED_URL_EXPIRY_SECONDS);
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
      // Separate data/http URLs (already displayable) from storage paths (need signing)
      const storagePaths: string[] = [];
      for (const layer of evaluation.dsd_simulation_layers) {
        if (!layer.simulation_url) continue;
        if (layer.simulation_url.startsWith('data:') || layer.simulation_url.startsWith('http')) {
          urls[layer.type] = layer.simulation_url;
        } else {
          storagePaths.push(layer.simulation_url);
        }
      }
      // Sign only storage paths
      if (storagePaths.length > 0) {
        const urlsByPath = await storage.getSignedDSDLayerUrls(storagePaths, SIGNED_URL_EXPIRY_SECONDS);
        for (const layer of evaluation.dsd_simulation_layers) {
          if (layer.simulation_url && urlsByPath[layer.simulation_url]) {
            urls[layer.type] = urlsByPath[layer.simulation_url];
          }
        }
      }
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
      toast.error(t('toasts.result.saveError'));
    },
  });

  const handleChecklistChange = useCallback((indices: number[]) => {
    checklistMutation.mutate(indices);
  }, [checklistMutation]);

  // ---- Computed values ----
  const pc = useMemo(() => computeProtocol(evaluation), [evaluation]);
  const {
    treatmentType, isPorcelain, isSpecialTreatment,
    cementationProtocol, genericProtocol, layers,
    checklist, alerts, warnings, confidence,
    protocolAlternative, resin, hasProtocol,
  } = pc;
  const protocol = pc.protocol;

  const idealResin = evaluation?.ideal_resin ?? null;
  const alternatives = evaluation?.alternatives as Alternative[] | null;
  const showIdealResin = !!(idealResin && resin && idealResin.id !== resin.id);
  const hasPhotos = !!(photoUrls.frontal || photoUrls.angle45 || photoUrls.face);

  const currentTreatmentStyle = {
    ...pc.currentTreatmentStyle,
    label: t(`treatments.${treatmentType}.label`, pc.currentTreatmentStyle.label),
  };

  // ---- PDF export ----
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
        const logoPublicUrl = storage.getAvatarPublicUrl(dentistProfile.clinic_logo_url);
        clinicLogoBase64 = await fetchImageAsBase64(logoPublicUrl);
      }

      const imageResults = await Promise.allSettled([
        photoUrls.frontal ? fetchImageAsBase64(photoUrls.frontal) : Promise.resolve(null),
        photoUrls.angle45 ? fetchImageAsBase64(photoUrls.angle45) : Promise.resolve(null),
        photoUrls.face ? fetchImageAsBase64(photoUrls.face) : Promise.resolve(null),
        dsdSimulationUrl ? fetchImageAsBase64(dsdSimulationUrl) : Promise.resolve(null),
      ]);

      const [photoFrontalBase64, photo45Base64, photoFaceBase64, dsdSimBase64] = imageResults.map(
        (r) => (r.status === 'fulfilled' ? r.value : null),
      );

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

      toast.success(t('toasts.result.pdfSuccess'));
    } catch (error) {
      logger.error('Error generating PDF:', error);
      toast.error(t('toasts.result.pdfError'));
    } finally {
      setGeneratingPDF(false);
    }
  }, [evaluation, dentistProfile, photoUrls, dsdSimulationUrl, t]);

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
    isError,
    error,
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
