'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { PageIcon } from '../page-icon';
import type { LabeledIndicatorProps, IndicatorVariant, IndicatorSize } from './types';

// =============================================================================
// Variant Configuration
// =============================================================================

const VARIANT_CLASSES: Record<IndicatorVariant, string> = {
  default: 'bg-card border border-border text-foreground',
  success: 'bg-success/10 border border-success/20 text-success',
  warning: 'bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400',
  destructive: 'bg-destructive/10 border border-destructive/20 text-destructive',
  muted: 'bg-muted border border-border text-muted-foreground',
  info: 'bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400',
};

// =============================================================================
// Size Configuration
// =============================================================================

const SIZE_CLASSES: Record<IndicatorSize, { container: string; icon: string; text: string }> = {
  sm: {
    container: 'px-1.5 py-0.5 gap-1',
    icon: 'h-3 w-3',
    text: 'text-[10px]',
  },
  md: {
    container: 'px-2 py-1 gap-1.5',
    icon: 'h-3.5 w-3.5',
    text: 'text-xs',
  },
  lg: {
    container: 'px-2.5 py-1.5 gap-2',
    icon: 'h-4 w-4',
    text: 'text-sm',
  },
};

// =============================================================================
// LabeledIndicator Component
// =============================================================================

/**
 * LabeledIndicator
 *
 * Compact indicator with optional icon, label, and value.
 * Use for status badges, difficulty indicators, metadata tags, etc.
 *
 * @example Basic usage
 * ```tsx
 * <LabeledIndicator
 *   icon="alert-circle"
 *   label="Difficult"
 *   variant="warning"
 * />
 * ```
 *
 * @example With value
 * ```tsx
 * <LabeledIndicator
 *   icon="star"
 *   label="Rating"
 *   value="4.5"
 *   variant="success"
 * />
 * ```
 *
 * @example Small size
 * ```tsx
 * <LabeledIndicator
 *   label="New"
 *   variant="info"
 *   size="sm"
 *   showIcon={false}
 * />
 * ```
 */
export const LabeledIndicator = React.memo(function LabeledIndicator({
  icon,
  label,
  value,
  variant = 'default',
  size = 'md',
  showIcon = true,
  className,
  title,
}: LabeledIndicatorProps) {
  const sizeClasses = SIZE_CLASSES[size];

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md',
        VARIANT_CLASSES[variant],
        sizeClasses.container,
        className
      )}
      title={title}
    >
      {showIcon && icon && <PageIcon name={icon} className={sizeClasses.icon} />}
      <span className={cn('font-medium', sizeClasses.text)}>{label}</span>
      {value !== undefined && (
        <>
          <span className="text-muted-foreground/50">•</span>
          <span className={cn('font-semibold', sizeClasses.text)}>{value}</span>
        </>
      )}
    </div>
  );
});
