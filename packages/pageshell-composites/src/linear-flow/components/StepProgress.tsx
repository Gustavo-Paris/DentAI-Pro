/**
 * LinearFlowPage Step Progress
 *
 * Step progress indicator for LinearFlowPage.
 *
 * @module linear-flow/components/StepProgress
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { resolveIcon } from '@pageshell/primitives';
import { Check } from 'lucide-react';

import type { StepConfig, StepStatus } from '../types';
import {
  type WizardAriaLabels,
  resolveWizardAriaLabels,
} from '../../shared/types';

// =============================================================================
// Types
// =============================================================================

export interface StepProgressProps {
  /** Steps with their statuses */
  steps: (StepConfig & { status: StepStatus })[];
  /** Current step ID */
  currentStep: string;
  /** Step click handler */
  onStepClick?: (stepId: string) => void;
  /** Whether navigation is allowed */
  allowNavigation?: boolean | ((stepId: string, currentStepId: string) => boolean);
  /** ARIA labels for i18n */
  ariaLabels?: WizardAriaLabels;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Step progress indicator for LinearFlowPage.
 * Displays steps with status and optional click navigation.
 */
export const StepProgress = React.memo(function StepProgress({
  steps,
  currentStep,
  onStepClick,
  allowNavigation,
  ariaLabels,
}: StepProgressProps) {
  const resolvedAriaLabels = resolveWizardAriaLabels(ariaLabels);

  const canNavigate = (stepId: string) => {
    if (!onStepClick) return false;
    if (typeof allowNavigation === 'boolean') return allowNavigation;
    if (typeof allowNavigation === 'function')
      return allowNavigation(stepId, currentStep);
    return false;
  };

  return (
    <nav
      role="group"
      aria-label={resolvedAriaLabels.stepProgress}
      className="flex items-center justify-between"
    >
      {steps.map((step, index) => {
        const isClickable = canNavigate(step.id);
        const isCurrent = step.status === 'current';
        const Icon = resolveIcon(step.icon);

        return (
          <React.Fragment key={step.id}>
            <button
              type="button"
              onClick={() => isClickable && onStepClick?.(step.id)}
              disabled={!isClickable}
              aria-current={isCurrent ? 'step' : undefined}
              aria-disabled={!isClickable || undefined}
              className={cn(
                'flex items-center gap-3 transition-colors',
                isClickable && 'cursor-pointer hover:opacity-80',
                !isClickable && 'cursor-default'
              )}
            >
              {/* Step Circle */}
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  // emerald-500 is a preserved accent color for success states
                  step.status === 'completed' &&
                    'bg-emerald-500 text-success-foreground',
                  step.status === 'current' &&
                    'bg-primary text-primary-foreground',
                  step.status === 'upcoming' &&
                    'bg-muted text-muted-foreground'
                )}
              >
                {step.status === 'completed' ? (
                  <Check className="h-4 w-4" />
                ) : Icon ? (
                  <Icon className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>

              {/* Step Label */}
              <span
                className={cn(
                  'text-sm font-medium hidden sm:block',
                  step.status === 'current' && 'text-foreground',
                  step.status !== 'current' && 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </button>

            {/* Connector (decorative) */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-4',
                  // emerald-500 is a preserved accent color for success states
                  steps[index + 1]?.status !== 'upcoming'
                    ? 'bg-emerald-500'
                    : 'bg-muted'
                )}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
});

StepProgress.displayName = 'StepProgress';
