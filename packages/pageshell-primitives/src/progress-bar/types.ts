/**
 * PageProgressBar Types
 *
 * Type definitions for the progress bar component.
 *
 * @module progress-bar/types
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Color variants for the progress bar
 */
export type ProgressBarColor =
  | 'primary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'amber'
  | 'emerald'
  | 'blue';

/**
 * Size variants for the progress bar
 */
export type ProgressBarSize = 'sm' | 'md' | 'lg';

/**
 * Props for PageProgressBar component
 */
export interface PageProgressBarProps {
  /** Progress percentage (0-100) */
  percent: number;
  /** Color variant */
  color?: ProgressBarColor;
  /** Size variant */
  size?: ProgressBarSize;
  /** Whether to show the percentage label */
  showLabel?: boolean;
  /** Additional CSS class for the container */
  className?: string;
  /** Additional CSS class for the fill bar */
  barClassName?: string;
}
