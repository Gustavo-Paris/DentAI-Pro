import { useTranslation } from 'react-i18next';
import { Smile } from 'lucide-react';
import { Card, CardContent } from '@parisgroup-ai/pageshell/primitives';
import { ProgressRing } from '@/components/ProgressRing';
import { CompactStepIndicator } from '@/components/CompactStepIndicator';

interface DSDLoadingStateProps {
  imageBase64: string | null;
  currentStep: number;
  analysisSteps: { label: string; duration: number }[];
}

export function DSDLoadingState({ imageBase64, currentStep, analysisSteps }: DSDLoadingStateProps) {
  const { t } = useTranslation();
  const compactSteps = analysisSteps.map((step, index) => ({
    label: step.label.replace('...', ''),
    completed: index < currentStep,
  }));
  const activeIndex = currentStep;
  const currentLabel = currentStep < analysisSteps.length
    ? analysisSteps[currentStep].label
    : t('components.wizard.dsd.loadingState.finishing');
  const dsdProgress = Math.min((currentStep / analysisSteps.length) * 100, 95);

  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-label={t('components.wizard.dsd.loadingState.title')}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center glow-icon">
            <Smile className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold font-display mb-2 text-primary neon-text">{t('components.wizard.dsd.loadingState.title')}</h2>
          <p className="text-sm text-muted-foreground">{currentLabel}</p>
        </div>

        {/* Inline photo with scan-line */}
        {imageBase64 && (
          <Card className="card-elevated glow-card border-primary/30 overflow-hidden">
            <CardContent className="p-0">
              <div className="relative scan-line-animation">
                <img src={imageBase64} alt={t('components.wizard.dsd.loadingState.photoAnalyzing')} className="w-full max-h-[300px] object-contain" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress ring + current step label */}
        <div className="flex items-center justify-center gap-4">
          <ProgressRing progress={dsdProgress} size={80} />
          <div>
            <p className="text-sm font-medium">{currentLabel}</p>
            <p className="text-xs text-muted-foreground">{t('components.wizard.dsd.loadingState.estimatedTime')}</p>
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
