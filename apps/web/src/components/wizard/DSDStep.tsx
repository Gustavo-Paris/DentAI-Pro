import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Smile, Loader2, RefreshCw, ChevronRight, Lightbulb, AlertCircle, Zap, ArrowRight, Eye, EyeOff, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import { ComparisonSlider } from '@/components/dsd/ComparisonSlider';
import { AnnotationOverlay } from '@/components/dsd/AnnotationOverlay';
import { ProportionsCard } from '@/components/dsd/ProportionsCard';
import { ProgressRing } from '@/components/ProgressRing';
import { CompactStepIndicator } from '@/components/CompactStepIndicator';
import { logger } from '@/lib/logger';
import { withRetry } from '@/lib/retry';
import { createCompositeTeethOnly } from '@/lib/compositeTeeth';
import type {
  DSDAnalysis,
  DSDResult,
  DSDSuggestion,
  TreatmentIndication,
  SimulationLayer,
  SimulationLayerType,
  ToothBoundsPct,
  DetectedToothForMask,
  ClinicalToothFinding,
  AdditionalPhotos,
  PatientPreferences,
} from '@/types/dsd';
import { LAYER_LABELS } from '@/types/dsd';

// Re-export types for backward compatibility with existing importers
export type { TreatmentIndication, DSDSuggestion, DSDAnalysis, DSDResult };

// Tooth shape is now fixed as 'natural' - removed manual selection per market research
const TOOTH_SHAPE = 'natural' as const;

