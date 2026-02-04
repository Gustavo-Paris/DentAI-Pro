/**
 * PageStats Module
 *
 * @module page-stats
 */

// Main component
export { PageStats } from './PageStatsComponent';

// Types
export type {
  PageStatsProps,
  PageStatsVariant,
  StatItem,
  StatTrend,
  StatsLabel,
  StatsTimestamp,
  TrendDirection,
  StatsBarItemVariant,
  LiveStatVariant,
  GridStatVariant,
  VariantProps,
} from './types';

// Constants (for extension)
export {
  barIconVariantClasses,
  liveVariantClasses,
  gridVariantClasses,
  columnClasses,
} from './constants';

// Sub-components (for advanced use cases)
export {
  TrendIndicator,
  CardStats,
  BarStats,
  LiveStats,
  GridStats,
} from './components';
