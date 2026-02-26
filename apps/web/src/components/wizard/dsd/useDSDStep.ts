import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getSignedDSDUrl } from '@/data/storage';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/hooks/useSubscription';
import { logger } from '@/lib/logger';
import { trackEvent } from '@/lib/analytics';
import { withRetry } from '@/lib/retry';
import { TIMING } from '@/lib/constants';
// compositeTeeth.ts kept for potential future use but compositing disabled —
// Gemini's prompt-based preservation of lips/gums produces better results
import { compositeGengivoplastyLips } from '@/lib/compositeGingivo';
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
import { getLayerLabel } from '@/types/dsd';

// Tooth shape is now fixed as 'natural' - removed manual selection per market research
const TOOTH_SHAPE = 'natural' as const;

/**
 * Fetch an image URL and convert to a PNG data URL (base64).
 * Uses PNG (lossless) to prevent compression artifacts between layers.
 * Each JPEG re-encode accumulates blocking artifacts at tooth-gum boundaries.
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

// analysisSteps moved inside the hook to support i18n — see useMemo below

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
  /** 0-100 score from photo analysis: how suitable the photo is for DSD image editing */
  photoQualityScore?: number;
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
  photoQualityScore,
  onResultChange,
  onPreferencesChange,
}: DSDStepProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  // Initialize with draft result if available
  const [result, setResult] = useState<DSDResult | null>(initialResult || null);
  const [error, setError] = useState<string | null>(null);
  // DSD confirmation: user must explicitly confirm before auto-start analysis
  const [dsdConfirmed, setDsdConfirmed] = useState(!!initialResult);
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

  const analysisSteps = useMemo(() => [
    { label: t('dsd.detectingLandmarks'), duration: 2000 },
    { label: t('dsd.analyzingProportions'), duration: 3000 },
    { label: t('dsd.calculatingGolden'), duration: 2000 },
    { label: t('dsd.evaluatingSymmetry'), duration: 2000 },
  ], [t]);

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
        const signedUrl = await getSignedDSDUrl(result.simulation_url);
        if (signedUrl) {
          setSimulationImageUrl(signedUrl);
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
            const signedUrl = await getSignedDSDUrl(layer.simulation_url);
            if (signedUrl) urls[layer.type] = signedUrl;
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

  // Auto-generate layers when restored from a draft — defined as ref here,
  // useEffect moved below generateAllLayers to avoid TDZ (temporal dead zone).
  const layerAutoGenTriggered = useRef(false);

  // Reactive sync: update simulationImageUrl whenever activeLayerIndex or layerUrls change.
  // This ensures the displayed image always matches the selected layer tab, even if
  // handleSelectLayer's layerUrls lookup missed a data URL or async timing issue.
  useEffect(() => {
    if (layers.length > 0 && activeLayerIndex < layers.length) {
      const activeLayer = layers[activeLayerIndex];
      const url = layerUrls[activeLayer.type] || activeLayer.simulation_url;
      if (url) setSimulationImageUrl(url);
    }
  }, [activeLayerIndex, layers, layerUrls]);

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

  // Client-side lip compositing enabled as fallback — applied after lip retries
  // are exhausted and lips_moved is still true (see generateSingleLayer).

  // Check if analysis has gengivoplasty suggestions — use structured fields only
  // for consistency. Text keyword matching is unreliable and causes the same
  // photo to sometimes detect gengivoplasty, sometimes not.
  const hasGingivoSuggestion = useCallback((analysis: DSDAnalysis): boolean => {
    // Primary: AI explicitly chose gengivoplasty as treatment_indication
    const hasExplicit = !!analysis.suggestions?.some(s => {
      const indication = (s.treatment_indication || '').toLowerCase();
      return indication === 'gengivoplastia' || indication === 'gingivoplasty';
    });
    if (hasExplicit) return true;
    // Secondary: high smile line (>3mm gum display) — always offer option
    if (analysis.smile_line === 'alta') return true;
    // Tertiary: medium smile line — check suggestion text for gingivoplasty keywords
    // (catches cases where treatment_indication enum wasn't filled correctly)
    if (analysis.smile_line === 'média') {
      const gingivoKeywords = ['gengivoplastia', 'excesso gengival', 'sorriso gengival', 'coroa clínica curta', 'coroa clinica curta'];
      const hasKeywordInSuggestions = !!analysis.suggestions?.some(s => {
        const text = `${s.current_issue} ${s.proposed_change}`.toLowerCase();
        return gingivoKeywords.some(kw => text.includes(kw));
      });
      if (hasKeywordInSuggestions) return true;
    }
    return false;
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
    l2SignedUrl?: string,
  ): Promise<SimulationLayer | null> => {
    const effectiveImage = baseImageOverride || imageBase64;
    if (!effectiveImage) return null;

    const isGingivalLayer = layerType === 'complete-treatment' || layerType === 'root-coverage';
    // Lip retries: L3 from original gets 2 retries, L3 chained from L2 gets 1 retry,
    // non-gingival layers get 0. Server validates lips and returns lips_moved=true.
    const MAX_LIP_RETRIES = isGingivalLayer ? (baseImageOverride ? 1 : 2) : 0;

    try {
      let bestResult: (DSDResult & { lips_moved?: boolean }) | null = null;

      for (let lipAttempt = 0; lipAttempt <= MAX_LIP_RETRIES; lipAttempt++) {
        // Generate reqId once per lip attempt so withRetry retries reuse the same ID (idempotency)
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
  }, [imageBase64, invokeFunction, patientPreferences]);

  // Resolve a layer's signed URL (no client-side compositing — Gemini already
  // preserves lips/gums/background via prompt instructions)
  const resolveLayerUrl = useCallback(async (
    layer: SimulationLayer,
  ): Promise<{ layer: SimulationLayer; url: string | null }> => {
    if (!layer.simulation_url) return { layer, url: null };
    // Data URLs (from lip compositing) and full URLs are already displayable
    if (layer.simulation_url.startsWith('data:') || layer.simulation_url.startsWith('http')) {
      return { layer, url: layer.simulation_url };
    }
    const url = await getSignedDSDUrl(layer.simulation_url);
    return { layer, url };
  }, []);

  // L1-first sequential chaining: L1 (corrections) → L2 (whitening) → L3 (gengivoplasty)
  // Each Gemini call does ONE thing, using the previous layer as input.
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

      // === Phase 2: Generate L2 from L1 (whitening ONLY — everything else identical) ===
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
        // L1 failed — generate L2 from original as fallback
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
  }, [imageBase64, result?.analysis, generateSingleLayer, resolveLayerUrl, gingivoplastyApproved]);

  // Auto-generate layers when restored from a draft that has analysis but no layers.
  // This handles the case where the draft was saved after analysis completed but before
  // layer generation finished (e.g., user navigated away mid-generation).
  // Placed AFTER generateAllLayers definition to avoid TDZ error.
  useEffect(() => {
    if (
      !layerAutoGenTriggered.current &&
      initialResult?.analysis &&
      !initialResult?.layers?.length &&
      result?.analysis &&
      layers.length === 0 &&
      !isSimulationGenerating &&
      !simulationError &&
      !layersGenerating &&
      imageBase64
    ) {
      layerAutoGenTriggered.current = true;
      logger.log('Auto-triggering layer generation for draft restored without layers');
      generateAllLayers(result.analysis);
    }
  }, [result?.analysis, layers.length, isSimulationGenerating, simulationError, layersGenerating, imageBase64, generateAllLayers, initialResult]);

  // Retry a single failed layer (respects L2-first architecture)
  const retryFailedLayer = useCallback(async (layerType: SimulationLayerType) => {
    const analysis = result?.analysis;
    if (!imageBase64 || !analysis) return;

    setRetryingLayer(layerType);
    try {
      // L3 retry: chain from L2 composited image
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
          const reqId = crypto.randomUUID();
          const { data } = await withRetry(
            async () => {
              const resp = await invokeFunction<DSDResult>('generate-dsd', {
                body: {
                  reqId,
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
            const signedUrl = await getSignedDSDUrl(data.simulation_url);
            return { level, url: signedUrl };
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
      setError(t('errors.noImageAvailable'));
      return;
    }

    // Pre-check credits before starting DSD
    if (!canUseCredits('dsd_simulation')) {
      setError(t('errors.insufficientCredits'));
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
        reqId: crypto.randomUUID(),
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
        throw new Error(t('errors.noAnalysisData'));
      }
    } catch (error: unknown) {
      clearInterval(stepInterval);
      logger.error('DSD error:', error);

      const err = error as { name?: string; message?: string; code?: string; status?: number };

      // Check if it's a connection/timeout error that can be retried
      const isConnectionError =
        err.name === 'AbortError' ||
        err.name === 'FunctionsFetchError' ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('Failed to send a request') ||
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
        setError(t('errors.rateLimitExceeded'));
      } else if (err.status === 402 || err.message?.includes('402') || err.code === 'INSUFFICIENT_CREDITS' || err.code === 'PAYMENT_REQUIRED') {
        setError(t('errors.insufficientCredits'));
        refreshSubscription();
      } else if (isConnectionError) {
        setError(t('errors.connectionError'));
      } else {
        // Show actual server error when available, otherwise generic message
        const serverMsg = err.message && !err.message.includes('non-2xx') ? err.message : null;
        setError(serverMsg || t('errors.dsdGenerationFailed'));
      }
      setIsAnalyzing(false);
    } finally {
      clearInterval(stepInterval);
      // Only set isAnalyzing to false if we didn't retry and didn't already handle it
      if (!didRetry && !hasError) {
        setIsAnalyzing(false);
      }
    }
  }, [imageBase64, canUseCredits, invokeFunction, refreshSubscription, getCreditCost, generateAllLayers, additionalPhotos, patientPreferences, clinicalObservations, clinicalTeethFindings, photoQualityScore]);

  // Auto-start analysis when component mounts with image AND user has confirmed
  useEffect(() => {
    if (imageBase64 && !analysisStartedRef.current && dsdConfirmed) {
      analysisStartedRef.current = true;
      analyzeDSD();
    }
  }, [imageBase64, dsdConfirmed, analyzeDSD]);

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
    // IMPORTANT: preserve null → undefined so downstream `!== false` check treats "unanswered" as inclusion
    // Only explicit `false` (user clicked dismiss) should block gengivoplasty
    const resultWithGingivo = result
      ? { ...result, gingivoplastyApproved: gingivoplastyApproved ?? undefined }
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

      const l2SignedUrl = layerUrls['whitening-restorations'];
      const layer = await generateSingleLayer(analysis, 'complete-treatment', l2Base64, l2SignedUrl);
      const gingivoLabel = t('treatments.gengivoplastia.shortLabel');
      if (!layer) {
        toast.error(t('toasts.dsd.layerError', { layer: gingivoLabel }));
        return;
      }
      const { layer: processed, url } = await resolveLayerUrl(layer);
      setLayers(prev => {
        const updated = [...prev, processed];
        // Auto-select the new gengivoplasty layer so user sees it immediately
        setActiveLayerIndex(updated.length - 1);
        return updated;
      });
      if (url) setLayerUrls(prev => ({ ...prev, [processed.type]: url }));
      setResult(prev => prev ? { ...prev, layers: [...(prev.layers || []), processed] } : prev);
      toast.success(t('toasts.dsd.layerReady', { layer: gingivoLabel }));
    } catch (err) {
      logger.error('Gengivoplasty layer error:', err);
      setFailedLayers(prev => [...prev, 'complete-treatment']);
      toast.error(t('toasts.dsd.layerError', { layer: gingivoLabel }));
    } finally {
      setRetryingLayer(null);
    }
  }, [result?.analysis, imageBase64, layerUrls, generateSingleLayer, resolveLayerUrl]);

  // Gengivoplasty discard
  const handleDiscardGingivoplasty = useCallback(() => {
    setGingivoplastyApproved(false);
  }, []);

  // Confirm DSD: called from DSDInitialState to allow auto-start
  const confirmDSD = useCallback(() => {
    setDsdConfirmed(true);
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
    dsdConfirmed,
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
    confirmDSD,

    // Props pass-through needed by sub-components
    imageBase64,
    onSkip,
    patientPreferences,
  };
}

export type UseDSDStepReturn = ReturnType<typeof useDSDStep>;
