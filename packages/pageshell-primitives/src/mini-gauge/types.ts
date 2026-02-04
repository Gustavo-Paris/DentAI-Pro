/**
 * MiniGauge Types
 *
 * @module mini-gauge/types
 */

import type { IconName } from '../icons';

/**
 * Props for MiniGauge component
 */
export interface MiniGaugeProps {
  /** Current value (usage amount) */
  value: number;
  /** Maximum/limit value, or null if no limit */
  limit: number | null;
  /** Percentage of usage (0-100), or null if not calculable */
  percentage: number | null;
  /** Label for the gauge (e.g., "Today", "This Month") */
  label: string;
  /** Optional sublabel text */
  sublabel?: string;
  /** Icon name to display */
  icon?: IconName;
  /** Whether to show glow effect when critical */
  showGlow?: boolean;
  /** Custom value formatter */
  formatValue?: (value: number) => string;
  /** Custom limit formatter */
  formatLimit?: (limit: number) => string;
  /** Text to show when no limit is set */
  noLimitText?: string;
  /** Additional className */
  className?: string;
}

/**
 * Compact variant props
 */
export type MiniGaugeCompactProps = Omit<MiniGaugeProps, 'sublabel' | 'showGlow'>;
