import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

interface CompactStepIndicatorProps {
  steps: { label: string; completed: boolean }[];
  currentIndex: number;
  variant?: 'horizontal' | 'vertical-compact';
}

export const CompactStepIndicator = memo(function CompactStepIndicator({
  steps,
  currentIndex,
  variant = 'vertical-compact',
}: CompactStepIndicatorProps) {
  const { t } = useTranslation();
  if (variant === 'horizontal') {
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-2" role="list" aria-label={t('components.compactStepIndicator.ariaLabel')}>
        {steps.map((step, i) => {
          const isCompleted = step.completed;
          const isActive = i === currentIndex;
          return (
            <div key={i} className="flex items-center gap-1.5" role="listitem" aria-current={isActive ? 'step' : undefined}>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  isCompleted
                    ? 'bg-primary'
                    : isActive
                      ? 'bg-primary/20 animate-[badge-pulse-ring_3s_ease-in-out_infinite]'
                      : 'bg-muted'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3 text-primary-foreground" />
                ) : (
                  <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {i + 1}
                  </span>
                )}
              </div>
              <span className={`text-xs max-w-[80px] truncate ${
                isCompleted || isActive ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // vertical-compact
  return (
    <div className="space-y-2" role="list" aria-label={t('components.compactStepIndicator.ariaLabel')}>
      {steps.map((step, i) => {
        const isCompleted = step.completed;
        const isActive = i === currentIndex;
        return (
          <div key={i} className="flex items-center gap-2" role="listitem" aria-current={isActive ? 'step' : undefined}>
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                isCompleted
                  ? 'bg-primary'
                  : isActive
                    ? 'bg-primary/20 animate-[badge-pulse-ring_3s_ease-in-out_infinite]'
                    : 'bg-muted'
              }`}
            >
              {isCompleted ? (
                <Check className="w-3 h-3 text-primary-foreground" />
              ) : (
                <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {i + 1}
                </span>
              )}
            </div>
            <span className={`text-xs ${
              isCompleted || isActive ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
});