interface DSDStepProps {
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

const analysisSteps = [
  { label: 'Detectando landmarks faciais...', duration: 2000 },
  { label: 'Analisando proporções dentárias...', duration: 3000 },
  { label: 'Calculando proporção dourada...', duration: 2000 },
  { label: 'Avaliando simetria...', duration: 2000 },
];

export function DSDStep({ imageBase64, onComplete, onSkip, additionalPhotos, patientPreferences, detectedTeeth, initialResult, clinicalObservations, clinicalTeethFindings, onResultChange, onPreferencesChange }: DSDStepProps) {
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
      
      const err = error as { name?: string; message?: string; code?: string };
      
      // Check if it's a connection/timeout error that can be retried
      const isConnectionError = 
        err.name === 'AbortError' ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('fetch') ||
        err.message?.includes('timeout') ||
        err.message?.includes('network') ||
        err.message?.includes('500');
      
      if (isConnectionError && retryCount < MAX_RETRIES) {
        logger.debug(`DSD retry ${retryCount + 1}/${MAX_RETRIES}...`);
        didRetry = true;
        toast.info(`Reconectando... (tentativa ${retryCount + 1})`);
        await new Promise(r => setTimeout(r, 2000)); // Wait 2s before retry
        return analyzeDSD(retryCount + 1);
      }
      
      hasError = true;
      if (err.message?.includes('429') || err.code === 'RATE_LIMITED') {
        setError('Limite de requisições excedido. Aguarde alguns minutos.');
      } else if (err.message?.includes('402') || err.code === 'INSUFFICIENT_CREDITS' || err.code === 'PAYMENT_REQUIRED') {
        setError('Créditos insuficientes para simulação DSD. Faça upgrade do seu plano.');
        refreshSubscription();
      } else if (isConnectionError) {
        setError('Erro de conexão. Verifique sua internet e tente novamente.');
      } else {
        setError('Não foi possível gerar a análise DSD. Você pode pular esta etapa.');
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

  // Loading state — inline card with ring + compact steps
  if (isAnalyzing) {
    const compactSteps = analysisSteps.map((step, index) => ({
      label: step.label.replace('...', ''),
      completed: index < currentStep,
    }));
    const activeIndex = currentStep;
    const currentLabel = currentStep < analysisSteps.length
      ? analysisSteps[currentStep].label
      : 'Finalizando...';
    const dsdProgress = Math.min((currentStep / analysisSteps.length) * 100, 95);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold font-display mb-2 text-gradient-gold">Planejamento Digital do Sorriso</h2>
          <p className="text-muted-foreground">{currentLabel}</p>
        </div>

        {/* Inline photo with scan-line */}
        {imageBase64 && (
          <Card className="card-elevated border-primary/30 overflow-hidden">
            <CardContent className="p-0">
              <div className="relative scan-line-animation">
                <img src={imageBase64} alt="Foto sendo analisada" className="w-full max-h-[300px] object-contain" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress ring + current step label */}
        <div className="flex items-center justify-center gap-4">
          <ProgressRing progress={dsdProgress} size={80} />
          <div>
            <p className="text-sm font-medium">{currentLabel}</p>
            <p className="text-xs text-muted-foreground">~15-25 segundos</p>
          </div>
        </div>

        {/* Horizontal compact steps */}
        <div className="flex justify-center">
          <CompactStepIndicator
            steps={compactSteps}
            currentIndex={activeIndex}
            variant="horizontal"
          />
        </div>
      </div>
    );
  }

  // Error state — amber-themed with contextual hints
  if (error) {
    const isCreditError = error.includes('Créditos insuficientes');
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
            {isCreditError ? (
              <Zap className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            ) : (
              <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <h2 className="text-xl font-semibold font-display mb-2">
            {isCreditError ? 'Créditos Insuficientes' : 'Erro na Análise DSD'}
          </h2>
          <p className="text-muted-foreground">{error}</p>
        </div>

        {/* Contextual hint */}
        {!isCreditError && (
          <div className="border-l-4 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 rounded-r-lg p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Fotos frontais com boa iluminação e sorriso aberto geram melhores resultados na análise de proporções.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isCreditError ? (
            <Button onClick={() => window.location.href = '/pricing'} className="btn-glow-gold btn-press font-semibold">
              <Zap className="w-4 h-4 mr-2" />
              Ver Planos
            </Button>
          ) : (
            <Button onClick={handleRetry} className="gap-2 btn-glow-gold btn-press font-semibold">
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
              <span className="inline-flex items-center gap-0.5 text-xs opacity-60 ml-1">
                <Zap className="w-3 h-3" />2
              </span>
            </Button>
          )}
          <Button variant="outline" onClick={onSkip} className="btn-press border-primary/30 hover:border-primary/50">
            Pular DSD
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Result state
  if (result) {
    const { analysis } = result;
    
    // Check for attention observations
    const attentionObservations = analysis.observations?.filter(obs => 
      obs.toUpperCase().includes('ATENÇÃO') || obs.toUpperCase().includes('ATENCAO')
    ) || [];
    
    // Only consider clinical limitation notes, not informational background processing messages
    const hasClinicalLimitationNote = result.simulation_note && 
      !result.simulation_note.includes('segundo plano') &&
      !result.simulation_note.includes('background');
    
    const hasLimitations = analysis.confidence === 'baixa' || attentionObservations.length > 0 || hasClinicalLimitationNote;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Smile className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold font-display mb-2 text-gradient-gold">Planejamento Digital do Sorriso</h2>
          <div className="flex items-center justify-center gap-2">
            <Badge
              variant={analysis.confidence === 'alta' ? 'default' : analysis.confidence === 'média' ? 'secondary' : 'outline'}
              className={
                analysis.confidence === 'alta'
                  ? 'bg-primary text-primary-foreground'
                  : analysis.confidence === 'baixa'
                    ? 'border-amber-500 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30'
                    : ''
              }
            >
              Confiança {analysis.confidence}
            </Badge>
          </div>
        </div>

        {/* Alert for low confidence or limitations */}
        {hasLimitations && (
          <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/30">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">Caso com Limitações para Simulação</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              {result.simulation_note || 
                'Este caso apresenta características que limitam a precisão da simulação visual. A análise de proporções está disponível, mas o resultado final pode variar significativamente.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Attention observations from AI */}
        {attentionObservations.length > 0 && (
          <Card className="border-amber-400 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <AlertCircle className="w-4 h-4" />
                Pontos de Atenção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {attentionObservations.map((obs, index) => (
                  <li key={index} className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                    {obs.replace(/^ATENÇÃO:\s*/i, '')}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Overbite suspicion alert */}
        {analysis.overbite_suspicion === 'sim' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Suspeita de Sobremordida Profunda</AlertTitle>
            <AlertDescription>
              A análise sugere possível sobremordida profunda (overbite). Recomenda-se avaliação ortodôntica antes de procedimentos restauradores anteriores. Gengivoplastia contraindicada até avaliação.
            </AlertDescription>
          </Alert>
        )}

        {/* Background simulation generating card */}
        {isSimulationGenerating && !simulationImageUrl && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Gerando camadas de simulação...</h4>
                  <p className="text-sm text-muted-foreground">
                    {layerGenerationProgress > 0
                      ? `${layerGenerationProgress} de ${determineLayersNeeded(analysis).length} camadas processadas`
                      : 'Você pode continuar revisando a análise enquanto processamos'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Background simulation error card */}
        {simulationError && !simulationImageUrl && !isSimulationGenerating && (
          <Card className="border-amber-400 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm text-amber-700 dark:text-amber-300">
                    Simulação não pôde ser gerada automaticamente
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateAllLayers()}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Tentar novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comparison Slider with Layer Tabs — when simulation is ready */}
        {imageBase64 && (simulationImageUrl || layers.length > 0) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm text-muted-foreground">Comparação Antes/Depois</h3>
              <div className="flex items-center gap-2">
                {/* Annotation toggle (E5) */}
                {toothBounds.length > 0 && analysis.suggestions?.length > 0 && (
                  <Button
                    variant={showAnnotations ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowAnnotations(prev => !prev)}
                    className="text-xs"
                  >
                    {showAnnotations ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                    Marcações
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateSimulation}
                  disabled={isRegeneratingSimulation || isCompositing || layersGenerating}
                >
                  {isRegeneratingSimulation || isCompositing || layersGenerating ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      {isCompositing ? 'Ajustando...' : 'Gerando...'}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Nova Simulação
                      <span className="text-xs opacity-60 ml-0.5">(grátis)</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Layer tabs */}
            {(layers.length > 0 || failedLayers.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {layers.map((layer, idx) => (
                  <button
                    key={layer.type}
                    onClick={() => {
                      setActiveLayerIndex(idx);
                      const url = layerUrls[layer.type];
                      if (url) setSimulationImageUrl(url);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      activeLayerIndex === idx
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary/50 text-muted-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {layer.label}
                    {layer.includes_gengivoplasty && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                        Gengiva
                      </Badge>
                    )}
                  </button>
                ))}
                {failedLayers.map((layerType) => (
                  <button
                    key={layerType}
                    onClick={() => retryFailedLayer(layerType)}
                    disabled={retryingLayer === layerType}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
                  >
                    {retryingLayer === layerType ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    {LAYER_LABELS[layerType]}
                  </button>
                ))}
              </div>
            )}

            <div ref={annotationContainerRef} className="relative">
              <ComparisonSlider
                beforeImage={imageBase64}
                afterImage={simulationImageUrl || ''}
                afterLabel={layers.length > 0 ? layers[activeLayerIndex]?.label || 'Simulação DSD' : 'Simulação DSD'}
                annotationOverlay={showAnnotations ? (
                  <AnnotationOverlay
                    suggestions={analysis.suggestions || []}
                    toothBounds={toothBounds}
                    visible={showAnnotations}
                    containerWidth={annotationDimensions.width}
                    containerHeight={annotationDimensions.height}
                  />
                ) : undefined}
              />
            </div>

            {/* E4: Whitening comparison button */}
            {!showWhiteningComparison && (
              <Button
                variant="outline"
                size="sm"
                onClick={generateWhiteningComparison}
                disabled={isComparingWhitening}
                className="w-full"
              >
                {isComparingWhitening ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Gerando comparação...
                  </>
                ) : (
                  <>
                    <Palette className="w-3 h-3 mr-1" />
                    Comparar Níveis de Clareamento
                    <span className="text-xs opacity-60 ml-1">(grátis)</span>
                  </>
                )}
              </Button>
            )}

            {/* E4: Whitening comparison grid */}
            {showWhiteningComparison && Object.keys(whiteningComparison).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Comparação de Clareamento</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowWhiteningComparison(false)}
                    className="text-xs"
                  >
                    Fechar
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['natural', 'white', 'hollywood'] as const).map(level => {
                    const url = whiteningComparison[level];
                    if (!url) return (
                      <div key={level} className="aspect-[4/3] rounded-lg bg-secondary/50 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    );
                    const labels: Record<string, string> = {
                      natural: 'Natural (A1/A2)',
                      white: 'Branco (BL2/BL3)',
                      hollywood: 'Hollywood (BL1)',
                    };
                    const isActive = patientPreferences?.whiteningLevel === level;
                    return (
                      <div
                        key={level}
                        className={`rounded-lg overflow-hidden border-2 cursor-pointer transition-colors ${isActive ? 'border-primary' : 'border-transparent hover:border-primary/40'}`}
                        onClick={() => {
                          if (isActive) return;
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
                        }}
                      >
                        <ComparisonSlider
                          beforeImage={imageBase64}
                          afterImage={url}
                          afterLabel={labels[level]}
                        />
                        {isActive ? (
                          <div className="text-center py-1 bg-primary/10">
                            <span className="text-xs font-medium text-primary">Selecionado</span>
                          </div>
                        ) : (
                          <div className="text-center py-1 bg-secondary/30">
                            <span className="text-xs font-medium text-muted-foreground">Clique para selecionar</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* If no simulation and not generating, show info */}
        {imageBase64 && !simulationImageUrl && !isSimulationGenerating && !simulationError && layers.length === 0 && (
          <div className="space-y-3">
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                A simulação visual está sendo preparada. A análise de proporções está disponível abaixo.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Proportions Analysis */}
        <ProportionsCard analysis={analysis} />

        {/* Suggestions - grouped by tooth number */}
        {analysis.suggestions && analysis.suggestions.length > 0 && (() => {
          // Keywords that indicate a gengiva-related suggestion
          const gengivaKeywords = ['gengiva', 'gengival', 'zênite', 'zenite', 'gengivoplastia', 'papila', 'contorno gengival'];
          const isGingiSuggestion = (s: DSDSuggestion) => {
            const text = `${s.current_issue} ${s.proposed_change} ${s.tooth}`.toLowerCase();
            return gengivaKeywords.some(kw => text.includes(kw));
          };

          // Group suggestions by tooth number (strip "(Gengiva)" suffix for grouping)
          const toothKey = (s: DSDSuggestion) => s.tooth.replace(/\s*\(.*\)\s*$/, '').trim();
          const grouped = new Map<string, { tooth: DSDSuggestion[]; gengiva: DSDSuggestion[] }>();
          for (const s of analysis.suggestions) {
            const key = toothKey(s);
            if (!grouped.has(key)) grouped.set(key, { tooth: [], gengiva: [] });
            const group = grouped.get(key)!;
            if (isGingiSuggestion(s)) {
              group.gengiva.push(s);
            } else {
              group.tooth.push(s);
            }
          }

          return (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Sugestões de Tratamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from(grouped.entries()).map(([tooth, group]) => (
                    <div
                      key={tooth}
                      className="p-3 rounded-lg bg-secondary/50 border border-border"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Dente {tooth}
                        </Badge>
                      </div>

                      {/* Tooth suggestions */}
                      {group.tooth.map((s, i) => (
                        <div key={`t-${i}`} className={group.gengiva.length > 0 ? 'mb-2' : ''}>
                          {group.gengiva.length > 0 && (
                            <p className="text-xs font-medium text-muted-foreground mb-0.5">Dente:</p>
                          )}
                          <p className="text-sm text-muted-foreground mb-1">
                            <span className="font-medium text-foreground">Atual:</span> {s.current_issue}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium text-primary">Proposta:</span> {s.proposed_change}
                          </p>
                        </div>
                      ))}

                      {/* Gengiva suggestions */}
                      {group.gengiva.length > 0 && (
                        <>
                          {group.tooth.length > 0 && <div className="border-t border-border my-2" />}
                          {group.gengiva.map((s, i) => (
                            <div key={`g-${i}`}>
                              <p className="text-xs font-medium text-muted-foreground mb-0.5">Gengiva:</p>
                              <p className="text-sm text-muted-foreground mb-1">
                                <span className="font-medium text-foreground">Atual:</span> {s.current_issue}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium text-primary">Proposta:</span> {s.proposed_change}
                              </p>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Observations - filter out attention ones already shown above */}
        {analysis.observations && analysis.observations.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Observações Gerais</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.observations
                  .filter(obs => !obs.toUpperCase().includes('ATENÇÃO') && !obs.toUpperCase().includes('ATENCAO'))
                  .map((obs, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      {obs}
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button variant="outline" onClick={handleRetry} className="sm:flex-1 btn-press">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refazer Análise
            <span className="inline-flex items-center gap-0.5 text-xs opacity-60 ml-1">
              <Zap className="w-3 h-3" />2
            </span>
          </Button>
          <Button onClick={handleContinue} className="sm:flex-1 btn-glow-gold btn-press font-semibold group">
            Continuar para Revisão
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    );
  }

  // Initial state — DSD explanation card
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <Smile className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold font-display mb-2 text-gradient-gold">Simulação de Sorriso (DSD)</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          O Digital Smile Design analisa as proporções faciais e dentárias do paciente, gerando uma simulação visual do resultado final antes de iniciar o tratamento.
        </p>
      </div>

      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="py-5">
          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="secondary" className="gap-1.5">
              <Zap className="w-3 h-3" />
              2 créditos
            </Badge>
            <Badge variant="secondary" className="gap-1.5">
              <Loader2 className="w-3 h-3" />
              ~30 segundos
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Button variant="outline" onClick={onSkip} className="btn-press">
          Pular DSD
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
