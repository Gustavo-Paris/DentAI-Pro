/**
 * PageSteps Component
 *
 * Displays numbered steps with colored indicators.
 * Useful for showing processes, instructions, or workflows.
 *
 * @module page-steps
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { resolveIcon, type IconProp } from '@pageshell/primitives';

/**
 * Step indicator color
 */
export type PageStepsColor = 'violet' | 'emerald' | 'amber' | 'blue' | 'rose' | 'cyan' | 'primary' | 'accent';

/**
 * Individual step configuration
 */
export interface PageStep {
  /** Step title */
  title: string;
  /** Step description */
  description?: string;
  /** Custom icon instead of number (optional) */
  icon?: IconProp;
  /** Step indicator color (overrides default) */
  color?: PageStepsColor;
}

/**
 * PageSteps component props
 */
export interface PageStepsProps {
  /** Array of steps to display */
  steps: PageStep[];
  /** Default color for step indicators */
  color?: PageStepsColor;
  /** Color sequence for alternating colors (overrides color) */
  colorSequence?: PageStepsColor[];
  /** Gap between steps */
  gap?: 'sm' | 'md' | 'lg';
  /** Indicator size */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
  /** Test ID */
  testId?: string;
}

const gapClasses = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

const sizeClasses = {
  sm: 'w-5 h-5 text-xs',
  md: 'w-6 h-6 text-sm',
  lg: 'w-8 h-8 text-base',
};

const iconSizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
};

/**
 * PageSteps - Numbered steps display
 *
 * @example Basic usage
 * ```tsx
 * <PageSteps
 *   steps={[
 *     { title: 'Connect Account', description: 'Link your Zoom account' },
 *     { title: 'Schedule Session', description: 'Choose date and time' },
 *     { title: 'Start Meeting', description: 'Join the video call' },
 *   ]}
 * />
 * ```
 *
 * @example With color sequence
 * ```tsx
 * <PageSteps
 *   colorSequence={['violet', 'emerald', 'amber', 'blue']}
 *   steps={[
 *     { title: 'Step 1', description: 'First step' },
 *     { title: 'Step 2', description: 'Second step' },
 *     { title: 'Step 3', description: 'Third step' },
 *     { title: 'Step 4', description: 'Fourth step' },
 *   ]}
 * />
 * ```
 *
 * @example With icons
 * ```tsx
 * <PageSteps
 *   steps={[
 *     { title: 'Connect', icon: 'link', color: 'violet' },
 *     { title: 'Configure', icon: 'settings', color: 'emerald' },
 *     { title: 'Launch', icon: 'rocket', color: 'amber' },
 *   ]}
 * />
 * ```
 */
export function PageSteps({
  steps,
  color = 'violet',
  colorSequence,
  gap = 'md',
  size = 'md',
  className,
  testId,
}: PageStepsProps) {
  return (
    <div
      className={cn('grid', gapClasses[gap], className)}
      data-testid={testId}
    >
      {steps.map((step, index) => {
        // Determine color: step-specific > sequence > default
        const stepColor = step.color ?? colorSequence?.[index % colorSequence.length] ?? color;
        const Icon = step.icon ? resolveIcon(step.icon) : null;

        return (
          <div key={index} className="flex gap-3">
            {/* Step indicator */}
            <div
              className={cn(
                'flex-shrink-0 rounded-full portal-section-icon flex items-center justify-center font-medium',
                sizeClasses[size],
                stepColor
              )}
              aria-hidden="true"
            >
              {Icon ? (
                <Icon className={iconSizeClasses[size]} />
              ) : (
                index + 1
              )}
            </div>

            {/* Step content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="font-medium text-foreground">{step.title}</p>
              {step.description && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
