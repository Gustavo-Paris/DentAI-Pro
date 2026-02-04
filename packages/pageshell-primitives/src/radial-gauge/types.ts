/**
 * RadialGauge Types
 *
 * @module radial-gauge/types
 */

/**
 * Props for RadialGauge component
 */
export interface RadialGaugeProps {
  /** Current value */
  value: number;
  /** Maximum value */
  max: number;
  /** Primary label text */
  label: string;
  /** Secondary label text */
  sublabel?: string;
  /** Size of the gauge in pixels (default: 240) */
  size?: number;
  /** Stroke width of the progress arc (default: 12) */
  strokeWidth?: number;
  /** Whether to show the center value display (default: true) */
  showValue?: boolean;
  /** Whether to animate on mount (default: true) */
  animated?: boolean;
  /** Whether to show tick marks (default: true) */
  showTicks?: boolean;
  /** Number of tick marks (default: 12) */
  tickCount?: number;
  /** Animation duration in milliseconds (default: 1500) */
  animationDuration?: number;
  /** Custom value formatter */
  formatValue?: (value: number) => string;
  /** Custom max formatter */
  formatMax?: (max: number) => string;
  /** Additional className */
  className?: string;
}
