import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Smile, Sparkles, Loader2, RefreshCw, ChevronRight, Lightbulb, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ComparisonSlider } from '@/components/dsd/ComparisonSlider';
import { ProportionsCard } from '@/components/dsd/ProportionsCard';

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
}

export interface DSDResult {
  analysis: DSDAnalysis;
  simulation_url: string | null;
}

interface DSDStepProps {
  imageBase64: string | null;
  onComplete: (result: DSDResult | null) => void;
  onSkip: () => void;
}

const analysisSteps = [
  { label: 'Detectando landmarks faciais...', duration: 2000 },
  { label: 'Analisando proporções dentárias...', duration: 3000 },
  { label: 'Calculando proporção dourada...', duration: 2000 },
  { label: 'Avaliando simetria...', duration: 2000 },
  { label: 'Gerando simulação do sorriso...', duration: 5000 },
];

export function DSDStep({ imageBase64, onComplete, onSkip }: DSDStepProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<DSDResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [simulationImageUrl, setSimulationImageUrl] = useState<string | null>(null);

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

  const analyzeDSD = async () => {
    if (!imageBase64) {
      setError('Nenhuma imagem disponível para análise');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setCurrentStep(0);

    // Simulate progress steps
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < analysisSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2500);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-dsd', {
        body: { imageBase64 },
      });

      clearInterval(stepInterval);

      if (fnError) {
        throw fnError;
      }

      if (data?.analysis) {
        setResult(data as DSDResult);
        toast.success('Análise DSD concluída!');
      } else {
        throw new Error('Dados de análise não retornados');
      }
    } catch (err: any) {
      console.error('DSD error:', err);
      
      if (err?.message?.includes('429') || err?.code === 'RATE_LIMITED') {
        setError('Limite de requisições excedido. Aguarde alguns minutos.');
      } else if (err?.message?.includes('402') || err?.code === 'PAYMENT_REQUIRED') {
        setError('Créditos insuficientes. Adicione créditos à sua conta.');
      } else {
        setError('Não foi possível gerar a análise DSD. Você pode pular esta etapa.');
      }
    } finally {
      clearInterval(stepInterval);
      setIsAnalyzing(false);
    }
  };

  // Start analysis on mount
  useEffect(() => {
    if (imageBase64 && !result && !isAnalyzing && !error) {
      analyzeDSD();
    }
  }, [imageBase64]);

  const handleRetry = () => {
    setResult(null);
    setError(null);
    analyzeDSD();
  };

  const handleContinue = () => {
    onComplete(result);
  };

  // Loading state
  if (isAnalyzing) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Smile className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Planejamento Digital do Sorriso</h2>
          <p className="text-muted-foreground">Analisando proporções faciais e gerando simulação...</p>
        </div>

        {/* Progress visualization */}
        <Card>
          <CardContent className="py-6">
            {imageBase64 && (
              <div className="relative aspect-[4/3] mb-6 rounded-lg overflow-hidden">
                <img
                  src={imageBase64}
                  alt="Foto sendo analisada"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
              </div>
            )}

            <div className="space-y-3">
              {analysisSteps.map((step, index) => (
                <div
                  key={step.label}
                  className={`flex items-center gap-3 transition-opacity ${
                    index <= currentStep ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  {index < currentStep ? (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-primary-foreground" />
                    </div>
                  ) : index === currentStep ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-secondary" />
                  )}
                  <span className="text-sm">{step.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">Powered by Gemini Vision + Image Generation</p>
        </div>
      </div>
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
              variant={analysis.confidence === 'alta' ? 'default' : 'secondary'}
              className={analysis.confidence === 'alta' ? 'bg-emerald-500' : ''}
            >
              Confiança {analysis.confidence}
            </Badge>
          </div>
        </div>

        {/* Comparison Slider */}
        {imageBase64 && simulationImageUrl && (
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground">Comparação Antes/Depois</h3>
            <ComparisonSlider
              beforeImage={imageBase64}
              afterImage={simulationImageUrl}
            />
          </div>
        )}

        {/* If no simulation, show just the original */}
        {imageBase64 && !simulationImageUrl && (
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              A simulação visual não pôde ser gerada, mas a análise de proporções está disponível abaixo.
            </AlertDescription>
          </Alert>
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

        {/* Observations */}
        {analysis.observations && analysis.observations.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Observações Gerais</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.observations.map((obs, index) => (
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
