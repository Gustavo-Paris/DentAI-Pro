import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Smile, Loader2, RefreshCw, ChevronRight, Lightbulb, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ComparisonSlider } from '@/components/dsd/ComparisonSlider';
import { ProportionsCard } from '@/components/dsd/ProportionsCard';
import { LoadingOverlay } from '@/components/LoadingOverlay';

// Tooth shape is now fixed as 'natural' - removed manual selection per market research
const TOOTH_SHAPE = 'natural' as const;

export interface DSDAnalysis {
  facial_midline: "centrada" | "desviada_esquerda" | "desviada_direita";
  dental_midline: "alinhada" | "desviada_esquerda" | "desviada_direita";
  smile_line: "alta" | "média" | "baixa";
  buccal_corridor: "adequado" | "excessivo" | "ausente";
  occlusal_plane: "nivelado" | "inclinado_esquerda" | "inclinado_direita";
  golden_ratio_compliance: number;
  symmetry_score: number;
  suggestions: {
    tooth: string;
    current_issue: string;
    proposed_change: string;
  }[];
  observations: string[];
  confidence: "alta" | "média" | "baixa";
  simulation_limitation?: string;
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
  aestheticGoals: string;
  desiredChanges: string[];
}

interface DSDStepProps {
  imageBase64: string | null;
  onComplete: (result: DSDResult | null) => void;
  onSkip: () => void;
  additionalPhotos?: AdditionalPhotos;
  patientPreferences?: PatientPreferences;
}

const analysisSteps = [
  { label: 'Detectando landmarks faciais...', duration: 2000 },
  { label: 'Analisando proporções dentárias...', duration: 3000 },
  { label: 'Calculando proporção dourada...', duration: 2000 },
  { label: 'Avaliando simetria...', duration: 2000 },
];

export function DSDStep({ imageBase64, onComplete, onSkip, additionalPhotos, patientPreferences }: DSDStepProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<DSDResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [simulationImageUrl, setSimulationImageUrl] = useState<string | null>(null);
  const [isRegeneratingSimulation, setIsRegeneratingSimulation] = useState(false);
  
  // NEW: Background simulation states
  const [isSimulationGenerating, setIsSimulationGenerating] = useState(false);
  const [simulationError, setSimulationError] = useState(false);
  
  const { invokeFunction } = useAuthenticatedFetch();
  
  // Ref to prevent multiple simultaneous analysis calls
  const analysisStartedRef = useRef(false);

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
      console.error('Background simulation error:', err);
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
      
      // Add patient preferences if available (for personalized suggestions)
      if (patientPreferences?.aestheticGoals || patientPreferences?.desiredChanges?.length) {
        requestBody.patientPreferences = {
          aestheticGoals: patientPreferences.aestheticGoals || undefined,
          desiredChanges: patientPreferences.desiredChanges || undefined,
        };
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
        toast.success('Análise de proporções concluída!');
        
        // PHASE 2: Generate simulation in background
        // Note: We pass analysis directly since state update is async
        generateSimulationBackground(data.analysis);
      } else {
        throw new Error('Dados de análise não retornados');
      }
    } catch (error: unknown) {
      clearInterval(stepInterval);
      console.error('DSD error:', error);
      
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
        console.log(`DSD retry ${retryCount + 1}/${MAX_RETRIES}...`);
        didRetry = true;
        toast.info(`Reconectando... (tentativa ${retryCount + 1})`);
        await new Promise(r => setTimeout(r, 2000)); // Wait 2s before retry
        return analyzeDSD(retryCount + 1);
      }
      
      hasError = true;
      if (err.message?.includes('429') || err.code === 'RATE_LIMITED') {
        setError('Limite de requisições excedido. Aguarde alguns minutos.');
      } else if (err.message?.includes('402') || err.code === 'PAYMENT_REQUIRED') {
        setError('Créditos insuficientes. Adicione créditos à sua conta.');
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
    analysisStartedRef.current = false; // Allow retry
    analyzeDSD();
  };

  const handleRegenerateSimulation = async () => {
    if (!imageBase64 || !result?.analysis) return;

    setIsRegeneratingSimulation(true);
    setSimulationError(false);

    try {
      const { data, error: fnError } = await invokeFunction<DSDResult>('generate-dsd', {
        body: {
          imageBase64,
          regenerateSimulationOnly: true,
          existingAnalysis: result.analysis,
          toothShape: TOOTH_SHAPE,
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
      console.error('Regenerate simulation error:', error);
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
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Erro na Análise DSD</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={handleRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
          <Button onClick={onSkip}>
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
                    ? 'border-amber-500 text-amber-700 bg-amber-50' 
                    : ''
              }
            >
              Confiança {analysis.confidence}
            </Badge>
          </div>
        </div>

        {/* Alert for low confidence or limitations */}
        {hasLimitations && (
          <Alert variant="default" className="border-amber-500 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Caso com Limitações para Simulação</AlertTitle>
            <AlertDescription className="text-amber-700">
              {result.simulation_note || 
                'Este caso apresenta características que limitam a precisão da simulação visual. A análise de proporções está disponível, mas o resultado final pode variar significativamente.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Attention observations from AI */}
        {attentionObservations.length > 0 && (
          <Card className="border-amber-400 bg-amber-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                <AlertCircle className="w-4 h-4" />
                Pontos de Atenção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {attentionObservations.map((obs, index) => (
                  <li key={index} className="text-sm text-amber-700 flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
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
          <Card className="border-amber-400 bg-amber-50/50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span className="text-sm text-amber-700">
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
                disabled={isRegeneratingSimulation}
              >
                {isRegeneratingSimulation ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Nova Simulação
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

        {/* Suggestions */}
        {analysis.suggestions && analysis.suggestions.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Sugestões de Tratamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        Dente {suggestion.tooth}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      <span className="font-medium text-foreground">Atual:</span> {suggestion.current_issue}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-primary">Proposta:</span> {suggestion.proposed_change}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
