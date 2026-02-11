import { Card, CardContent } from '@/components/ui/card';
import { ProgressRing } from '@/components/ProgressRing';
import { CompactStepIndicator } from '@/components/CompactStepIndicator';

interface DSDLoadingStateProps {
  imageBase64: string | null;
  currentStep: number;
  analysisSteps: { label: string; duration: number }[];
}

export function DSDLoadingState({ imageBase64, currentStep, analysisSteps }: DSDLoadingStateProps) {
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
        <h2 className="text-xl font-semibold font-display mb-2 text-primary">Planejamento Digital do Sorriso</h2>
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
