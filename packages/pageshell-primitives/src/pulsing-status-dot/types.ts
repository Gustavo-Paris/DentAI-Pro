/**
 * PulsingStatusDot Types
 *
 * @module pulsing-status-dot/types
 */

/**
 * Visual variants for the status dot
 */
export type StatusDotVariant =
  | 'success'
  | 'warning'
  | 'destructive'
  | 'muted'
  | 'primary'
  | 'info';

/**
 * Size variants for the status dot
 */
export type StatusDotSize = 'sm' | 'md' | 'lg';

/**
 * Props for PulsingStatusDot component
 */
export interface PulsingStatusDotProps {
  /** Visual variant determining color */
  variant: StatusDotVariant;
  /** Whether to show pulse animation (default: false) */
  pulse?: boolean;
  /** Whether to show glow effect (default: false) */
  glow?: boolean;
  /** Size of the dot (default: 'md') */
  size?: StatusDotSize;
  /** Additional className */
  className?: string;
  /** Accessible label for screen readers */
  'aria-label'?: string;
}
