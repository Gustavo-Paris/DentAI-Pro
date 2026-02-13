import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/hooks/useSubscription';
import { logger } from '@/lib/logger';
import { trackEvent } from '@/lib/analytics';
import { withRetry } from '@/lib/retry';
import { TIMING } from '@/lib/constants';
import { compositeGengivoplastyLips } from '@/lib/compositeGingivo';
// compositeTeeth.ts kept for potential future use but compositing disabled —
// Gemini's prompt-based preservation of lips/gums produces better results
import type {
  DSDAnalysis,
  DSDResult,
  SimulationLayer,
  SimulationLayerType,
  ToothBoundsPct,
  AdditionalPhotos,
  PatientPreferences,
  DetectedToothForMask,
  ClinicalToothFinding,
} from '@/types/dsd';
import { LAYER_LABELS } from '@/types/dsd';

// Tooth shape is now fixed as 'natural' - removed manual selection per market research
const TOOTH_SHAPE = 'natural' as const;

/** Fetch an image URL and convert to a data URL (base64) */
async function urlToBase64(url: string): Promise<string> {
  const resp = await fetch(url);
  const blob = await resp.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const analysisSteps = [
  { label: 'Detectando landmarks faciais...', duration: 2000 },
  { label: 'Analisando proporções dentárias...', duration: 3000 },
  { label: 'Calculando proporção dourada...', duration: 2000 },
  { label: 'Avaliando simetria...', duration: 2000 },
];

export interface DSDStepProps {
  imageBase64: string | null;
  onComplete: (result: DSDResult | null) => void;
  onSkip: () => void;
  additionalPhotos?: AdditionalPhotos;
  patientPreferences?: PatientPreferences;
  /** Optional: used to post-process the simulation by compositing ONLY the teeth onto the original photo */
  detectedTeeth?: DetectedToothForMask[];
  initialResult?: DSDResult | null; // For restoring from draft
  /** Clinical observations from analyze-dental-photo, passed as context to prevent contradictions */
  clinicalObservations?: string[];
  /** Per-tooth clinical findings to prevent DSD from inventing restorations */
  clinicalTeethFindings?: ClinicalToothFinding[];
  /** Called whenever the DSD result changes (analysis complete, simulation ready, etc.) so the parent can persist it in drafts */
  onResultChange?: (result: DSDResult | null) => void;
  /** Called when user changes whitening level in E4 comparison */
  onPreferencesChange?: (prefs: PatientPreferences) => void;
}

export function useDSDStep({
  imageBase64,
  onComplete,
  onSkip,
  additionalPhotos,
  patientPreferences,
  detectedTeeth,
  initialResult,
  clinicalObservations,
  clinicalTeethFindings,
  onResultChange,
  onPreferencesChange,
}: DSDStepProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  // Initialize with draft result if available
  const [result, setResult] = useState<DSDResult | null>(initialResult || null);
  const [error, setError] = useState<string | null>(null);
  const [simulationImageUrl, setSimulationImageUrl] = useState<string | null>(null);
  const [isRegeneratingSimulation, setIsRegeneratingSimulation] = useState(false);
  const [isCompositing, setIsCompositing] = useState(false);

  // Background simulation states
  const [isSimulationGenerating, setIsSimulationGenerating] = useState(false);
  const [simulationError, setSimulationError] = useState(false);

  // Multi-layer simulation states — rehydrate from draft if available
  const [layers, setLayers] = useState<SimulationLayer[]>(initialResult?.layers || []);
  const [layerUrls, setLayerUrls] = useState<Record<string, string>>({});
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const [layersGenerating, setLayersGenerating] = useState(false);
  const [layerGenerationProgress, setLayerGenerationProgress] = useState(0);
  const [failedLayers, setFailedLayers] = useState<SimulationLayerType[]>([]);
  const [retryingLayer, setRetryingLayer] = useState<SimulationLayerType | null>(null);

  // Gengivoplasty approval: null = not decided, true = approved, false = discarded
  // Derive initial state from draft layers — if complete-treatment layer exists, it was previously approved
  const [gingivoplastyApproved, setGingivoplastyApproved] = useState<boolean | null>(
    initialResult?.layers?.some(l => l.type === 'complete-treatment') ? true : null
  );

  // E4: Whitening comparison
  const [whiteningComparison, setWhiteningComparison] = useState<Record<string, string>>({});
  const [isComparingWhitening, setIsComparingWhitening] = useState(false);
  const [showWhiteningComparison, setShowWhiteningComparison] = useState(false);

  // E5: Annotations
  const [showAnnotations, setShowAnnotations] = useState(false);
  const annotationContainerRef = useRef<HTMLDivElement>(null);
  const [annotationDimensions, setAnnotationDimensions] = useState({ width: 0, height: 0 });

  const { invokeFunction } = useAuthenticatedFetch();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { canUseCredits, refreshSubscription, getCreditCost } = useSubscription();

  const lastCompositeSourcePathRef = useRef<string | null>(null);

  // Ref to prevent multiple simultaneous analysis calls - skip if we have initial result
  const analysisStartedRef = useRef(!!initialResult);

  // Propagate result changes to parent for draft auto-save
  useEffect(() => {
    onResultChange?.(result);
  }, [result, onResultChange]);

  // Load signed URL for simulation
  useEffect(() => {
    const loadSimulationUrl = async () => {
      if (result?.simulation_url) {
        const { data } = await supabase.storage
          .from('dsd-simulations')
          .createSignedUrl(result.simulation_url, 3600);

        if (data?.signedUrl) {
          setSimulationImageUrl(data.signedUrl);
        }
      }
    };

    loadSimulationUrl();
  }, [result?.simulation_url]);

  // Rehydrate layer signed URLs from persisted draft layers
  useEffect(() => {
    if (initialResult?.layers?.length && Object.keys(layerUrls).length === 0 && !layersGenerating) {
      const resolveLayerUrls = async () => {
        const urls: Record<string, string> = {};
        for (const layer of initialResult.layers!) {
          if (layer.simulation_url) {
            const { data } = await supabase.storage
              .from('dsd-simulations')
              .createSignedUrl(layer.simulation_url, 3600);
            if (data?.signedUrl) urls[layer.type] = data.signedUrl;
          }
        }
        if (Object.keys(urls).length > 0) {
          setLayerUrls(urls);
          // Set active layer URL if no simulation URL yet
          if (!simulationImageUrl) {
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

  const toothBounds = useMemo(() => {
    const bounds = (detectedTeeth || [])
      .map((t) => t.tooth_bounds)
      .filter(Boolean) as ToothBoundsPct[];

    // Filter obviously invalid boxes
    return bounds.filter((b) =>
      Number.isFinite(b.x) && Number.isFinite(b.y) && Number.isFinite(b.width) && Number.isFinite(b.height) &&
      b.width > 0 && b.height > 0
    );
  }, [detectedTeeth]);

  // Client-side compositing disabled — Gemini's prompt-based preservation produces
  // better results than canvas mask overlays which create visible artifacts.

  // Check if analysis has gengivoplasty suggestions
  const hasGingivoSuggestion = useCallback((analysis: DSDAnalysis): boolean => {
    return !!analysis.suggestions?.some(s => {
      if (s.treatment_indication === 'gengivoplastia') return true;
      const text = `${s.current_issue} ${s.proposed_change}`.toLowerCase();
      return text.includes('gengivoplastia') || text.includes('gengival') || text.includes('zênite');
    });
  }, []);

  // Determine which layers to generate based on analysis
  const determineLayersNeeded = useCallback((analysis: DSDAnalysis): SimulationLayerType[] => {
    const needed: SimulationLayerType[] = ['restorations-only', 'whitening-restorations'];

    // Layer 3: complete-treatment with gengivoplasty — only after explicit approval
    // (user can approve even when AI didn't detect gengivoplasty)
    if (gingivoplastyApproved === true) {
      needed.push('complete-treatment');
    }

    return needed;
  }, [gingivoplastyApproved]);

  // Generate a single layer (with client-side lip retry for gingival layers)
  // baseImageOverride: when provided, uses this image instead of the original photo
  // (used for L3 gengivoplasty which chains from L2's composited output)
  const generateSingleLayer = useCallback(async (
    analysis: DSDAnalysis,
    layerType: SimulationLayerType,
    baseImageOverride?: string,
  ): Promise<SimulationLayer | null> => {
    const effectiveImage = baseImageOverride || imageBase64;
    if (!effectiveImage) return null;

    const isGingivalLayer = layerType === 'complete-treatment' || layerType === 'root-coverage';
    // When chaining from L2 (baseImageOverride), skip lip retries — the server
    // already skips lip validation for inputAlreadyProcessed, and the Flash
    // validator consistently confuses gingival recontouring with lip movement.
    const MAX_LIP_RETRIES = (isGingivalLayer && !baseImageOverride) ? 2 : 0;

    try {
      let bestResult: (DSDResult & { lips_moved?: boolean }) | null = null;

      for (let lipAttempt = 0; lipAttempt <= MAX_LIP_RETRIES; lipAttempt++) {
        const { data } = await withRetry(
          async () => {
            const resp = await invokeFunction<DSDResult & { layer_type?: string; lips_moved?: boolean; simulation_debug?: string }>('generate-dsd', {
              body: {
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

        // Keep the FIRST result as baseline — only overwrite if a retry
        // actually passes lip validation (lips_moved=false).
        // This prevents degrading quality through retries when all attempts
        // are flagged by the lip checker.
        if (!bestResult || !data.lips_moved) {
          bestResult = data;
        }

        // If lips didn't move or this is not a gingival layer, accept immediately
        if (!data.lips_moved || !isGingivalLayer) break;

        // Lips moved — retry if we have attempts left
        if (lipAttempt < MAX_LIP_RETRIES) {
          logger.warn(`Layer ${layerType}: lips moved, retrying (${lipAttempt + 1}/${MAX_LIP_RETRIES})...`);
        } else {
          logger.warn(`Layer ${layerType}: lips moved on all attempts — using first result (typically best quality)`);
        }
      }

      if (!bestResult?.simulation_url) return null;

      return {
        type: layerType,
        label: LAYER_LABELS[layerType],
        simulation_url: bestResult.simulation_url,
        whitening_level: patientPreferences?.whiteningLevel || 'natural',
        includes_gengivoplasty: layerType === 'complete-treatment',
      };
    } catch (err) {
      logger.error(`Layer ${layerType} generation error:`, err);
      return null;
    }
  }, [imageBase64, invokeFunction, patientPreferences]);

  // Resolve a layer's signed URL (no client-side compositing — Gemini already
  // preserves lips/gums/background via prompt instructions)
  const resolveLayerUrl = useCallback(async (
    layer: SimulationLayer,
  ): Promise<{ layer: SimulationLayer; url: string | null }> => {
    if (!layer.simulation_url) return { layer, url: null };

    const { data: signedData } = await supabase.storage
      .from('dsd-simulations')
      .createSignedUrl(layer.simulation_url, 3600);

    return { layer, url: signedData?.signedUrl || null };
  }, []);

  // L2-first architecture: Generate L2 (canonical) from original, derive L1 from L2, chain L3 from L2.
  const generateAllLayers = useCallback(async (analysisData?: DSDAnalysis) => {
    const analysis = analysisData || result?.analysis;
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

      // === Phase 1: Generate L2 (canonical — corrections + whitening from original) ===
      const l2Raw = await generateSingleLayer(analysis, 'whitening-restorations');
      setLayerGenerationProgress(1);

      // Process L2
      let l2CompositedUrl: string | null = null;
      if (l2Raw) {
        const { layer: l2Processed, url: l2Url } = await resolveLayerUrl(l2Raw);
        compositedLayers.push(l2Processed);
        l2CompositedUrl = l2Url;
        if (l2Url) resolvedUrls['whitening-restorations'] = l2Url;
      } else {
        failed.push('whitening-restorations');
      }

      // === Phase 2: Generate L1 from L2 (dewhitening — revert whitening, keep corrections) ===
      if (l2CompositedUrl) {
        try {
          const l2Base64 = await urlToBase64(l2CompositedUrl);
          logger.log('Layer chaining: deriving L1 from L2 (dewhitening)');
          const l1Raw = await generateSingleLayer(analysis, 'restorations-only', l2Base64);
          setLayerGenerationProgress(2);

          if (l1Raw) {
            const { layer: l1Processed, url: l1Url } = await resolveLayerUrl(l1Raw);
            compositedLayers.push(l1Processed);
            if (l1Url) resolvedUrls['restorations-only'] = l1Url;
          } else {
            failed.push('restorations-only');
          }
        } catch (err) {
          logger.error('L1 derivation from L2 error:', err);
          failed.push('restorations-only');
        }
      } else {
        // L2 failed, generate L1 from original as fallback
        logger.warn('L2 unavailable, generating L1 from original photo as fallback');
        const l1Raw = await generateSingleLayer(analysis, 'restorations-only');
        setLayerGenerationProgress(2);
        if (l1Raw) {
          const { layer: l1Processed, url: l1Url } = await resolveLayerUrl(l1Raw);
          compositedLayers.push(l1Processed);
          if (l1Url) resolvedUrls['restorations-only'] = l1Url;
        } else {
          failed.push('restorations-only');
        }
      }

      // === Phase 3: Generate L3 from L2 composited (if gengivoplasty approved) ===
      if (gingivoplastyApproved === true && l2CompositedUrl) {
        try {
          const l2Base64 = await urlToBase64(l2CompositedUrl);
          logger.log('Layer chaining: using L2 composited image as input for complete-treatment');
          const l3Raw = await generateSingleLayer(analysis, 'complete-treatment', l2Base64);
          setLayerGenerationProgress(3);

          if (l3Raw) {
            const { layer: l3Processed, url: l3Url } = await resolveLayerUrl(l3Raw);

            // Lip-fix compositing: restore L2's lips onto L3 to fix Gemini's lip-lifting
            if (l3Url && l2CompositedUrl) {
              try {
                logger.log('L3 lip-fix: compositing L2 lips onto L3 gengivoplasty result');
                const composited = await compositeGengivoplastyLips(l2CompositedUrl, l3Url);
                if (composited) {
                  // Upload the composited image and use it as the L3 URL
                  const base64Data = composited.replace(/^data:image\/\w+;base64,/, '');
                  const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                  const fileName = `${user?.id || 'anon'}/l3_lipfix_${Date.now()}.png`;
                  const { error: uploadErr } = await supabase.storage
                    .from('dsd-simulations')
                    .upload(fileName, binaryData, { contentType: 'image/png', upsert: true });
                  if (!uploadErr) {
                    const { data: signedData } = await supabase.storage
                      .from('dsd-simulations')
                      .createSignedUrl(fileName, 3600);
                    if (signedData?.signedUrl) {
                      l3Processed.simulation_url = fileName;
                      resolvedUrls['complete-treatment'] = signedData.signedUrl;
                      logger.log('L3 lip-fix: composited image uploaded and ready');
                    }
                  } else {
                    logger.warn('L3 lip-fix: upload failed, using original L3:', uploadErr);
                    if (l3Url) resolvedUrls['complete-treatment'] = l3Url;
                  }
                } else {
                  logger.warn('L3 lip-fix: compositing returned null, using original L3');
                  if (l3Url) resolvedUrls['complete-treatment'] = l3Url;
                }
              } catch (compErr) {
                logger.warn('L3 lip-fix: compositing error, using original L3:', compErr);
                if (l3Url) resolvedUrls['complete-treatment'] = l3Url;
              }
            } else if (l3Url) {
              resolvedUrls['complete-treatment'] = l3Url;
            }

            compositedLayers.push(l3Processed);
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
          const { data: mainSignedData } = await supabase.storage
            .from('dsd-simulations')
            .createSignedUrl(mainLayer.simulation_url, 3600);
          if (mainSignedData?.signedUrl) {
            setSimulationImageUrl(mainSignedData.signedUrl);
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
  }, [imageBase64, result?.analysis, generateSingleLayer, resolveLayerUrl, gingivoplastyApproved]);

  // Retry a single failed layer (L1 and L3 chain from L2; L2 regenerates from original)
  const retryFailedLayer = useCallback(async (layerType: SimulationLayerType) => {
    const analysis = result?.analysis;
    if (!imageBase64 || !analysis) return;

    setRetryingLayer(layerType);
    try {
      // L1 retry: chain from L2 composited image (dewhitening)
      // L3 retry: chain from L2 composited image (gengivoplasty-only)
      let baseImageOverride: string | undefined;
      if (layerType === 'restorations-only') {
        const l2CompositedUrl = layerUrls['whitening-restorations'];
        if (l2CompositedUrl) {
          try {
            baseImageOverride = await urlToBase64(l2CompositedUrl);
            logger.log('L1 retry: chaining from L2 composited image (dewhitening)');
          } catch (err) {
            logger.warn('L1 retry: failed to convert L2 URL to base64, using original:', err);
          }
        }
      } else if (layerType === 'complete-treatment') {
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
        toast.error(t('toasts.dsd.layerError', { layer: LAYER_LABELS[layerType] }));
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
      toast.success(t('toasts.dsd.layerReady', { layer: LAYER_LABELS[layerType] }));
    } catch (err) {
      logger.error(`Retry layer ${layerType} error:`, err);
      toast.error(t('toasts.dsd.layerError', { layer: LAYER_LABELS[layerType] }));
    } finally {
      setRetryingLayer(null);
    }
  }, [imageBase64, result?.analysis, generateSingleLayer, resolveLayerUrl, layerUrls]);

  // E4: Generate whitening comparison (3 levels)
  const generateWhiteningComparison = useCallback(async () => {
    const analysis = result?.analysis;
    if (!imageBase64 || !analysis) return;

    setIsComparingWhitening(true);
    setShowWhiteningComparison(true);

    const allLevels: Array<'natural' | 'hollywood'> = ['natural', 'hollywood'];
    const currentLevel = patientPreferences?.whiteningLevel || 'natural';

    // Only generate the 2 missing levels
    const missingLevels = allLevels.filter(l => l !== currentLevel);

    try {
      const results = await Promise.allSettled(
        missingLevels.map(async (level) => {
          const { data } = await withRetry(
            async () => {
              const resp = await invokeFunction<DSDResult>('generate-dsd', {
                body: {
                  imageBase64,
                  toothShape: TOOTH_SHAPE,
                  regenerateSimulationOnly: true,
                  existingAnalysis: analysis,
                  patientPreferences: { whiteningLevel: level },

                },
              });
              if (resp.error || !resp.data?.simulation_url) {
                throw resp.error || new Error('No URL');
              }
              return resp;
            },
            { maxRetries: 1, baseDelay: 3000 },
          );

          if (data?.simulation_url) {
            const { data: signedData } = await supabase.storage
              .from('dsd-simulations')
              .createSignedUrl(data.simulation_url, 3600);
            return { level, url: signedData?.signedUrl || null };
          }
          return { level, url: null };
        })
      );

      const urls: Record<string, string> = {};
      // Add current level from existing layer
      const currentLayerUrl = layerUrls['whitening-restorations'] || simulationImageUrl;
      if (currentLayerUrl) {
        urls[currentLevel] = currentLayerUrl;
      }

      for (const r of results) {
        if (r.status === 'fulfilled' && r.value.url) {
          urls[r.value.level] = r.value.url;
        }
      }

      setWhiteningComparison(urls);
      toast.success(t('toasts.dsd.whiteningReady'));
    } catch (err) {
      logger.error('Whitening comparison error:', err);
      toast.error(t('toasts.dsd.whiteningError'));
    } finally {
      setIsComparingWhitening(false);
    }
  }, [imageBase64, result?.analysis, invokeFunction, patientPreferences, layerUrls, simulationImageUrl]);

  // Measure annotation container
  useEffect(() => {
    if (!annotationContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setAnnotationDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(annotationContainerRef.current);
    return () => observer.disconnect();
  }, []);

  const analyzeDSD = useCallback(async (retryCount = 0) => {
    const MAX_RETRIES = 2;
    let didRetry = false;
    let hasError = false;

    if (!imageBase64) {
      setError('Nenhuma imagem disponível para análise');
      return;
    }

    // Pre-check credits before starting DSD
    if (!canUseCredits('dsd_simulation')) {
      setError('Créditos insuficientes para simulação DSD. Faça upgrade do seu plano.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setCurrentStep(0);

    // Simulate progress steps (only for analysis phase now)
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < analysisSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2500);

    try {
      // Build request body with optional additional photos and patient preferences
      const requestBody: Record<string, unknown> = {
        imageBase64,
        toothShape: TOOTH_SHAPE,
        analysisOnly: true, // NEW: Request only analysis, simulation will be background
      };

      // Add additional photos if available (for enriching analysis context)
      if (additionalPhotos?.smile45 || additionalPhotos?.face) {
        requestBody.additionalPhotos = {
          smile45: additionalPhotos.smile45 || undefined,
          face: additionalPhotos.face || undefined,
        };
      }

      // Add patient preferences if available (whitening level selection)
      if (patientPreferences?.whiteningLevel) {
        requestBody.patientPreferences = {
          whiteningLevel: patientPreferences.whiteningLevel,
        };
      }

      // Pass clinical observations from initial analysis to prevent contradictions
      // (e.g., smile arc classified differently by each AI call)
      if (clinicalObservations?.length) {
        requestBody.clinicalObservations = clinicalObservations;
      }

      // Pass per-tooth clinical findings so DSD doesn't invent restorations
      if (clinicalTeethFindings?.length) {
        requestBody.clinicalTeethFindings = clinicalTeethFindings;
      }

      // PHASE 1: Get analysis quickly (~25s)
      const { data, error: fnError } = await invokeFunction<DSDResult>('generate-dsd', {
        body: requestBody,
      });

      clearInterval(stepInterval);

      if (fnError) {
        throw fnError;
      }

      if (data?.analysis) {
        // Show analysis immediately
        setResult(data);
        setIsAnalyzing(false);
        const dsdCost = getCreditCost('dsd_simulation');
        toast.success(t('toasts.dsd.analysisCompleted'), {
          description: t('toasts.dsd.creditsUsed', { count: dsdCost }),
        });
        refreshSubscription(); // Update credit count after consumption

        // PHASE 2: Generate all simulation layers in background (sequential chaining)
        // Note: We pass analysis directly since state update is async
        generateAllLayers(data.analysis);
      } else {
        throw new Error('Dados de análise não retornados');
      }
    } catch (error: unknown) {
      clearInterval(stepInterval);
      logger.error('DSD error:', error);

      const err = error as { name?: string; message?: string; code?: string; status?: number };

      // Check if it's a connection/timeout error that can be retried
      const isConnectionError =
        err.name === 'AbortError' ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('fetch') ||
        err.message?.includes('timeout') ||
        err.message?.includes('network');

      if (isConnectionError && retryCount < MAX_RETRIES) {
        logger.debug(`DSD retry ${retryCount + 1}/${MAX_RETRIES}...`);
        didRetry = true;
        toast.info(t('toasts.dsd.reconnecting', { count: retryCount + 1 }));
        await new Promise(r => setTimeout(r, TIMING.DSD_RETRY_DELAY));
        return analyzeDSD(retryCount + 1);
      }

      hasError = true;
      if (err.status === 429 || err.message?.includes('429') || err.code === 'RATE_LIMITED') {
        setError('Limite de requisições excedido. Aguarde alguns minutos.');
      } else if (err.status === 402 || err.message?.includes('402') || err.code === 'INSUFFICIENT_CREDITS' || err.code === 'PAYMENT_REQUIRED') {
        setError('Créditos insuficientes para simulação DSD. Faça upgrade do seu plano.');
        refreshSubscription();
      } else if (isConnectionError) {
        setError('Erro de conexão. Verifique sua internet e tente novamente.');
      } else {
        // Show actual server error when available, otherwise generic message
        const serverMsg = err.message && !err.message.includes('non-2xx') ? err.message : null;
        setError(serverMsg || 'Não foi possível gerar a análise DSD. Você pode pular esta etapa.');
      }
      setIsAnalyzing(false);
    } finally {
      clearInterval(stepInterval);
      // Only set isAnalyzing to false if we didn't retry and didn't already handle it
      if (!didRetry && !hasError) {
        setIsAnalyzing(false);
      }
    }
  }, [imageBase64, canUseCredits, invokeFunction, refreshSubscription, getCreditCost, generateAllLayers, additionalPhotos, patientPreferences, clinicalObservations, clinicalTeethFindings]);

  // Auto-start analysis when component mounts with image - use ref to prevent loops
  useEffect(() => {
    if (imageBase64 && !analysisStartedRef.current) {
      analysisStartedRef.current = true;
      analyzeDSD();
    }
  }, [imageBase64, analyzeDSD]);

  const handleRetry = () => {
    setResult(null);
    setError(null);
    setSimulationImageUrl(null);
    setSimulationError(false);
    setIsSimulationGenerating(false);
    setLayers([]);
    setLayerUrls({});
    setActiveLayerIndex(0);
    setLayersGenerating(false);
    setFailedLayers([]);
    setRetryingLayer(null);
    setShowWhiteningComparison(false);
    setWhiteningComparison({});
    lastCompositeSourcePathRef.current = null;
    analysisStartedRef.current = false; // Allow retry
    analyzeDSD();
  };

  const handleRegenerateSimulation = async () => {
    if (!imageBase64 || !result?.analysis) return;

    setIsRegeneratingSimulation(true);
    setSimulationError(false);
    setFailedLayers([]);
    lastCompositeSourcePathRef.current = null;

    try {
      // Regenerate all layers (sequential chaining)
      setLayers([]);
      setLayerUrls({});
      setActiveLayerIndex(0);
      await generateAllLayers(result.analysis);
      toast.success(t('toasts.dsd.regenerated'));
    } catch (error: unknown) {
      logger.error('Regenerate simulation error:', error);
      toast.error(t('toasts.dsd.regenerateError'));
    } finally {
      setIsRegeneratingSimulation(false);
    }
  };

  const handleContinue = () => {
    // Include gingivoplastyApproved in the result so downstream (review step, submit) can use it
    const resultWithGingivo = result
      ? { ...result, gingivoplastyApproved: gingivoplastyApproved === true }
      : result;
    onComplete(resultWithGingivo);
  };

  const handleSelectWhiteningLevel = (level: 'natural' | 'white' | 'hollywood', url: string) => {
    const labels: Record<string, string> = {
      natural: 'Natural (A1/A2)',
      white: 'Branco (BL2/BL3)',
      hollywood: 'Diamond (BL1/BL2/BL3)',
    };
    // Update preferences (persists via draft auto-save)
    onPreferencesChange?.({ whiteningLevel: level });
    // Swap the whitening-restorations layer URL instantly
    setLayerUrls(prev => ({ ...prev, 'whitening-restorations': url }));
    setLayers(prev => prev.map(l =>
      l.type === 'whitening-restorations'
        ? { ...l, whitening_level: level, simulation_url: url }
        : l
    ));
    // Always update main view and switch to whitening-restorations tab
    setSimulationImageUrl(url);
    const whiteningIdx = layers.findIndex(l => l.type === 'whitening-restorations');
    if (whiteningIdx >= 0) {
      setActiveLayerIndex(whiteningIdx);
    }
    toast.success(t('toasts.dsd.whiteningUpdated', { level: labels[level] }));
  };

  const handleSelectLayer = (idx: number, layerType: string) => {
    setActiveLayerIndex(idx);
    const url = layerUrls[layerType];
    if (url) setSimulationImageUrl(url);
  };

  // Gengivoplasty approval: generate L3 chained from L2's composited image.
  // The composited image (original photo + whitened teeth) looks like a real photo
  // to Gemini, so it accepts it as input for gengivoplasty-only editing.
  const handleApproveGingivoplasty = useCallback(async () => {
    setGingivoplastyApproved(true);
    const analysis = result?.analysis;
    if (!analysis || !imageBase64) return;

    setRetryingLayer('complete-treatment');
    try {
      // Use L2's composited signed URL (original photo with whitened teeth)
      let l2Base64: string | undefined;
      const l2CompositedUrl = layerUrls['whitening-restorations'];
      if (l2CompositedUrl) {
        try {
          l2Base64 = await urlToBase64(l2CompositedUrl);
          logger.log('Gengivoplasty approval: using L2 composited image as input');
        } catch (err) {
          logger.warn('Failed to convert L2 composited URL to base64, using original photo:', err);
        }
      }

      const layer = await generateSingleLayer(analysis, 'complete-treatment', l2Base64);
      if (!layer) {
        toast.error(t('toasts.dsd.layerError', { layer: 'Gengivoplastia' }));
        return;
      }
      const { layer: processed, url } = await resolveLayerUrl(layer);

      // Lip-fix compositing: restore L2's lips onto L3
      let finalUrl = url;
      if (url && l2CompositedUrl) {
        try {
          logger.log('Gengivoplasty approval: compositing L2 lips onto L3');
          const composited = await compositeGengivoplastyLips(l2CompositedUrl, url);
          if (composited) {
            const base64Data = composited.replace(/^data:image\/\w+;base64,/, '');
            const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            const fileName = `${user?.id || 'anon'}/l3_lipfix_${Date.now()}.png`;
            const { error: uploadErr } = await supabase.storage
              .from('dsd-simulations')
              .upload(fileName, binaryData, { contentType: 'image/png', upsert: true });
            if (!uploadErr) {
              const { data: signedData } = await supabase.storage
                .from('dsd-simulations')
                .createSignedUrl(fileName, 3600);
              if (signedData?.signedUrl) {
                processed.simulation_url = fileName;
                finalUrl = signedData.signedUrl;
                logger.log('Gengivoplasty approval: lip-fix compositing complete');
              }
            }
          }
        } catch (compErr) {
          logger.warn('Gengivoplasty approval: lip-fix compositing failed, using original:', compErr);
        }
      }

      setLayers(prev => [...prev, processed]);
      if (finalUrl) setLayerUrls(prev => ({ ...prev, [processed.type]: finalUrl! }));
      setResult(prev => prev ? { ...prev, layers: [...(prev.layers || []), processed] } : prev);
      toast.success(t('toasts.dsd.layerReady', { layer: 'Gengivoplastia' }));
    } catch (err) {
      logger.error('Gengivoplasty layer error:', err);
      setFailedLayers(prev => [...prev, 'complete-treatment']);
      toast.error(t('toasts.dsd.layerError', { layer: 'Gengivoplastia' }));
    } finally {
      setRetryingLayer(null);
    }
  }, [result?.analysis, imageBase64, layerUrls, generateSingleLayer, resolveLayerUrl]);

  // Gengivoplasty discard
  const handleDiscardGingivoplasty = useCallback(() => {
    setGingivoplastyApproved(false);
  }, []);

  return {
    // State
    isAnalyzing,
    currentStep,
    result,
    error,
    simulationImageUrl,
    isRegeneratingSimulation,
    isCompositing,
    isSimulationGenerating,
    simulationError,
    layers,
    layerUrls,
    activeLayerIndex,
    layersGenerating,
    layerGenerationProgress,
    failedLayers,
    retryingLayer,
    whiteningComparison,
    isComparingWhitening,
    showWhiteningComparison,
    gingivoplastyApproved,
    showAnnotations,
    annotationContainerRef,
    annotationDimensions,
    toothBounds,

    // Derived
    analysisSteps,
    determineLayersNeeded,
    hasGingivoSuggestion,

    // Actions
    handleRetry,
    handleRegenerateSimulation,
    handleContinue,
    generateWhiteningComparison,
    generateAllLayers,
    retryFailedLayer,
    setShowAnnotations,
    setShowWhiteningComparison,
    handleSelectWhiteningLevel,
    handleSelectLayer,
    handleApproveGingivoplasty,
    handleDiscardGingivoplasty,

    // Props pass-through needed by sub-components
    imageBase64,
    onSkip,
    patientPreferences,
  };
}

export type UseDSDStepReturn = ReturnType<typeof useDSDStep>;
