import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Check, RefreshCw, ArrowRight, ArrowLeft, Lightbulb, AlertCircle } from 'lucide-react';

interface AnalyzingStepProps {
  imageBase64: string | null;
  isAnalyzing: boolean;
  analysisError: string | null;
  onRetry: () => void;
  onSkipToReview: () => void;
  onBack?: () => void;
}

const analysisSteps = [
  { id: 1, label: 'Processando imagem...', duration: 1500 },
  { id: 2, label: 'Detectando estruturas dentárias...', duration: 2000 },
  { id: 3, label: 'Identificando cavidade e classe...', duration: 2500 },
  { id: 4, label: 'Analisando cor VITA...', duration: 2000 },
  { id: 5, label: 'Avaliando substrato...', duration: 1500 },
  { id: 6, label: 'Gerando diagnóstico...', duration: 1000 },
];

export function AnalyzingStep({
  imageBase64,
  isAnalyzing,
  analysisError,
  onRetry,
  onSkipToReview,
  onBack,
}: AnalyzingStepProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  // Reset animation when analysis starts
  useEffect(() => {
    if (!isAnalyzing) {
      return;
    }

    // Reset states when analysis starts
    setCurrentStep(0);
    setProgress(0);

    let totalElapsed = 0;
    const totalDuration = analysisSteps.reduce((sum, s) => sum + s.duration, 0);

    const intervals: ReturnType<typeof setTimeout>[] = [];

    analysisSteps.forEach((step, index) => {
      const timeout = setTimeout(() => {
        setCurrentStep(index + 1);
      }, totalElapsed);
      intervals.push(timeout);
      totalElapsed += step.duration;
    });

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95; // Cap at 95% until actual completion
        return prev + 1;
      });
    }, totalDuration / 95);

    return () => {
      intervals.forEach(clearTimeout);
      clearInterval(progressInterval);
    };
  }, [isAnalyzing]);

  // Friendly error state
  if (analysisError) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-2xl font-semibold font-display mb-2">Erro na Análise</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {analysisError}
          </p>
        </div>

        {imageBase64 && (
          <div className="flex justify-center">
            <img
              src={imageBase64}
              alt="Foto enviada"
              className="w-48 h-48 object-cover rounded-xl opacity-75 ring-1 ring-border"
            />
          </div>
        )}

        {/* Contextual hint card with amber border */}
        <div className="border-l-4 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 rounded-r-lg p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Fotos com boa iluminação e foco nítido na cavidade funcionam melhor para a análise automática.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="gap-2 btn-press">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          )}
          <Button onClick={onRetry} className="gap-2 btn-glow-gold btn-press font-semibold">
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </Button>
          <Button variant="outline" onClick={onSkipToReview} className="gap-2 btn-press border-primary/30 hover:border-primary/50">
            <ArrowRight className="w-4 h-4" />
            Pular para Revisão Manual
          </Button>
        </div>
      </div>
    );
  }

  // Loading state with scan-line + timeline
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold font-display mb-2">Analisando Foto</h2>
        <p className="text-muted-foreground">
          A IA está detectando os parâmetros clínicos automaticamente
        </p>
      </div>

      {/* Photo with scan-line animation */}
      <div className="flex justify-center">
        {imageBase64 && (
          <div className="relative w-full max-w-md scan-line-animation vignette-overlay rounded-xl overflow-hidden">
            <img
              src={imageBase64}
              alt="Foto sendo analisada"
              className="w-full object-cover rounded-xl"
            />
          </div>
        )}
      </div>

      {/* Gold progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Progresso da análise</span>
          <Badge variant="outline" className="text-gradient-gold font-semibold text-xs">
            {Math.round(progress)}%
          </Badge>
        </div>
        <div className="progress-gold h-2 rounded-full">
          <div
            className="h-full rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Timeline progress steps */}
      <div className="timeline-line pl-2 space-y-4">
        {analysisSteps.map((step, index) => {
          const isCompleted = currentStep > index + 1;
          const isActive = currentStep === index + 1;
          const isPending = currentStep < index + 1;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-4 relative transition-all duration-300 ${
                isPending ? 'opacity-30' : 'opacity-100'
              }`}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Timeline node */}
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                isCompleted
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : isActive
                    ? 'bg-primary/20 text-primary ring-2 ring-primary/30'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {isCompleted ? (
                  <Check className="w-4 h-4 animate-scale-in" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="text-xs">{step.id}</span>
                )}
              </div>

              {/* Label */}
              <span className={`text-sm transition-colors ${
                isCompleted || isActive ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Powered by Gemini 3 Flash Preview</span>
        </div>
      </div>
    </div>
  );
}
