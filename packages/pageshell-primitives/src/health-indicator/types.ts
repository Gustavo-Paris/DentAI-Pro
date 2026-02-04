/**
 * HealthIndicator Types
 *
 * Animated health/service status indicator.
 */

export type HealthStatus = 'healthy' | 'degraded' | 'offline' | 'unknown' | 'checking';

export type HealthIndicatorSize = 'sm' | 'md' | 'lg';

export interface HealthIndicatorProps {
  /**
   * Current health status
   */
  status: HealthStatus;

  /**
   * Label to display (e.g., "Ana", "API")
   */
  label?: string;

  /**
   * Timestamp of last health check
   */
  lastChecked?: Date | string | null;

  /**
   * Whether to show the label
   * @default true
   */
  showLabel?: boolean;

  /**
   * Whether to show the last checked timestamp
   * @default false
   */
  showTimestamp?: boolean;

  /**
   * Whether to pulse the status dot when healthy
   * @default true
   */
  pulse?: boolean;

  /**
   * Size variant
   * @default 'md'
   */
  size?: HealthIndicatorSize;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Callback when clicked (e.g., to refresh)
   */
  onClick?: () => void;

  /**
   * Tooltip content (if provided, wraps in tooltip)
   */
  tooltip?: string;

  /**
   * ARIA label for accessibility
   */
  'aria-label'?: string;
}

export interface HealthStatusConfig {
  icon: string;
  dotColor: string;
  bgColor: string;
  textColor: string;
  pulse: boolean;
}
