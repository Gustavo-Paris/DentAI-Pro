'use client';

/**
 * PageStatsCard Component
 *
 * @deprecated This file is deprecated. Import from './page-stats-card' instead.
 * This file exists for backward compatibility and will be removed in a future version.
 *
 * Migration:
 * - import { PageStatsCard } from '@pageshell/features';
 *   (no change needed, barrel export handles this)
 *
 * @module PageStatsCard
 */

// Re-export everything from the modular version
export {
  // Main component
  PageStatsCard,
  // Types
  type LinkComponentType,
  type PageStatsCardSize,
  type PageStatsCardVariant,
  type PageStatsCardPortalVariant,
  type TrendDirection,
  type PageStatsCardTrend,
  type PageStatsCardComparison,
  type PageBadge,
  type PageStatsCardProps,
  // Constants
  sizeConfig,
  subtitleColorClasses,
  // Sub-components
  StatsCardSkeleton,
} from './page-stats-card';
