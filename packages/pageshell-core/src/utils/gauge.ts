/**
 * Gauge Status Utilities
 *
 * Shared threshold logic for gauge components.
 * Provides consistent status determination and color mapping.
 *
 * @module utils/gauge
 */

/**
 * Gauge status levels based on percentage thresholds
 */
export type GaugeStatus = 'neutral' | 'healthy' | 'warning' | 'critical';

/**
 * Color configuration for gauge visualization
 */
export interface GaugeColors {
  /** Primary color for the gauge indicator */
  main: string;
  /** Muted/glow color for effects */
  glow: string;
}

/**
 * Threshold configuration for gauge status determination
 */
export interface GaugeThresholds {
  /** Percentage threshold for warning status (default: 70) */
  warning: number;
  /** Percentage threshold for critical status (default: 90) */
  critical: number;
}

/**
 * Default threshold values
 */
export const DEFAULT_GAUGE_THRESHOLDS: GaugeThresholds = {
  warning: 70,
  critical: 90,
};

/**
 * Determines the status level based on percentage
 *
 * @param percent - The percentage value (0-100), or null if not calculable
 * @param thresholds - Optional custom thresholds
 * @returns The gauge status
 *
 * @example
 * ```ts
 * getGaugeStatus(50);    // 'healthy'
 * getGaugeStatus(75);    // 'warning'
 * getGaugeStatus(95);    // 'critical'
 * getGaugeStatus(null);  // 'neutral'
 * ```
 */
export function getGaugeStatus(
  percent: number | null,
  thresholds: GaugeThresholds = DEFAULT_GAUGE_THRESHOLDS
): GaugeStatus {
  if (percent === null) return 'neutral';
  if (percent >= thresholds.critical) return 'critical';
  if (percent >= thresholds.warning) return 'warning';
  return 'healthy';
}

/**
 * Gets the color configuration based on percentage
 *
 * Uses CSS variables for theme compatibility:
 * - Primary: `--color-primary` / `--color-primary-muted`
 * - Warning: `--color-warning` / `--color-warning-muted`
 * - Destructive: `--color-destructive` / `--color-destructive-muted`
 *
 * @param percent - The percentage value (0-100)
 * @param thresholds - Optional custom thresholds
 * @returns Color configuration object
 *
 * @example
 * ```ts
 * const colors = getGaugeColors(50);
 * // { main: 'var(--color-primary)', glow: 'var(--color-primary-muted)' }
 *
 * const colors = getGaugeColors(95);
 * // { main: 'var(--color-destructive)', glow: 'var(--color-destructive-muted)' }
 * ```
 */
export function getGaugeColors(
  percent: number,
  thresholds: GaugeThresholds = DEFAULT_GAUGE_THRESHOLDS
): GaugeColors {
  if (percent >= thresholds.critical) {
    return {
      main: 'var(--color-destructive)',
      glow: 'var(--color-destructive-muted)',
    };
  }
  if (percent >= thresholds.warning) {
    return {
      main: 'var(--color-warning)',
      glow: 'var(--color-warning-muted)',
    };
  }
  return {
    main: 'var(--color-primary)',
    glow: 'var(--color-primary-muted)',
  };
}

/**
 * Gets Tailwind class names based on gauge status
 *
 * @param status - The gauge status
 * @returns Object with text, bg, and border classes
 *
 * @example
 * ```ts
 * const classes = getGaugeStatusClasses('critical');
 * // { text: 'text-destructive', bg: 'bg-destructive', border: 'border-destructive' }
 * ```
 */
export function getGaugeStatusClasses(status: GaugeStatus): {
  text: string;
  bg: string;
  border: string;
} {
  switch (status) {
    case 'critical':
      return {
        text: 'text-destructive',
        bg: 'bg-destructive',
        border: 'border-destructive',
      };
    case 'warning':
      return {
        text: 'text-warning',
        bg: 'bg-warning',
        border: 'border-warning',
      };
    case 'healthy':
      return {
        text: 'text-success',
        bg: 'bg-success',
        border: 'border-success',
      };
    case 'neutral':
    default:
      return {
        text: 'text-muted-foreground',
        bg: 'bg-muted',
        border: 'border-border',
      };
  }
}
