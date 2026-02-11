import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { ProgressRing } from './ProgressRing';
import { CompactStepIndicator } from './CompactStepIndicator';

interface ProcessingOverlayProps {
  isLoading: boolean;
  steps?: { label: string; completed: boolean }[];
  message?: string;
  progress?: number;       // 0-100
  estimatedTime?: string;  // e.g. "~15s"
}

export function ProcessingOverlay({
  isLoading,
  steps,
  message,
  progress = 0,
  estimatedTime,
}: ProcessingOverlayProps) {
  const { t } = useTranslation();
  if (!isLoading) return null;

  const displayMessage = message || t('components.processingOverlay.defaultMessage');

  const currentIndex = steps
    ? steps.findIndex((s) => !s.completed)
    : -1;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 grain-overlay">
      <Card className="w-full max-w-md rounded-2xl card-elevated animate-[scale-in_0.3s_ease-out]">
        <CardContent className="p-6 flex flex-col items-center text-center">
          <ProgressRing progress={progress} size={128} />

          <p className="mt-4 font-semibold text-primary">{displayMessage}</p>

          {steps && steps.length > 0 && (
            <div className="mt-4 w-full text-left">
              <CompactStepIndicator
                steps={steps}
                currentIndex={currentIndex}
                variant="vertical-compact"
              />
            </div>
          )}

          {estimatedTime && (
            <p className="text-xs text-muted-foreground mt-4">
              {t('components.processingOverlay.remaining', { time: estimatedTime })}
            </p>
          )}

          <p className="text-xs text-muted-foreground mt-2 animate-pulse">
            {t('components.processingOverlay.doNotClose')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
