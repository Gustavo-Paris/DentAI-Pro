/**
 * Sub-hook for DSD face mockup generation (E6 layer).
 *
 * Extracted from useDSDStep to reduce its 1100+ LOC and isolate
 * the completely independent face-mockup feature.
 */
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
import { trackEvent } from '@/lib/analytics';
import { withRetry } from '@/lib/retry';
import type {
  DSDAnalysis,
  DSDResult,
  SimulationLayer,
  PatientPreferences,
  AdditionalPhotos,
} from '@/types/dsd';
import { getLayerLabel } from '@/types/dsd';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseDSDFaceMockupParams {
  additionalPhotos?: AdditionalPhotos;
  analysis: DSDAnalysis | null;
  patientPreferences?: PatientPreferences;
  invokeFunction: <T = unknown>(
    functionName: string,
    options?: { body?: Record<string, unknown>; headers?: Record<string, string> },
  ) => Promise<{ data: T | null; error: Error | null }>;
  resolveLayerUrl: (layer: SimulationLayer) => Promise<{ layer: SimulationLayer; url: string | null }>;
  /** Update shared layer list in parent */
  setLayers: React.Dispatch<React.SetStateAction<SimulationLayer[]>>;
  /** Update shared layer URL map in parent */
  setLayerUrls: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  /** Set active layer index in parent */
  setActiveLayerIndex: React.Dispatch<React.SetStateAction<number>>;
  /** Set main simulation image URL in parent */
  setSimulationImageUrl: React.Dispatch<React.SetStateAction<string | null>>;
  /** Update DSD result in parent */
  setResult: React.Dispatch<React.SetStateAction<DSDResult | null>>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDSDFaceMockup({
  additionalPhotos,
  analysis,
  patientPreferences,
  invokeFunction,
  resolveLayerUrl,
  setLayers,
  setLayerUrls,
  setActiveLayerIndex,
  setSimulationImageUrl,
  setResult,
}: UseDSDFaceMockupParams) {
  const [isFaceMockupGenerating, setIsFaceMockupGenerating] = useState(false);
  const [faceMockupError, setFaceMockupError] = useState<string | null>(null);
  const { t } = useTranslation();

  const generateFaceMockup = useCallback(async () => {
    if (!additionalPhotos?.face || !analysis) return;

    setIsFaceMockupGenerating(true);
    setFaceMockupError(null);

    try {
      const reqId = crypto.randomUUID();
      const { data, error: fnError } = await withRetry(
        async () => {
          const resp = await invokeFunction<DSDResult & { simulation_debug?: string }>('generate-dsd', {
            body: {
              reqId,
              imageBase64: additionalPhotos.face,
              regenerateSimulationOnly: true,
              existingAnalysis: analysis,
              patientPreferences,
              layerType: 'face-mockup' as const,
              additionalPhotos: { face: additionalPhotos.face, smile45: null },
            },
          });
          if (resp.error || !resp.data?.simulation_url) {
            const debug = resp.data?.simulation_debug;
            if (debug) logger.error('Face mockup server error:', debug);
            throw resp.error || new Error(`Face mockup returned no URL${debug ? `: ${debug}` : ''}`);
          }
          return resp;
        },
        {
          maxRetries: 2,
          baseDelay: 3000,
          onRetry: (attempt, err) => {
            logger.warn(`Face mockup retry ${attempt}:`, err);
          },
        },
      );

      if (fnError) throw fnError;

      if (data?.simulation_url) {
        const { layer: processed, url } = await resolveLayerUrl({
          type: 'face-mockup',
          label: getLayerLabel('face-mockup', t),
          simulation_url: data.simulation_url,
          whitening_level: patientPreferences?.whiteningLevel || 'natural',
          includes_gengivoplasty: false,
        });

        setLayers(prev => {
          const filtered = prev.filter(l => l.type !== 'face-mockup');
          const updated = [...filtered, processed];
          // Auto-select the new face-mockup layer
          setActiveLayerIndex(updated.length - 1);
          return updated;
        });
        if (url) {
          setLayerUrls(prev => ({ ...prev, 'face-mockup': url }));
          setSimulationImageUrl(url);
        }
        setResult(prev => prev ? {
          ...prev,
          layers: [...(prev.layers || []).filter(l => l.type !== 'face-mockup'), processed],
        } : prev);

        toast.success(t('toasts.dsd.layerReady', { layer: getLayerLabel('face-mockup', t) }));
        trackEvent('dsd_face_mockup_generated');
      } else {
        setFaceMockupError(data?.simulation_debug || 'Face mockup generation failed');
      }
    } catch (err) {
      const message = (err as Error).message || 'Face mockup generation failed';
      setFaceMockupError(message);
      logger.error('Face mockup generation failed:', err);
      toast.error(t('toasts.dsd.layerError', { layer: getLayerLabel('face-mockup', t) }));
    } finally {
      setIsFaceMockupGenerating(false);
    }
  }, [additionalPhotos?.face, analysis, invokeFunction, patientPreferences, resolveLayerUrl,
      setLayers, setLayerUrls, setActiveLayerIndex, setSimulationImageUrl, setResult, t]);

  return {
    isFaceMockupGenerating,
    faceMockupError,
    generateFaceMockup,
    hasFacePhoto: !!additionalPhotos?.face,
  };
}
