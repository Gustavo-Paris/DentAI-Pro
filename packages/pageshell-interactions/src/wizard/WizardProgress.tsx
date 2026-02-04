'use client';

/**
 * WizardProgress Component
 *
 * Progress indicator for multi-step wizards.
 * Supports three variants: bar, dots, steps, and stepper.
 * Now includes step status indicators and jump navigation.
 *
 * @module wizard/WizardProgress
 *
 * @example Basic
 * <WizardProgress
 *   currentStep={2}
 *   totalSteps={5}
 *   stepLabels={['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5']}
 *   variant="steps"
 * />
 *
 * @example With step statuses
 * <WizardProgress
 *   currentStep={3}
 *   totalSteps={5}
 *   stepLabels={['Info', 'Details', 'Review', 'Confirm', 'Done']}
 *   stepStatuses={['complete', 'complete', 'idle', 'idle', 'idle']}
 *   variant="steps"
 * />
 *
 * @example With jump navigation
 * <WizardProgress
 *   currentStep={3}
 *   totalSteps={5}
 *   stepLabels={['Info', 'Details', 'Review', 'Confirm', 'Done']}
 *   allowJump
 *   onJumpToStep={(step) => setCurrentStep(step)}
 * />
 */

import { cn, useHandlerMap } from '@pageshell/core';
import { Check, AlertCircle, AlertTriangle } from 'lucide-react';
import { usePageShellContext } from '@pageshell/theme';
import type { WizardProgressProps, WizardStepStatus } from './types';

// =============================================================================
// Step Status Icons
// =============================================================================

function StepStatusIcon({
  status,
  stepNum,
  isCompleted,
}: {
  status?: WizardStepStatus;
  stepNum: number;
  isCompleted: boolean;
}) {
  if (status === 'error') {
    return <AlertCircle className="w-3 h-3" />;
  }
  if (status === 'warning') {
    return <AlertTriangle className="w-3 h-3" />;
  }
  if (isCompleted || status === 'complete') {
    return <Check className="w-3 h-3" />;
  }
  return <span>{stepNum}</span>;
}


// =============================================================================
// WizardProgress Component
// =============================================================================

