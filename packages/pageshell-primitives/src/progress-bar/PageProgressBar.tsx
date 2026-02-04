/**
 * PageProgressBar Component
 *
 * A simple, styled progress bar with color variants and sizes.
 * For more complex progress indicators, consider using the Radix-based
 * Progress component.
 *
 * @module progress-bar
 *
 * @example Basic usage
 * ```tsx
 * <PageProgressBar percent={75} />
 * ```
 *
 * @example With color and size
 * ```tsx
 * <PageProgressBar
 *   percent={50}
 *   color="amber"
 *   size="lg"
 * />
 * ```
 *
 * @example With label
 * ```tsx
 * <PageProgressBar
 *   percent={33}
 *   color="success"
 *   showLabel
 * />
 * ```
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import type { PageProgressBarProps, ProgressBarColor, ProgressBarSize } from './types';

// =============================================================================
// Style Maps
// =============================================================================

const SIZE_CLASSES: Record<ProgressBarSize, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const COLOR_CLASSES: Record<ProgressBarColor, string> = {
  primary: 'bg-primary',
  success: 'bg-emerald-500',
  warning: 'bg-yellow-500',
  destructive: 'bg-destructive',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-500',
};

// =============================================================================
// Component
// =============================================================================

export function PageProgressBar({
  percent,
  color = 'primary',
  size = 'md',
  showLabel = false,
  className,
  barClassName,
}: PageProgressBarProps) {
  // Clamp percent between 0 and 100
  const clampedPercent = Math.min(100, Math.max(0, percent));

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-end mb-1">
          <span className="text-xs font-medium text-muted-foreground">
            {Math.round(clampedPercent)}%
          </span>
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full bg-muted overflow-hidden',
          SIZE_CLASSES[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            COLOR_CLASSES[color],
            barClassName
          )}
          style={{ width: `${clampedPercent}%` }}
          role="progressbar"
          aria-valuenow={clampedPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

PageProgressBar.displayName = 'PageProgressBar';
