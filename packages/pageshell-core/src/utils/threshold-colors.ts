/**
 * Threshold Color Utilities
 *
 * Provides consistent color mapping based on percentage thresholds.
 * Used by usage cards, progress indicators, and status displays.
 *
 * @module utils/threshold-colors
 */

/**
 * Threshold configuration
 */
export interface ThresholdConfig {
  /** Percentage threshold for critical status (default: 90) */
  critical: number;
  /** Percentage threshold for warning status (default: 70) */
  warning: number;
}

/**
 * Threshold variant types
 */
export type ThresholdVariant = 'critical' | 'warning' | 'success' | 'neutral';

/**
 * Default threshold configuration
 */
export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  critical: 90,
  warning: 70,
};

/**
 * Gets the threshold variant based on percentage value
 *
 * @param value - The percentage value (0-100), or null
 * @param config - Optional custom threshold configuration
 * @returns The threshold variant
 *
 * @example
 * ```ts
 * getThresholdVariant(50);    // 'success'
 * getThresholdVariant(75);    // 'warning'
 * getThresholdVariant(95);    // 'critical'
 * getThresholdVariant(null);  // 'neutral'
 * ```
 */
export function getThresholdVariant(
  value: number | null,
  config: ThresholdConfig = DEFAULT_THRESHOLDS
): ThresholdVariant {
  if (value === null) return 'neutral';
  if (value >= config.critical) return 'critical';
  if (value >= config.warning) return 'warning';
  return 'success';
}

/**
 * Color type options for threshold colors
 */
export type ThresholdColorType = 'text' | 'bg' | 'border';

/**
 * Gets the appropriate Tailwind color class based on threshold
 *
 * @param value - The percentage value (0-100), or null
 * @param type - The color type ('text', 'bg', or 'border')
 * @param config - Optional custom threshold configuration
 * @returns The Tailwind color class
 *
 * @example
 * ```ts
 * getThresholdColor(50, 'text');   // 'text-emerald-400'
 * getThresholdColor(75, 'bg');     // 'bg-amber-500'
 * getThresholdColor(95, 'text');   // 'text-red-400'
 * getThresholdColor(null, 'text'); // 'text-muted-foreground'
 * ```
 */
export function getThresholdColor(
  value: number | null,
  type: ThresholdColorType,
  config: ThresholdConfig = DEFAULT_THRESHOLDS
): string {
  const variant = getThresholdVariant(value, config);

  const colorMap: Record<ThresholdVariant, Record<ThresholdColorType, string>> = {
    critical: {
      text: 'text-red-400',
      bg: 'bg-red-500',
      border: 'border-red-500',
    },
    warning: {
      text: 'text-amber-400',
      bg: 'bg-amber-500',
      border: 'border-amber-500',
    },
    success: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500',
      border: 'border-emerald-500',
    },
    neutral: {
      text: 'text-muted-foreground',
      bg: 'bg-border',
      border: 'border-border',
    },
  };

  return colorMap[variant][type];
}

/**
 * Gets the progress bar color class based on threshold
 *
 * @param value - The percentage value (0-100), or null
 * @param config - Optional custom threshold configuration
 * @returns The Tailwind background class for progress bars
 *
 * @example
 * ```ts
 * getProgressColor(50);   // 'bg-emerald-500'
 * getProgressColor(75);   // 'bg-amber-500'
 * getProgressColor(95);   // 'bg-red-500'
 * ```
 */
export function getProgressColor(
  value: number | null,
  config: ThresholdConfig = DEFAULT_THRESHOLDS
): string {
  return getThresholdColor(value, 'bg', config);
}

/**
 * Gets the status text color class based on threshold
 *
 * @param value - The percentage value (0-100), or null
 * @param config - Optional custom threshold configuration
 * @returns The Tailwind text class for status display
 *
 * @example
 * ```ts
 * getStatusColor(50);   // 'text-emerald-400'
 * getStatusColor(75);   // 'text-amber-400'
 * getStatusColor(95);   // 'text-red-400'
 * ```
 */
export function getStatusColor(
  value: number | null,
  config: ThresholdConfig = DEFAULT_THRESHOLDS
): string {
  return getThresholdColor(value, 'text', config);
}
