import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import { logger } from '@/lib/logger';
import { withRetry } from '@/lib/retry';
import { createCompositeTeethOnly } from '@/lib/compositeTeeth';
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

  // Multi-layer simulation states
  const [layers, setLayers] = useState<SimulationLayer[]>([]);
  const [layerUrls, setLayerUrls] = useState<Record<string, string>>({});
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const [layersGenerating, setLayersGenerating] = useState(false);
  const [layerGenerationProgress, setLayerGenerationProgress] = useState(0);
  const [failedLayers, setFailedLayers] = useState<SimulationLayerType[]>([]);
  const [retryingLayer, setRetryingLayer] = useState<SimulationLayerType | null>(null);

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

  // Deterministic post-processing: copy original pixels everywhere except teeth bounds
  // Skip when multi-layer generation is active (compositing is handled inside generateAllLayers)
  useEffect(() => {
    const run = async () => {
      if (!user) return;
      if (!imageBase64) return;
      if (!simulationImageUrl) return;
      if (!result?.simulation_url) return;
      if (!toothBounds.length) return;

      // Skip compositing when layers are in use (handled by generateAllLayers)
      if (layers.length > 0 || layersGenerating) return;

      // Avoid infinite loops: if it's already a composited file, do nothing
      if (result.simulation_url.includes('dsd_composited_')) return;

      // Avoid re-processing the same source path multiple times
      if (lastCompositeSourcePathRef.current === result.simulation_url) return;
      lastCompositeSourcePathRef.current = result.simulation_url;

      setIsCompositing(true);
      try {
        const compositeBlob = await createCompositeTeethOnly({
          beforeDataUrl: imageBase64,
          afterUrl: simulationImageUrl,
          bounds: toothBounds,
        });

        const compositePath = `${user.id}/dsd_composited_${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('dsd-simulations')
          .upload(compositePath, compositeBlob, {
            upsert: true,
            contentType: 'image/jpeg',
          });

        if (uploadError) throw uploadError;

        // Replace the simulation URL with the composited version so later screens/PDF use the preserved image.
        setResult((prev) => (prev ? { ...prev, simulation_url: compositePath } : prev));
        toast.success('Simulação refinada (lábios preservados)');
      } catch (err) {
        logger.error('DSD compositing error:', err);
        // Keep the original simulation if compositing fails
      } finally {
        setIsCompositing(false);
      }
    };

    run();
  }, [user, imageBase64, simulationImageUrl, result?.simulation_url, toothBounds, layers.length, layersGenerating]);

  // Determine which layers to generate based on analysis
  const determineLayersNeeded = useCallback((analysis: DSDAnalysis): SimulationLayerType[] => {
    const needed: SimulationLayerType[] = ['restorations-only', 'whitening-restorations'];

    // Layer 3: complete-treatment with gengivoplasty
    // Include when AI detected gingival treatment need, regardless of smile line
    const hasGingivoSuggestion = analysis.suggestions?.some(s => {
      // Check structured treatment_indication first (more reliable)
      if (s.treatment_indication === 'gengivoplastia') return true;
      // Fallback to text matching
      const text = `${s.current_issue} ${s.proposed_change}`.toLowerCase();
      return text.includes('gengivoplastia') || text.includes('gengival') || text.includes('zênite');
    });

    if (hasGingivoSuggestion) {
      needed.push('complete-treatment');
    }

    return needed;
  }, []);

  // Generate a single layer
  const generateSingleLayer = useCallback(async (
    analysis: DSDAnalysis,
    layerType: SimulationLayerType,
  ): Promise<SimulationLayer | null> => {
    if (!imageBase64) return null;

    try {
      const { data } = await withRetry(
        async () => {
          const resp = await invokeFunction<DSDResult & { layer_type?: string }>('generate-dsd', {
            body: {
              imageBase64,
              toothShape: TOOTH_SHAPE,
              regenerateSimulationOnly: true,
              existingAnalysis: analysis,
              patientPreferences,
              layerType,

            },
          });
          if (resp.error || !resp.data?.simulation_url) {
            throw resp.error || new Error('Simulation returned no URL');
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

      if (!data?.simulation_url) return null;

      return {
        type: layerType,
        label: LAYER_LABELS[layerType],
        simulation_url: data.simulation_url,
        whitening_level: patientPreferences?.whiteningLevel || 'natural',
        includes_gengivoplasty: layerType === 'complete-treatment',
      };
    } catch (err) {
      logger.error(`Layer ${layerType} generation error:`, err);
      return null;
    }
  }, [imageBase64, invokeFunction, patientPreferences]);

  // Composite a single layer: upload composited version and return signed URL
  const compositeAndResolveLayer = useCallback(async (
    layer: SimulationLayer,
  ): Promise<{ layer: SimulationLayer; url: string | null }> => {
    if (!layer.simulation_url) return { layer, url: null };

    const { data: signedData } = await supabase.storage
      .from('dsd-simulations')
      .createSignedUrl(layer.simulation_url, 3600);

    if (signedData?.signedUrl && toothBounds.length > 0 && !layer.simulation_url.includes('dsd_composited_') && user) {
      try {
        const compositeBlob = await createCompositeTeethOnly({
          beforeDataUrl: imageBase64!,
          afterUrl: signedData.signedUrl,
          bounds: toothBounds,
          includeGingiva: layer.includes_gengivoplasty,
        });

        const compositePath = `${user.id}/dsd_composited_${layer.type}_${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('dsd-simulations')
          .upload(compositePath, compositeBlob, {
            upsert: true,
            contentType: 'image/jpeg',
          });

        if (!uploadError) {
          const { data: compSignedData } = await supabase.storage
            .from('dsd-simulations')
            .createSignedUrl(compositePath, 3600);
          return {
            layer: { ...layer, simulation_url: compositePath },
            url: compSignedData?.signedUrl || null,
          };
        }
      } catch {
        // Fall through to use original URL
      }
    }

    return { layer, url: signedData?.signedUrl || null };
  }, [imageBase64, toothBounds, user]);

  // Generate all layers in parallel
  const generateAllLayers = useCallback(async (analysisData?: DSDAnalysis, initialSimulationUrl?: string | null) => {
    const analysis = analysisData || result?.analysis;
    if (!imageBase64 || !analysis) return;

    const layerTypes = determineLayersNeeded(analysis);
    setLayersGenerating(true);
    setIsSimulationGenerating(true);
    setSimulationError(false);
    setFailedLayers([]);
    setLayerGenerationProgress(0);

    try {
      // Generate layers in parallel, but reuse initial simulation for whitening-restorations
      const results = await Promise.allSettled(
        layerTypes.map(async (layerType) => {
          // Reuse the initial simulation URL for whitening-restorations (same prompt)
          if (layerType === 'whitening-restorations' && initialSimulationUrl) {
            setLayerGenerationProgress(prev => prev + 1);
            return {
              type: layerType,
              label: LAYER_LABELS[layerType],
              simulation_url: initialSimulationUrl,
              whitening_level: patientPreferences?.whiteningLevel || 'natural',
              includes_gengivoplasty: false,
            } as SimulationLayer;
          }
          const layer = await generateSingleLayer(analysis, layerType);
          setLayerGenerationProgress(prev => prev + 1);
          return layer;
        })
      );

      const successfulLayers: SimulationLayer[] = [];
      const failed: SimulationLayerType[] = [];

      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value !== null) {
          successfulLayers.push(r.value);
        } else {
          failed.push(layerTypes[i]);
        }
      });

      setFailedLayers(failed);

      if (successfulLayers.length === 0) {
        setSimulationError(true);
        return;
      }

      // Apply teeth-only compositing to each layer
      const compositedLayers: SimulationLayer[] = [];
      const resolvedUrls: Record<string, string> = {};

      for (const layer of successfulLayers) {
        const { layer: processed, url } = await compositeAndResolveLayer(layer);
        compositedLayers.push(processed);
        if (url) resolvedUrls[processed.type] = url;
      }

      setLayers(compositedLayers);
      setLayerUrls(resolvedUrls);

      // Set the main simulation URL to the first layer (matches activeLayerIndex=0)
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

      const totalExpected = layerTypes.length;
      if (failed.length > 0) {
        toast.success(`${compositedLayers.length} de ${totalExpected} camadas prontas`, {
          description: `${failed.length} camada(s) falharam — tente novamente`,
        });
      } else {
        toast.success(`${compositedLayers.length} camadas de simulação prontas!`);
      }
    } catch (err) {
      logger.error('Generate all layers error:', err);
      setSimulationError(true);
    } finally {
      setLayersGenerating(false);
      setIsSimulationGenerating(false);
    }
  }, [imageBase64, result?.analysis, determineLayersNeeded, generateSingleLayer, compositeAndResolveLayer, patientPreferences]);

  // Retry a single failed layer
  const retryFailedLayer = useCallback(async (layerType: SimulationLayerType) => {
    const analysis = result?.analysis;
    if (!imageBase64 || !analysis) return;

    setRetryingLayer(layerType);
    try {
      const layer = await generateSingleLayer(analysis, layerType);
      if (!layer) {
        toast.error(`Falha ao gerar camada: ${LAYER_LABELS[layerType]}`);
        return;
      }

      const { layer: processed, url } = await compositeAndResolveLayer(layer);

      setLayers(prev => [...prev, processed]);
      if (url) {
        setLayerUrls(prev => ({ ...prev, [processed.type]: url }));
      }
      setFailedLayers(prev => prev.filter(t => t !== layerType));
      setResult(prev => prev ? {
        ...prev,
        layers: [...(prev.layers || []), processed],
      } : prev);
      toast.success(`Camada "${LAYER_LABELS[layerType]}" pronta!`);
    } catch (err) {
      logger.error(`Retry layer ${layerType} error:`, err);
      toast.error(`Falha ao gerar camada: ${LAYER_LABELS[layerType]}`);
    } finally {
      setRetryingLayer(null);
    }
  }, [imageBase64, result?.analysis, generateSingleLayer, compositeAndResolveLayer]);

  // E4: Generate whitening comparison (3 levels)
  const generateWhiteningComparison = useCallback(async () => {
    const analysis = result?.analysis;
    if (!imageBase64 || !analysis) return;

    setIsComparingWhitening(true);
    setShowWhiteningComparison(true);

    const allLevels: Array<'natural' | 'white' | 'hollywood'> = ['natural', 'white', 'hollywood'];
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
      toast.success('Comparação de clareamento pronta!');
    } catch (err) {
      logger.error('Whitening comparison error:', err);
      toast.error('Erro ao gerar comparação de clareamento');
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
        toast.success('Análise de proporções concluída!', {
          description: `${dsdCost} créditos utilizados.`,
        });
        refreshSubscription(); // Update credit count after consumption

        // PHASE 2: Generate all simulation layers in background
        // Note: We pass analysis directly since state update is async
        // Pass initial simulation_url so whitening-restorations layer can reuse it
        generateAllLayers(data.analysis, data.simulation_url);
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
        toast.info(`Reconectando... (tentativa ${retryCount + 1})`);
        await new Promise(r => setTimeout(r, 2000)); // Wait 2s before retry
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
      // Regenerate all layers (no initial URL — force fresh generation)
      setLayers([]);
      setLayerUrls({});
      setActiveLayerIndex(0);
      await generateAllLayers(result.analysis, null);
      toast.success('Novas simulações geradas!');
    } catch (error: unknown) {
      logger.error('Regenerate simulation error:', error);
      toast.error('Erro ao regenerar simulação. Tente novamente.');
    } finally {
      setIsRegeneratingSimulation(false);
    }
  };

  const handleContinue = () => {
    onComplete(result);
  };

  const handleSelectWhiteningLevel = (level: 'natural' | 'white' | 'hollywood', url: string) => {
    const labels: Record<string, string> = {
      natural: 'Natural (A1/A2)',
      white: 'Branco (BL2/BL3)',
      hollywood: 'Hollywood (BL1)',
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
    toast.success(`Nível de clareamento atualizado para ${labels[level]}`);
  };

  const handleSelectLayer = (idx: number, layerType: string) => {
    setActiveLayerIndex(idx);
    const url = layerUrls[layerType];
    if (url) setSimulationImageUrl(url);
  };

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
    showAnnotations,
    annotationContainerRef,
    annotationDimensions,
    toothBounds,

    // Derived
    analysisSteps,
    determineLayersNeeded,

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

    // Props pass-through needed by sub-components
    imageBase64,
    onSkip,
    patientPreferences,
  };
}

export type UseDSDStepReturn = ReturnType<typeof useDSDStep>;
