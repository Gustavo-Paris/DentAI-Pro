/**
 * PageStats Types
 *
 * @module page-stats
 */

import type { ReactNode } from 'react';
import type { IconProp } from '@pageshell/primitives';

// =============================================================================
// Variant Types
// =============================================================================

export type PageStatsVariant = 'card' | 'bar' | 'live' | 'grid';

export type TrendDirection = 'up' | 'down' | 'neutral';

export type StatsBarItemVariant =
  | 'default'
  | 'unlocked'
  | 'locked'
  | 'streak'
  | 'record'
  | 'upcoming'
  | 'completed'
  | 'hours'
  | 'primary'
  | 'success'
  | 'accent';

export type LiveStatVariant = 'default' | 'warning' | 'success' | 'primary' | 'accent';

export type GridStatVariant = 'primary' | 'secondary' | 'warning';

// =============================================================================
// Stat Configuration Types
// =============================================================================

export interface StatTrend {
  /** Percentage or absolute change value */
  value: number;
  /** Direction of the trend */
  direction: TrendDirection;
  /** Optional label (e.g., "vs last month") */
  label?: string;
}

/**
 * Unified stat item configuration
 */
export interface StatItem {
  /** Stat label */
  label: string;
  /** Main value to display */
  value: string | number;
  /** Icon */
  icon?: IconProp;
  /** Trend indicator (card variant) */
  trend?: StatTrend;
  /** Prefix for value (e.g., "R$") */
  prefix?: string;
  /** Suffix for value (e.g., "%") */
  suffix?: string;
  /** Optional hint text (grid variant) */
  hint?: string;
  /** Item variant styling (bar variant) */
  itemVariant?: StatsBarItemVariant;
  /** Value color class (bar variant) */
  valueClassName?: string;
  /** Text color class (live variant) */
  textColor?: string;
  /** Status indicator color (live variant, e.g., 'bg-emerald-500') */
  indicator?: string;
  /** Grid variant styling */
  gridVariant?: GridStatVariant;
  /** Custom render for complex values (live variant) */
  render?: () => ReactNode;
}

/**
 * Label configuration (live variant)
 */
export interface StatsLabel {
  /** Icon */
  icon: IconProp;
  /** Label text */
  text: string;
}

/**
 * Timestamp configuration (live variant)
 */
export interface StatsTimestamp {
  /** Icon (defaults to 'clock') */
  icon?: IconProp;
  /** Label text */
  label: string;
  /** Display value (defaults to 'agora') */
  value?: string;
}

// =============================================================================
// Component Props
// =============================================================================

export interface PageStatsProps {
  /** Visual variant */
  variant: PageStatsVariant;
  /** Stats items to display */
  stats: StatItem[];
  /** Left label with icon (live variant) */
  label?: StatsLabel;
  /** Timestamp item (live variant, always shown last) */
  timestamp?: StatsTimestamp;
  /** Number of columns (card/grid variants) */
  columns?: 2 | 3 | 4;
  /** Animation delay index (1-8) */
  animationDelay?: number;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for automated testing */
  testId?: string;
}

/** Props for individual variant components */
export type VariantProps = Omit<PageStatsProps, 'variant'>;
