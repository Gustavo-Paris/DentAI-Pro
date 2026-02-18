import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  Heart,
  Brain,
  Smile,
  ClipboardCheck,
  FileText,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import type { LucideIcon } from 'lucide-react';

const DEFAULT_ICONS: LucideIcon[] = [Camera, Heart, Brain, Smile, ClipboardCheck, FileText];
const DEFAULT_LABEL_KEYS = [
  'components.stepIndicator.photo',
  'components.stepIndicator.preferences',
  'components.stepIndicator.analysis',
  'components.stepIndicator.dsd',
  'components.stepIndicator.review',
  'components.stepIndicator.result',
];

interface StepIndicatorProps {
  currentStep: number; // 0-indexed
  totalSteps: number;
  onStepClick?: (index: number) => void;
  stepLabels?: string[];
  stepIcons?: LucideIcon[];
}

export function StepIndicator({
  currentStep,
  totalSteps,
  onStepClick,
  stepLabels,
  stepIcons,
}: StepIndicatorProps) {
  const { t } = useTranslation();
  const icons = stepIcons || DEFAULT_ICONS;
  const defaultLabels = useMemo(() => DEFAULT_LABEL_KEYS.map(k => t(k)), [t]);
  const labels = stepLabels || defaultLabels;

  const steps = useMemo(
    () =>
      Array.from({ length: totalSteps }, (_, i) => ({
        icon: icons[i] || FileText,
        label: labels[i] || `Step ${i + 1}`,
        isCompleted: i < currentStep,
        isActive: i === currentStep,
        isFuture: i > currentStep,
      })),
    [currentStep, totalSteps, icons, labels],
  );

  return (
    <nav aria-label="Wizard progress" className="mb-8">
      {/* Desktop Stepper */}
      <ol className="hidden sm:flex items-center justify-between" role="list">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isClickable = step.isCompleted && !!onStepClick;

          return (
            <li key={index} className="flex-1 flex items-center">
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(index)}
                disabled={!isClickable}
                aria-current={step.isActive ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2 group transition-all duration-200',
                  isClickable && 'cursor-pointer',
                  !isClickable && !step.isActive && 'cursor-default',
                )}
              >
                <span
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                    step.isCompleted &&
                      'bg-primary text-primary-foreground shadow-sm',
                    step.isActive &&
                      'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background btn-glow-gold shadow-md',
                    step.isFuture && 'bg-muted text-muted-foreground',
                    isClickable && 'group-hover:shadow-md',
                  )}
                >
                  {step.isCompleted ? (
                    <Check className="w-4.5 h-4.5 animate-scale-in" />
                  ) : (
                    <Icon className="w-4.5 h-4.5" />
                  )}
                  <span className="sr-only">
                    {step.isCompleted
                      ? t('components.wizard.stepIndicator.completed')
                      : step.isActive
                        ? t('components.wizard.stepIndicator.current')
                        : t('components.wizard.stepIndicator.upcoming')}
                    {t('components.wizard.stepIndicator.stepLabel', { index: index + 1, label: step.label })}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'text-sm font-medium transition-colors',
                    step.isActive
                      ? 'text-foreground'
                      : step.isCompleted
                        ? 'text-foreground/70'
                        : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </button>

              {/* Connector */}
              {index < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className={cn(
                    'flex-1 mx-3 stepper-connector-gold',
                    step.isCompleted && 'completed',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile Stepper — shows current step icon + title + progress dots */}
      <div className="sm:hidden flex flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          {(() => {
            const CurrentIcon = steps[currentStep]?.icon || FileText;
            return (
              <span className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center btn-glow-gold shadow-md">
                <CurrentIcon className="w-6 h-6" />
              </span>
            );
          })()}
          <div>
            <p className="text-sm font-semibold">
              {steps[currentStep]?.label}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('components.wizard.stepIndicator.stepOf', { current: currentStep + 1, total: totalSteps })}
            </p>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {steps.map((step, index) => (
            <button
              key={index}
              type="button"
              onClick={() => step.isCompleted && onStepClick?.(index)}
              disabled={!step.isCompleted}
              className={cn(
                'rounded-full transition-all duration-300',
                step.isActive && 'w-6 h-2 bg-primary',
                step.isCompleted && 'w-2 h-2 bg-primary/60',
                step.isFuture && 'w-2 h-2 bg-muted-foreground/30',
              )}
              aria-label={t('components.wizard.stepIndicator.goToStep', { index: index + 1, label: step.label })}
              aria-current={step.isActive ? 'step' : undefined}
              aria-disabled={step.isFuture ? true : undefined}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
