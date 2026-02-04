/**
 * PageMetricCard Constants
 *
 * Color, status, and size class mappings.
 *
 * @module metric-card/constants
 */

// =============================================================================
// Color Classes
// =============================================================================

export const colorClasses = {
  primary: {
    icon: 'bg-primary/10 text-primary',
    value: 'text-primary',
    glow: 'var(--color-primary)',
  },
  accent: {
    icon: 'bg-accent/10 text-accent',
    value: 'text-accent',
    glow: 'var(--color-accent)',
  },
  info: {
    icon: 'bg-info/10 text-info',
    value: 'text-info',
    glow: 'var(--color-info)',
  },
  success: {
    icon: 'bg-success/10 text-success',
    value: 'text-success',
    glow: 'var(--color-success)',
  },
  warning: {
    icon: 'bg-warning/10 text-warning',
    value: 'text-warning',
    glow: 'var(--color-warning)',
  },
  destructive: {
    icon: 'bg-destructive/10 text-destructive',
    value: 'text-destructive',
    glow: 'var(--color-destructive)',
  },
  muted: {
    icon: 'bg-muted text-muted-foreground',
    value: 'text-foreground',
    glow: 'var(--color-muted)',
  },
} as const;

export type ColorKey = keyof typeof colorClasses;

// =============================================================================
// Status Classes
// =============================================================================

export const statusClasses = {
  default: '',
  warning: 'border-warning bg-warning/5',
  destructive: 'border-destructive bg-destructive/5',
  success: 'border-success/50 bg-success/5',
} as const;

export type StatusKey = keyof typeof statusClasses;

// =============================================================================
// Size Classes
// =============================================================================

export const sizeClasses = {
  sm: {
    container: 'p-3',
    icon: 'w-8 h-8',
    iconInner: 'h-4 w-4',
    value: 'text-lg',
    label: 'text-[10px]',
    sublabel: 'text-[10px]',
  },
  md: {
    container: 'p-4',
    icon: 'w-10 h-10',
    iconInner: 'h-5 w-5',
    value: 'text-2xl',
    label: 'text-xs',
    sublabel: 'text-xs',
  },
  lg: {
    container: 'p-5',
    icon: 'w-12 h-12',
    iconInner: 'h-6 w-6',
    value: 'text-3xl',
    label: 'text-sm',
    sublabel: 'text-sm',
  },
} as const;

export type SizeKey = keyof typeof sizeClasses;
