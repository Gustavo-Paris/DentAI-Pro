'use client';

/**
 * PageStats - Unified Stats Component
 *
 * @deprecated This file is deprecated. Import from './page-stats' instead.
 * This file exists for backward compatibility and will be removed in a future version.
 *
 * @module PageStats
 */

// Re-export everything from the modular version
export {
  // Main component
  PageStats,
  // Types
  type PageStatsVariant,
  type TrendDirection,
  type StatTrend,
  type StatsBarItemVariant,
  type LiveStatVariant,
  type GridStatVariant,
  type StatItem,
  type StatsLabel,
  type StatsTimestamp,
  type PageStatsProps,
  type VariantProps,
  // Constants
  barIconVariantClasses,
  liveVariantClasses,
  gridVariantClasses,
  gridColumnClasses,
  // Variant components
  CardStats,
  BarStats,
  LiveStats,
  GridStats,
} from './page-stats';
