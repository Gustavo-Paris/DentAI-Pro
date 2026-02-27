/**
 * Sub-hook for DSD layer generation (L1, L2, L3).
 *
 * Extracted from useDSDStep to reduce its 1050+ LOC and isolate
 * the multi-layer sequential chaining logic (L1→L2→L3).
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { getSignedDSDUrl } from '@/data/storage';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
import { trackEvent } from '@/lib/analytics';
import { withRetry } from '@/lib/retry';
import { compositeGengivoplastyLips } from '@/lib/compositeGingivo';
import type {
  DSDAnalysis,
  DSDResult,
  SimulationLayer,
  SimulationLayerType,
  PatientPreferences,
} from '@/types/dsd';
import { getLayerLabel } from '@/types/dsd';

// Tooth shape is now fixed as 'natural' - removed manual selection per market research
const TOOTH_SHAPE = 'natural' as const;

/**
 * Fetch an image URL and convert to a PNG data URL (base64).
 * Uses PNG (lossless) to prevent compression artifacts between layers.
 */
async function urlToBase64(url: string): Promise<string> {
  const resp = await fetch(url);
  const blob = await resp.blob();
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(blob);
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(blobUrl); reject(new Error('No canvas context')); return; }
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(blobUrl);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        URL.revokeObjectURL(blobUrl);
        reject(err);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(blobUrl); reject(new Error('Failed to load image for base64 conversion')); };
    img.src = blobUrl;
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseDSDLayerGenerationParams {
  imageBase64: string | null;
  patientPreferences?: PatientPreferences;
  gingivoplastyApproved: boolean | null;
  initialResult?: DSDResult | null;
  invokeFunction: <T = unknown>(
    functionName: string,
    options?: { body?: Record<string, unknown>; headers?: Record<string, string> },
  ) => Promise<{ data: T | null; error: Error | null }>;
  /** Update main simulation image URL in parent */
  setSimulationImageUrl: React.Dispatch<React.SetStateAction<string | null>>;
  /** Update DSD result in parent */
  setResult: React.Dispatch<React.SetStateAction<DSDResult | null>>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDSDLayerGeneration({
  imageBase64,
  patientPreferences,
  gingivoplastyApproved,
  initialResult,
  invokeFunction,
  setSimulationImageUrl,
  setResult,
}: UseDSDLayerGenerationParams) {
  const { t } = useTranslation();

  // Multi-layer simulation states — rehydrate from draft if available
  const [layers, setLayers] = useState<SimulationLayer[]>(initialResult?.layers || []);
  const [layerUrls, setLayerUrls] = useState<Record<string, string>>({});
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const [layersGenerating, setLayersGenerating] = useState(false);
  const [layerGenerationProgress, setLayerGenerationProgress] = useState(0);
  const [failedLayers, setFailedLayers] = useState<SimulationLayerType[]>([]);
  const [retryingLayer, setRetryingLayer] = useState<SimulationLayerType | null>(null);

  // Background simulation states
  const [isSimulationGenerating, setIsSimulationGenerating] = useState(false);
  const [simulationError, setSimulationError] = useState(false);

  // Auto-generate layers when restored from a draft
  const layerAutoGenTriggered = useRef(false);

  // Rehydrate layer signed URLs from persisted draft layers
  useEffect(() => {
    if (initialResult?.layers?.length && Object.keys(layerUrls).length === 0 && !layersGenerating) {
      const resolveLayerUrls = async () => {
        const urls: Record<string, string> = {};
        for (const layer of initialResult.layers!) {
          if (layer.simulation_url) {
            const signedUrl = await getSignedDSDUrl(layer.simulation_url);
            if (signedUrl) urls[layer.type] = signedUrl;
          }
        }
        if (Object.keys(urls).length > 0) {
          setLayerUrls(urls);
          if (!layerUrls[layers[0]?.type]) {
            const firstLayer = initialResult.layers![0];
            const firstUrl = urls[firstLayer?.type];
            if (firstUrl) setSimulationImageUrl(firstUrl);
          }
        }
      };
      resolveLayerUrls();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialResult?.layers]);

  // Reactive sync: update simulationImageUrl whenever activeLayerIndex or layerUrls change
  useEffect(() => {
    if (layers.length > 0 && activeLayerIndex < layers.length) {
      const activeLayer = layers[activeLayerIndex];
      const url = layerUrls[activeLayer.type] || activeLayer.simulation_url;
      if (url) setSimulationImageUrl(url);
    }
  }, [activeLayerIndex, layers, layerUrls, setSimulationImageUrl]);

  // Resolve a layer's signed URL
  const resolveLayerUrl = useCallback(async (
    layer: SimulationLayer,
  ): Promise<{ layer: SimulationLayer; url: string | null }> => {
    if (!layer.simulation_url) return { layer, url: null };
    if (layer.simulation_url.startsWith('data:') || layer.simulation_url.startsWith('http')) {
      return { layer, url: layer.simulation_url };
    }
    const url = await getSignedDSDUrl(layer.simulation_url);
    return { layer, url };
  }, []);

  // Generate a single layer (with client-side lip retry for gingival layers)
  const generateSingleLayer = useCallback(async (
    analysis: DSDAnalysis,
    layerType: SimulationLayerType,
    baseImageOverride?: string,
    l2SignedUrl?: string,
  ): Promise<SimulationLayer | null> => {
    const effectiveImage = baseImageOverride || imageBase64;
    if (!effectiveImage) return null;

    const isGingivalLayer = layerType === 'complete-treatment' || layerType === 'root-coverage';
    const MAX_LIP_RETRIES = isGingivalLayer ? 2 : 0;

    try {
      let bestResult: (DSDResult & { lips_moved?: boolean }) | null = null;

      for (let lipAttempt = 0; lipAttempt <= MAX_LIP_RETRIES; lipAttempt++) {
        const reqId = crypto.randomUUID();
        const { data } = await withRetry(
          async () => {
            const resp = await invokeFunction<DSDResult & { layer_type?: string; lips_moved?: boolean; simulation_debug?: string }>('generate-dsd', {
              body: {
                reqId,
                imageBase64: effectiveImage,
                toothShape: TOOTH_SHAPE,
                regenerateSimulationOnly: true,
                existingAnalysis: analysis,
                patientPreferences,
                layerType,
                ...(baseImageOverride ? { inputAlreadyProcessed: true } : {}),
              },
            });
            if (resp.error || !resp.data?.simulation_url) {
              const debug = resp.data?.simulation_debug;
              if (debug) logger.error(`Layer ${layerType} server error:`, debug);
              throw resp.error || new Error(`Simulation returned no URL${debug ? `: ${debug}` : ''}`);
            }
            return resp;
          },
          {
            maxRetries: 2,
            baseDelay: 3000,
            onRetry: (attempt, err) => {
              logger.warn(`Layer ${layerType} retry ${attempt}:`, err);
            },
          },
        );

        if (!data?.simulation_url) continue;

        if (!bestResult || !data.lips_moved) {
          bestResult = data;
        }

        if (!data.lips_moved || !isGingivalLayer) break;

        if (lipAttempt < MAX_LIP_RETRIES) {
          logger.warn(`Layer ${layerType}: lips moved, retrying (${lipAttempt + 1}/${MAX_LIP_RETRIES})...`);
        } else {
          logger.warn(`Layer ${layerType}: lips moved on all attempts — using first result (typically best quality)`);
        }
      }

      // Post-processing: composite L2 lips onto L3 if lips moved after retries exhausted
      if (bestResult?.lips_moved && isGingivalLayer && l2SignedUrl && bestResult.simulation_url) {
        try {
          const l3SignedUrl = await getSignedDSDUrl(bestResult.simulation_url);
          if (l3SignedUrl) {
            const composited = await compositeGengivoplastyLips(l2SignedUrl, l3SignedUrl);
            if (composited) {
              bestResult = { ...bestResult, simulation_url: composited, lips_moved: false };
              logger.log('Lip compositing applied to gengivoplasty layer');
            }
          }
        } catch (err) {
          logger.warn('Lip compositing failed, using original L3:', err);
        }
      }

      if (!bestResult?.simulation_url) return null;

      return {
        type: layerType,
        label: getLayerLabel(layerType, t),
        simulation_url: bestResult.simulation_url,
        whitening_level: patientPreferences?.whiteningLevel || 'natural',
        includes_gengivoplasty: layerType === 'complete-treatment',
      };
    } catch (err) {
      logger.error(`Layer ${layerType} generation error:`, err);
      return null;
    }
  }, [imageBase64, invokeFunction, patientPreferences, t]);

  // L1-first sequential chaining: L1 (corrections) → L2 (whitening) → L3 (gengivoplasty)
  const generateAllLayers = useCallback(async (analysisData?: DSDAnalysis, currentResult?: DSDResult | null) => {
    const analysis = analysisData || currentResult?.analysis;
    if (!imageBase64 || !analysis) return;

    setLayersGenerating(true);
    setIsSimulationGenerating(true);
    setSimulationError(false);
    setFailedLayers([]);
    setLayerGenerationProgress(0);

    try {
      const compositedLayers: SimulationLayer[] = [];
      const resolvedUrls: Record<string, string> = {};
      const failed: SimulationLayerType[] = [];

      // === Phase 1: Generate L1 from original (corrections only, natural color) ===
      const l1Raw = await generateSingleLayer(analysis, 'restorations-only');
      setLayerGenerationProgress(1);

      let l1Url: string | null = null;
      if (l1Raw) {
        const { layer: l1Processed, url } = await resolveLayerUrl(l1Raw);
        compositedLayers.push(l1Processed);
        l1Url = url;
        if (url) resolvedUrls['restorations-only'] = url;
      } else {
        failed.push('restorations-only');
      }

      // === Phase 2: Generate L2 from L1 (whitening ONLY) ===
      let l2Url: string | null = null;
      if (l1Url) {
        try {
          const l1Base64 = await urlToBase64(l1Url);
          logger.log('Layer chaining: L1 → L2 (whitening only)');
          const l2Raw = await generateSingleLayer(analysis, 'whitening-restorations', l1Base64);
          setLayerGenerationProgress(2);

          if (l2Raw) {
            const { layer: l2Processed, url } = await resolveLayerUrl(l2Raw);
            compositedLayers.push(l2Processed);
            l2Url = url;
            if (url) resolvedUrls['whitening-restorations'] = url;
          } else {
            failed.push('whitening-restorations');
          }
        } catch (err) {
          logger.error('L2 generation error:', err);
          failed.push('whitening-restorations');
          setLayerGenerationProgress(2);
        }
      } else {
        logger.warn('L1 unavailable, generating L2 from original as fallback');
        const l2Fallback = await generateSingleLayer(analysis, 'whitening-restorations');
        setLayerGenerationProgress(2);
        if (l2Fallback) {
          const { layer: l2Processed, url } = await resolveLayerUrl(l2Fallback);
          compositedLayers.push(l2Processed);
          l2Url = url;
          if (url) resolvedUrls['whitening-restorations'] = url;
        } else {
          failed.push('whitening-restorations');
        }
      }

      // === Phase 3: Generate L3 from L2 (gengivoplasty ONLY — if approved) ===
      if (gingivoplastyApproved === true && l2Url) {
        try {
          const l2Base64 = await urlToBase64(l2Url);
          logger.log('Layer chaining: L2 → L3 (gengivoplasty only)');
          const l3Raw = await generateSingleLayer(analysis, 'complete-treatment', l2Base64, l2Url);
          setLayerGenerationProgress(3);

          if (l3Raw) {
            const { layer: l3Processed, url: l3Url } = await resolveLayerUrl(l3Raw);
            compositedLayers.push(l3Processed);
            if (l3Url) resolvedUrls['complete-treatment'] = l3Url;
          } else {
            failed.push('complete-treatment');
          }
        } catch (err) {
          logger.error('L3 generation error:', err);
          failed.push('complete-treatment');
        }
      }

      setFailedLayers(failed);

      if (compositedLayers.length === 0) {
        setSimulationError(true);
        return;
      }

      // Sort layers in display order: L1, L2, L3
      const layerOrder: SimulationLayerType[] = ['restorations-only', 'whitening-restorations', 'complete-treatment'];
      compositedLayers.sort((a, b) => layerOrder.indexOf(a.type) - layerOrder.indexOf(b.type));

      setLayers(compositedLayers);
      setLayerUrls(resolvedUrls);

      // Set main simulation URL to the first layer (L1)
      const mainLayer = compositedLayers[0];
      if (mainLayer?.simulation_url) {
        setResult(prev => prev ? {
          ...prev,
          simulation_url: mainLayer.simulation_url,
          layers: compositedLayers,
        } : prev);

        const mainUrl = resolvedUrls[mainLayer.type] || null;
        if (mainUrl) {
          setSimulationImageUrl(mainUrl);
        } else {
          const mainSignedUrl = await getSignedDSDUrl(mainLayer.simulation_url);
          if (mainSignedUrl) {
            setSimulationImageUrl(mainSignedUrl);
          }
        }
      }

      const totalExpected = 2 + (gingivoplastyApproved === true ? 1 : 0);
      if (failed.length > 0) {
        toast.success(t('toasts.dsd.layersFailed', { success: compositedLayers.length, total: totalExpected }), {
          description: t('toasts.dsd.layersFailedDesc', { count: failed.length }),
        });
      } else {
        toast.success(t('toasts.dsd.layersReady', { count: compositedLayers.length }));
      }
      trackEvent('dsd_simulation_completed', { layers_count: compositedLayers.length });
    } catch (err) {
      logger.error('Generate all layers error:', err);
      setSimulationError(true);
    } finally {
      setLayersGenerating(false);
      setIsSimulationGenerating(false);
    }
  }, [imageBase64, generateSingleLayer, resolveLayerUrl, gingivoplastyApproved, setResult, setSimulationImageUrl, t]);

  // Auto-generate layers when restored from a draft that has analysis but no layers
  useEffect(() => {
    if (
      !layerAutoGenTriggered.current &&
      initialResult?.analysis &&
      !initialResult?.layers?.length &&
      layers.length === 0 &&
      !isSimulationGenerating &&
      !simulationError &&
      !layersGenerating &&
      imageBase64
    ) {
      layerAutoGenTriggered.current = true;
      logger.log('Auto-triggering layer generation for draft restored without layers');
      generateAllLayers(initialResult.analysis);
    }
  }, [initialResult, layers.length, isSimulationGenerating, simulationError, layersGenerating, imageBase64, generateAllLayers]);

  // Retry a single failed layer — analysis must be passed by the parent
  const retryFailedLayer = useCallback(async (layerType: SimulationLayerType, analysis?: DSDAnalysis | null) => {
    if (!imageBase64 || !analysis) return;

    setRetryingLayer(layerType);
    try {
      let baseImageOverride: string | undefined;
      if (layerType === 'complete-treatment') {
        const l2CompositedUrl = layerUrls['whitening-restorations'];
        if (l2CompositedUrl) {
          try {
            baseImageOverride = await urlToBase64(l2CompositedUrl);
            logger.log('L3 retry: chaining from L2 composited image');
          } catch (err) {
            logger.warn('L3 retry: failed to convert L2 URL to base64, using original:', err);
          }
        }
      }

      const layer = await generateSingleLayer(analysis, layerType, baseImageOverride);
      if (!layer) {
        toast.error(t('toasts.dsd.layerError', { layer: getLayerLabel(layerType, t) }));
        return;
      }

      const { layer: processed, url } = await resolveLayerUrl(layer);

      setLayers(prev => [...prev, processed]);
      if (url) {
        setLayerUrls(prev => ({ ...prev, [processed.type]: url }));
      }
      setFailedLayers(prev => prev.filter(t => t !== layerType));
      setResult(prev => prev ? {
        ...prev,
        layers: [...(prev.layers || []), processed],
      } : prev);
      toast.success(t('toasts.dsd.layerReady', { layer: getLayerLabel(layerType, t) }));
    } catch (err) {
      logger.error(`Retry layer ${layerType} error:`, err);
      toast.error(t('toasts.dsd.layerError', { layer: getLayerLabel(layerType, t) }));
    } finally {
      setRetryingLayer(null);
    }
  }, [imageBase64, generateSingleLayer, resolveLayerUrl, layerUrls, setResult, t]);

  const handleSelectLayer = useCallback((idx: number, layerType: string) => {
    setActiveLayerIndex(idx);
    const url = layerUrls[layerType];
    if (url) setSimulationImageUrl(url);
  }, [layerUrls, setSimulationImageUrl]);

  return {
    // State
    layers,
    layerUrls,
    activeLayerIndex,
    layersGenerating,
    layerGenerationProgress,
    failedLayers,
    retryingLayer,
    isSimulationGenerating,
    simulationError,

    // Setters (needed by parent for reset and sub-hooks)
    setLayers,
    setLayerUrls,
    setActiveLayerIndex,
    setSimulationError,
    setFailedLayers,

    // Actions
    generateSingleLayer,
    resolveLayerUrl,
    generateAllLayers,
    retryFailedLayer,
    handleSelectLayer,
  };
}
