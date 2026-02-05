import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Smile, Loader2, RefreshCw, ChevronRight, Lightbulb, AlertCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import { ComparisonSlider } from '@/components/dsd/ComparisonSlider';
import { ProportionsCard } from '@/components/dsd/ProportionsCard';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { logger } from '@/lib/logger';

// Tooth shape is now fixed as 'natural' - removed manual selection per market research
const TOOTH_SHAPE = 'natural' as const;

export type TreatmentIndication = "resina" | "porcelana" | "coroa" | "implante" | "endodontia" | "encaminhamento";

export interface DSDSuggestion {
  tooth: string;
  current_issue: string;
  proposed_change: string;
  treatment_indication?: TreatmentIndication;
}

export interface DSDAnalysis {
  facial_midline: "centrada" | "desviada_esquerda" | "desviada_direita";
  dental_midline: "alinhada" | "desviada_esquerda" | "desviada_direita";
  smile_line: "alta" | "média" | "baixa";
  buccal_corridor: "adequado" | "excessivo" | "ausente";
  occlusal_plane: "nivelado" | "inclinado_esquerda" | "inclinado_direita";
  golden_ratio_compliance: number;
  symmetry_score: number;
  suggestions: DSDSuggestion[];
  observations: string[];
  confidence: "alta" | "média" | "baixa";
  simulation_limitation?: string;
  // Visagism fields
  face_shape?: "oval" | "quadrado" | "triangular" | "retangular" | "redondo";
  perceived_temperament?: "colérico" | "sanguíneo" | "melancólico" | "fleumático" | "misto";
  smile_arc?: "consonante" | "plano" | "reverso";
  recommended_tooth_shape?: "quadrado" | "oval" | "triangular" | "retangular" | "natural";
  visagism_notes?: string;
}

export interface DSDResult {
  analysis: DSDAnalysis;
  simulation_url: string | null;
  simulation_note?: string;
}

interface AdditionalPhotos {
  smile45: string | null;
  face: string | null;
}

interface PatientPreferences {
  whiteningLevel: 'natural' | 'white' | 'hollywood';
}

type ToothBoundsPct = {
  /** center X in % */
  x: number;
  /** center Y in % */
  y: number;
  /** width in % */
  width: number;
  /** height in % */
  height: number;
};

type DetectedToothForMask = {
  tooth_bounds?: ToothBoundsPct;
};

/** Summary of clinical findings per tooth, passed to DSD for cross-referencing */
interface ClinicalToothFinding {
  tooth: string;
  indication_reason?: string;
  treatment_indication?: string;
}

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
}

const analysisSteps = [
  { label: 'Detectando landmarks faciais...', duration: 2000 },
  { label: 'Analisando proporções dentárias...', duration: 3000 },
  { label: 'Calculando proporção dourada...', duration: 2000 },
  { label: 'Avaliando simetria...', duration: 2000 },
];

