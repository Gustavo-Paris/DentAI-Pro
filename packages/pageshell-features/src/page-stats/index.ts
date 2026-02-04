/**
 * PageStats Module
 *
 * Unified stats component with multiple variants:
 * - card: Single/multiple stat cards with trend indicators
 * - bar: Horizontal stats bar for gamification
 * - live: Live stats bar with timestamp
 * - grid: Grid of compact stat cards
 *
 * @module page-stats
 */

// Main component
export { PageStats } from './PageStatsRoot';

// Types
export type {
  PageStatsVariant,
  TrendDirection,
  StatTrend,
  StatsBarItemVariant,
  LiveStatVariant,
  GridStatVariant,
  StatItem,
  StatsLabel,
  StatsTimestamp,
  PageStatsProps,
  VariantProps,
} from './types';

// Constants (for extension)
export {
  barIconVariantClasses,
  liveVariantClasses,
  gridVariantClasses,
  gridColumnClasses,
} from './constants';

// Variant components (for extension)
export { CardStats, BarStats, LiveStats, GridStats } from './variants';
