import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Brain, Sparkles, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface AnalyzingStepProps {
  imageBase64: string | null;
}

const analysisSteps = [
  { id: 1, label: 'Processando imagem...', duration: 1500 },
  { id: 2, label: 'Detectando estruturas dentárias...', duration: 2000 },
  { id: 3, label: 'Identificando cavidade e classe...', duration: 2500 },
  { id: 4, label: 'Analisando cor VITA...', duration: 2000 },
  { id: 5, label: 'Avaliando substrato...', duration: 1500 },
  { id: 6, label: 'Gerando diagnóstico...', duration: 1000 },
];

export function AnalyzingStep({ imageBase64 }: AnalyzingStepProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let totalElapsed = 0;
    const totalDuration = analysisSteps.reduce((sum, s) => sum + s.duration, 0);

    const intervals: NodeJS.Timeout[] = [];

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

    intervals.push(progressInterval as unknown as NodeJS.Timeout);

    return () => {
      intervals.forEach(clearTimeout);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Analisando Foto</h2>
        <p className="text-muted-foreground">
          A IA está detectando os parâmetros clínicos automaticamente
        </p>
      </div>

      <div className="flex justify-center">
        <div className="relative">
          {imageBase64 && (
            <img
              src={imageBase64}
              alt="Foto sendo analisada"
              className="w-64 h-64 object-cover rounded-lg opacity-50"
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
              <Brain className="w-10 h-10 text-primary animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso da análise</span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />

            <div className="space-y-3 mt-6">
              {analysisSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 transition-opacity ${
                    currentStep >= step.id ? 'opacity-100' : 'opacity-30'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    currentStep > index + 1
                      ? 'bg-primary text-primary-foreground'
                      : currentStep === index + 1
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {currentStep > index + 1 ? (
                      <Check className="w-4 h-4" />
                    ) : currentStep === index + 1 ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span className="text-xs">{step.id}</span>
                    )}
                  </div>
                  <span className={`text-sm ${
                    currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Powered by Gemini 2.5 Pro Vision</span>
        </div>
      </div>
    </div>
  );
}