export function DSDStep({ imageBase64, onComplete, onSkip, additionalPhotos, patientPreferences, detectedTeeth, initialResult, clinicalObservations, clinicalTeethFindings, onResultChange }: DSDStepProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  // Initialize with draft result if available
  const [result, setResult] = useState<DSDResult | null>(initialResult || null);
  const [error, setError] = useState<string | null>(null);
  const [simulationImageUrl, setSimulationImageUrl] = useState<string | null>(null);
  const [isRegeneratingSimulation, setIsRegeneratingSimulation] = useState(false);
  const [isCompositing, setIsCompositing] = useState(false);
  
  // NEW: Background simulation states
  const [isSimulationGenerating, setIsSimulationGenerating] = useState(false);
  const [simulationError, setSimulationError] = useState(false);
  
  const { invokeFunction } = useAuthenticatedFetch();
  const { user } = useAuth();
  const { canUseCredits, refreshSubscription, creditsRemaining, getCreditCost } = useSubscription();

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

  const createCompositeTeethOnly = async (params: {
    beforeDataUrl: string;
    afterUrl: string;
    bounds: ToothBoundsPct[];
  }): Promise<Blob> => {
    const { beforeDataUrl, afterUrl, bounds } = params;

    const [beforeRes, afterRes] = await Promise.all([
      fetch(beforeDataUrl),
      fetch(afterUrl),
    ]);

    if (!beforeRes.ok || !afterRes.ok) {
      throw new Error('Falha ao baixar imagens para composição');
    }

    const [beforeBlob, afterBlob] = await Promise.all([
      beforeRes.blob(),
      afterRes.blob(),
    ]);

    const [beforeBitmap, afterBitmap] = await Promise.all([
      createImageBitmap(beforeBlob),
      createImageBitmap(afterBlob),
    ]);

    const w = beforeBitmap.width;
    const h = beforeBitmap.height;

    // Base canvas (original)
    const base = document.createElement('canvas');
    base.width = w;
    base.height = h;
    const baseCtx = base.getContext('2d');
    if (!baseCtx) throw new Error('Canvas não suportado');
    baseCtx.drawImage(beforeBitmap, 0, 0);

    // Overlay canvas (AI output)
    const overlay = document.createElement('canvas');
    overlay.width = w;
    overlay.height = h;
    const overlayCtx = overlay.getContext('2d');
    if (!overlayCtx) throw new Error('Canvas não suportado');
    overlayCtx.drawImage(afterBitmap, 0, 0);

    // Mask canvas
    const mask = document.createElement('canvas');
    mask.width = w;
    mask.height = h;
    const maskCtx = mask.getContext('2d');
    if (!maskCtx) throw new Error('Canvas não suportado');

    // Draw ellipses over teeth bounds (slightly shrunk to avoid gums/lips)
    const scaleX = 0.9;
    const scaleY = 0.7;

    maskCtx.fillStyle = 'rgba(255,255,255,1)';
    for (const b of bounds) {
      const cx = (b.x / 100) * w;
      const cy = (b.y / 100) * h;
      const bw = (b.width / 100) * w;
      const bh = (b.height / 100) * h;
      const rx = (bw * scaleX) / 2;
      const ry = (bh * scaleY) / 2;

      maskCtx.beginPath();
      maskCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      maskCtx.fill();
    }

    // Soft edges (second blurred pass)
    maskCtx.save();
    maskCtx.filter = 'blur(10px)';
    maskCtx.globalAlpha = 0.55;
    for (const b of bounds) {
      const cx = (b.x / 100) * w;
      const cy = (b.y / 100) * h;
      const bw = (b.width / 100) * w;
      const bh = (b.height / 100) * h;
      const rx = (bw * (scaleX * 1.15)) / 2;
      const ry = (bh * (scaleY * 1.15)) / 2;
      maskCtx.beginPath();
      maskCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      maskCtx.fill();
    }
    maskCtx.restore();

    // Apply mask to overlay (keep only teeth region)
    overlayCtx.globalCompositeOperation = 'destination-in';
    overlayCtx.drawImage(mask, 0, 0);
    overlayCtx.globalCompositeOperation = 'source-over';

    // Merge overlay on top of base
    baseCtx.drawImage(overlay, 0, 0);

    return await new Promise<Blob>((resolve, reject) => {
      base.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar imagem final'))),
        'image/jpeg',
        0.92
      );
    });
  };

  // Deterministic post-processing: copy original pixels everywhere except teeth bounds
  useEffect(() => {
    const run = async () => {
      if (!user) return;
      if (!imageBase64) return;
      if (!simulationImageUrl) return;
      if (!result?.simulation_url) return;
      if (!toothBounds.length) return;

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
  }, [user, imageBase64, simulationImageUrl, result?.simulation_url, toothBounds]);

  // NEW: Background simulation generation
  const generateSimulationBackground = async (analysisData?: DSDAnalysis) => {
    const analysis = analysisData || result?.analysis;
    if (!imageBase64 || !analysis) return;

    setIsSimulationGenerating(true);
    setSimulationError(false);

    try {
      const { data, error: fnError } = await invokeFunction<DSDResult>('generate-dsd', {
        body: {
          imageBase64,
          toothShape: TOOTH_SHAPE,
          regenerateSimulationOnly: true,
          existingAnalysis: analysis,
          patientPreferences, // Pass preferences for consistent background generation
        },
      });

      if (fnError || !data?.simulation_url) {
        setSimulationError(true);
        return;
      }

      // Update result with new simulation URL
      setResult((prev) => prev ? { 
        ...prev, 
        simulation_url: data.simulation_url 
      } : prev);

      // Load signed URL
      const { data: signedData } = await supabase.storage
        .from('dsd-simulations')
        .createSignedUrl(data.simulation_url, 3600);

      if (signedData?.signedUrl) {
        setSimulationImageUrl(signedData.signedUrl);
        toast.success('Simulação visual pronta!');
      }
    } catch (err) {
      logger.error('Background simulation error:', err);
      setSimulationError(true);
    } finally {
      setIsSimulationGenerating(false);
    }
  };

  const analyzeDSD = async (retryCount = 0) => {
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
        
        // PHASE 2: Generate simulation in background
        // Note: We pass analysis directly since state update is async
        generateSimulationBackground(data.analysis);
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
  };

  // Auto-start analysis when component mounts with image - use ref to prevent loops
  useEffect(() => {
    if (imageBase64 && !analysisStartedRef.current) {
      analysisStartedRef.current = true;
      analyzeDSD();
    }
  }, [imageBase64]);

  const handleRetry = () => {
    setResult(null);
    setError(null);
    setSimulationImageUrl(null);
    setSimulationError(false);
    setIsSimulationGenerating(false);
    lastCompositeSourcePathRef.current = null;
    analysisStartedRef.current = false; // Allow retry
    analyzeDSD();
  };

  const handleRegenerateSimulation = async () => {
    if (!imageBase64 || !result?.analysis) return;

    setIsRegeneratingSimulation(true);
    setSimulationError(false);

    try {
      lastCompositeSourcePathRef.current = null;
      const { data, error: fnError } = await invokeFunction<DSDResult>('generate-dsd', {
        body: {
          imageBase64,
          regenerateSimulationOnly: true,
          existingAnalysis: result.analysis,
          toothShape: TOOTH_SHAPE,
          patientPreferences, // Pass preferences for consistent regeneration
        },
      });

      if (fnError) throw fnError;

      if (data?.simulation_url) {
        // Update result with new simulation URL
        setResult((prev) => prev ? { ...prev, simulation_url: data.simulation_url } : prev);
        
        // Load signed URL
        const { data: signedData } = await supabase.storage
          .from('dsd-simulations')
          .createSignedUrl(data.simulation_url, 3600);
        
        if (signedData?.signedUrl) {
          setSimulationImageUrl(signedData.signedUrl);
        }
        
        toast.success('Nova simulação gerada!');
      } else {
        throw new Error('Simulação não gerada');
      }
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

  // Build loading steps for LoadingOverlay
  const loadingSteps = useMemo(() => {
    return analysisSteps.map((step, index) => ({
      label: step.label,
      completed: index < currentStep,
    }));
  }, [currentStep]);

  // Loading state - now uses LoadingOverlay
  if (isAnalyzing) {
    return (
      <>
        <LoadingOverlay
          isLoading={true}
          message="Analisando proporções do sorriso"
          steps={loadingSteps}
        />
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <p className="text-xs text-muted-foreground">Powered by Gemini Vision</p>
        </div>
      </>
    );
  }

  // Error state
  if (error) {
    const isCreditError = error.includes('Créditos insuficientes');
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            isCreditError ? 'bg-amber-100 dark:bg-amber-950/30' : 'bg-destructive/10 dark:bg-destructive/20'
          }`}>
            {isCreditError ? (
              <Zap className="w-8 h-8 text-amber-600" />
            ) : (
              <AlertCircle className="w-8 h-8 text-destructive" />
            )}
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {isCreditError ? 'Créditos Insuficientes' : 'Erro na Análise DSD'}
          </h2>
          <p className="text-muted-foreground">{error}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isCreditError ? (
            <Button onClick={() => window.location.href = '/pricing'}>
              <Zap className="w-4 h-4 mr-2" />
              Ver Planos
            </Button>
          ) : (
            <Button variant="outline" onClick={handleRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar novamente
              <span className="inline-flex items-center gap-0.5 text-xs opacity-60 ml-1">
                <Zap className="w-3 h-3" />2
              </span>
            </Button>
          )}
          <Button variant={isCreditError ? 'outline' : 'default'} onClick={onSkip}>
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
          <h2 className="text-xl font-semibold mb-2">Planejamento Digital do Sorriso</h2>
          <div className="flex items-center justify-center gap-2">
            <Badge 
              variant={analysis.confidence === 'alta' ? 'default' : analysis.confidence === 'média' ? 'secondary' : 'outline'}
              className={
                analysis.confidence === 'alta'
                  ? 'bg-emerald-500'
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

        {/* NEW: Background simulation generating card */}
        {isSimulationGenerating && !simulationImageUrl && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Gerando simulação visual...</h4>
                  <p className="text-sm text-muted-foreground">
                    Você pode continuar revisando a análise enquanto processamos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* NEW: Background simulation error card */}
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
                  onClick={() => generateSimulationBackground()}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Tentar novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comparison Slider - when simulation is ready */}
        {imageBase64 && simulationImageUrl && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm text-muted-foreground">Comparação Antes/Depois</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateSimulation}
                disabled={isRegeneratingSimulation || isCompositing}
              >
                {isRegeneratingSimulation || isCompositing ? (
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
            <ComparisonSlider
              beforeImage={imageBase64}
              afterImage={simulationImageUrl}
            />
          </div>
        )}

        {/* If no simulation and not generating, show button to generate */}
        {imageBase64 && !simulationImageUrl && !isSimulationGenerating && !simulationError && (
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
          <Button variant="outline" onClick={handleRetry} className="sm:flex-1">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refazer Análise
            <span className="inline-flex items-center gap-0.5 text-xs opacity-60 ml-1">
              <Zap className="w-3 h-3" />2
            </span>
          </Button>
          <Button onClick={handleContinue} className="sm:flex-1">
            Continuar para Revisão
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Initial state (shouldn't normally show)
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
