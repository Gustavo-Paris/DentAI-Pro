'use client';

/**
 * PulsingStatusDot Component
 *
 * Animated status indicator dot with optional pulse and glow effects.
 * Used in health indicators, online status, and activity displays.
 *
 * @module pulsing-status-dot
 */

import { cn } from '@pageshell/core';
import type {
  PulsingStatusDotProps,
  StatusDotVariant,
  StatusDotSize,
} from './types';

/**
 * Size classes for the dot
 */
const SIZE_CLASSES: Record<StatusDotSize, string> = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-3 w-3',
};

/**
 * Color classes for each variant
 */
const VARIANT_CLASSES: Record<StatusDotVariant, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  muted: 'bg-muted-foreground',
  primary: 'bg-primary',
  info: 'bg-info',
};

/**
 * Glow color classes for each variant
 */
const GLOW_CLASSES: Record<StatusDotVariant, string> = {
  success: 'shadow-success/50',
  warning: 'shadow-warning/50',
  destructive: 'shadow-destructive/50',
  muted: 'shadow-muted-foreground/30',
  primary: 'shadow-primary/50',
  info: 'shadow-info/50',
};

/**
 * PulsingStatusDot - Animated status indicator
 *
 * Features:
 * - Multiple color variants
 * - Optional pulse animation (ping effect)
 * - Optional glow effect
 * - Three size options
 *
 * @example
 * ```tsx
 * // Online status with pulse
 * <PulsingStatusDot variant="success" pulse />
 *
 * // Error state with glow
 * <PulsingStatusDot variant="destructive" glow />
 *
 * // Muted inactive state
 * <PulsingStatusDot variant="muted" size="sm" />
 * ```
 */
export function PulsingStatusDot({
  variant,
  pulse = false,
  glow = false,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: PulsingStatusDotProps) {
  const sizeClass = SIZE_CLASSES[size];
  const colorClass = VARIANT_CLASSES[variant];
  const glowClass = glow ? `shadow-lg ${GLOW_CLASSES[variant]}` : '';

  return (
    <span
      className={cn('relative inline-flex', sizeClass, className)}
      role="status"
      aria-label={ariaLabel}
    >
      {/* Ping animation (pulse) */}
      {pulse && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
            colorClass
          )}
        />
      )}

      {/* Main dot */}
      <span
        className={cn(
          'relative inline-flex rounded-full',
          sizeClass,
          colorClass,
          glowClass
        )}
      />
    </span>
  );
}

PulsingStatusDot.displayName = 'PulsingStatusDot';