export function WizardProgress({
  currentStep,
  totalSteps,
  stepLabels,
  steps,
  stepStatuses,
  variant = 'steps',
  allowJump = false,
  onJumpToStep,
  showStepCount = true,
  className,
}: WizardProgressProps) {
  const { config } = usePageShellContext();
  const progressPercentage = (currentStep / totalSteps) * 100;

  // Generate step labels if not provided
  const labels =
    stepLabels ||
    steps?.map((s) => s.label) ||
    Array.from({ length: totalSteps }, (_, i) => `Passo ${i + 1}`);

  // Check if a step is jumpable
  const canJumpToStep = (stepNum: number): boolean => {
    if (!allowJump || !onJumpToStep) return false;
    // Can jump to any step before current, or completed steps
    if (stepNum < currentStep) return true;
    if (stepStatuses?.[stepNum - 1] === 'complete') return true;
    return false;
  };

  // Handle step click
  const handleStepClick = (stepNum: number) => {
    if (canJumpToStep(stepNum) && onJumpToStep) {
      onJumpToStep(stepNum);
    }
  };

  // Memoized handler for step navigation - stable reference per stepNum
  const { getHandler: getStepHandler } = useHandlerMap((stepNum: number) => {
    handleStepClick(stepNum);
  });

  // ==========================================================================
  // Bar Variant
  // ==========================================================================
  if (variant === 'bar') {
    return (
      <div className={cn('space-y-2', className)}>
        {showStepCount && (
          <div className="flex justify-between text-sm">
            <span style={{ color: config.textMuted }}>
              Passo {currentStep} de {totalSteps}
            </span>
            <span className="font-mono" style={{ color: config.primary }}>
              {progressPercentage.toFixed(0)}% completo
            </span>
          </div>
        )}
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--color-muted)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPercentage}%`,
              backgroundColor: config.primary,
            }}
          />
        </div>
      </div>
    );
  }

  // ==========================================================================
  // Dots Variant
  // ==========================================================================
  if (variant === 'dots') {
    return (
      <div className={cn('space-y-3', className)}>
        {showStepCount && (
          <div className="text-center text-sm" style={{ color: config.textMuted }}>
            Passo {currentStep} de {totalSteps}
          </div>
        )}
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalSteps }, (_, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === currentStep;
            const isCompleted = stepNum < currentStep;
            const status = stepStatuses?.[i];
            const isHighlighted = isActive || isCompleted || status === 'complete';
            const isJumpable = canJumpToStep(stepNum);

            // Determine dot color based on status
            let dotStyle: React.CSSProperties = {};
            if (status === 'error') {
              dotStyle.backgroundColor = 'var(--color-destructive)';
            } else if (status === 'warning') {
              dotStyle.backgroundColor = 'var(--color-warning)';
            } else if (isHighlighted) {
              dotStyle.backgroundColor = config.primary;
            }

            return (
              <button
                key={stepNum}
                type="button"
                onClick={getStepHandler(stepNum)}
                disabled={!isJumpable}
                className={cn(
                  'h-2.5 rounded-full transition-all duration-300',
                  isActive ? 'w-8' : 'w-2.5',
                  !isHighlighted && !status && 'bg-muted',
                  isJumpable && 'cursor-pointer hover:opacity-80',
                  !isJumpable && 'cursor-default'
                )}
                style={dotStyle}
                aria-label={`${labels[i]}${isJumpable ? ' (clique para ir)' : ''}`}
                aria-current={isActive ? 'step' : undefined}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================================================
  // Stepper Variant (modern horizontal stepper)
  // ==========================================================================
  if (variant === 'stepper') {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-start justify-between relative">
          {/* Connecting line (behind circles) */}
          <div
            className="absolute top-4 left-0 right-0 h-0.5 bg-muted"
            style={{ left: '10%', right: '10%' }}
          />
          {/* Progress line */}
          <div
            className="absolute top-4 h-0.5 transition-all duration-500 ease-out"
            style={{
              left: '10%',
              width: `${Math.max(0, ((currentStep - 1) / (totalSteps - 1)) * 80)}%`,
              backgroundColor: config.primary,
            }}
          />

          {/* Step circles with labels */}
          {labels.map((label, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === currentStep;
            const isCompleted = stepNum < currentStep;
            const status = stepStatuses?.[i] || steps?.[i]?.status;
            const isJumpable = canJumpToStep(stepNum);

            // Determine circle styles
            let circleStyle: React.CSSProperties = {};
            let circleClasses = 'bg-muted text-muted-foreground';

            if (status === 'error') {
              circleClasses = 'bg-destructive text-destructive-foreground';
            } else if (status === 'warning') {
              // Use dark text on amber for better contrast
              circleClasses = 'bg-amber-500 text-amber-950';
            } else if (isActive) {
              circleStyle.backgroundColor = config.primary;
              circleClasses = 'text-primary-foreground ring-4 ring-primary/20';
            } else if (isCompleted || status === 'complete') {
              circleStyle.backgroundColor = config.primary;
              circleClasses = 'text-primary-foreground';
            }

            const StepWrapper = isJumpable ? 'button' : 'div';

            return (
              <StepWrapper
                key={stepNum}
                {...(isJumpable
                  ? {
                      type: 'button' as const,
                      onClick: getStepHandler(stepNum),
                    }
                  : {})}
                className={cn(
                  'flex flex-col items-center relative z-10 flex-1',
                  isJumpable && 'cursor-pointer group',
                  !isJumpable && 'cursor-default'
                )}
                aria-label={`${label}${isJumpable ? ' (clique para ir)' : ''}`}
                aria-current={isActive ? 'step' : undefined}
              >
                {/* Circle */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300',
                    circleClasses,
                    isJumpable && 'group-hover:scale-110'
                  )}
                  style={circleStyle}
                >
                  <StepStatusIcon
                    status={status}
                    stepNum={stepNum}
                    isCompleted={isCompleted}
                  />
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'mt-2 text-xs font-medium text-center transition-colors duration-300 max-w-[80px] truncate',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                    isJumpable && 'group-hover:text-foreground'
                  )}
                >
                  {label}
                </span>

                {/* Optional indicator */}
                {steps?.[i]?.optional && (
                  <span className="text-[10px] text-muted-foreground">(opcional)</span>
                )}
              </StepWrapper>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================================================
  // Steps Variant (default)
  // ==========================================================================

  // Helper functions moved outside map for performance
  const getCircleStyles = (
    status: WizardStepStatus | undefined,
    isActive: boolean,
    isCompleted: boolean
  ): React.CSSProperties => {
    if (status === 'error') {
      return {
        backgroundColor: 'var(--color-destructive)',
        borderColor: 'var(--color-destructive)',
        color: 'white',
      };
    }
    if (status === 'warning') {
      return {
        backgroundColor: 'var(--color-warning)',
        borderColor: 'var(--color-warning)',
        color: 'white',
      };
    }
    if (isActive) {
      return {
        backgroundColor: config.primary,
        borderColor: config.primary,
        color: 'white',
        boxShadow: '0 0 0 4px var(--color-ring)',
      };
    }
    if (isCompleted || status === 'complete') {
      return {
        backgroundColor: config.primary,
        borderColor: config.primary,
        color: 'white',
      };
    }
    return {
      backgroundColor: 'var(--color-muted)',
      borderColor: 'var(--color-border)',
      color: config.textMuted,
    };
  };

  const getLabelStyles = (
    isActive: boolean,
    isCompleted: boolean
  ): React.CSSProperties => {
    if (isActive) {
      return { color: config.primary, fontWeight: 600 };
    }
    if (isCompleted) {
      return { color: 'var(--color-foreground)' };
    }
    return { color: config.textMuted };
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Progress bar */}
      {showStepCount && (
        <>
          <div className="flex justify-between text-sm mb-3">
            <span style={{ color: config.textMuted }}>
              Passo {currentStep} de {totalSteps}
            </span>
            <span className="font-mono" style={{ color: config.primary }}>
              {progressPercentage.toFixed(0)}% completo
            </span>
          </div>
          <div
            className="h-1.5 rounded-full mb-6 overflow-hidden"
            style={{ backgroundColor: 'var(--color-muted)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progressPercentage}%`,
                backgroundColor: config.primary,
              }}
            />
          </div>
        </>
      )}

      {/* Step indicators - horizontal layout */}
      <div className="flex items-start w-full">
        {labels.map((label, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;
          const status = stepStatuses?.[i] || steps?.[i]?.status;
          const isJumpable = canJumpToStep(stepNum);
          const stepDescription = steps?.[i]?.description;

          const StepWrapper = isJumpable ? 'button' : 'div';

          return (
            <StepWrapper
              key={stepNum}
              {...(isJumpable
                ? {
                    type: 'button' as const,
                    onClick: getStepHandler(stepNum),
                  }
                : {})}
              className={cn(
                'flex flex-col items-center flex-1 relative px-2',
                isJumpable && 'cursor-pointer hover:opacity-80 transition-opacity',
                !isJumpable && 'cursor-default'
              )}
              aria-label={`${label}${isJumpable ? ' (clique para ir)' : ''}`}
              aria-current={isActive ? 'step' : undefined}
            >
              {/* Connector line (before circle, except first step) */}
              {i > 0 && (
                <div
                  className="absolute top-4 right-1/2 h-0.5 z-0"
                  style={{
                    width: 'calc(100% - 2rem)',
                    backgroundColor:
                      isCompleted || status === 'complete'
                        ? config.primary
                        : 'var(--color-border)',
                    transform: 'translateX(1rem)',
                  }}
                />
              )}

              {/* Step number circle */}
              <div
                className="w-8 h-8 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 relative z-10 transition-all duration-200"
                style={getCircleStyles(status, isActive, isCompleted)}
              >
                <StepStatusIcon
                  status={status}
                  stepNum={stepNum}
                  isCompleted={isCompleted}
                />
              </div>

              {/* Step label */}
              <div className="flex flex-col items-center mt-2">
                <span
                  className="text-xs font-medium text-center max-w-full truncate"
                  style={getLabelStyles(isActive, isCompleted)}
                >
                  {label}
                </span>
                {stepDescription && (
                  <span
                    className="text-xs hidden sm:block text-center"
                    style={{ color: config.textMuted }}
                  >
                    {stepDescription}
                  </span>
                )}
                {steps?.[i]?.optional && (
                  <span
                    className="text-xs"
                    style={{ color: config.textMuted }}
                  >
                    (opcional)
                  </span>
                )}
              </div>
            </StepWrapper>
          );
        })}
      </div>
    </div>
  );
}
