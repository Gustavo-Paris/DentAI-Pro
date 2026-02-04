/**
 * PageStatsCard Module
 *
 * @deprecated Use PageStats with variant prop instead.
 * Migration: <PageStatsCard {...props} /> -> <PageStats variant="card" stats={[props]} />
 *
 * @module page-stats-card
 */

// Main component
export { PageStatsCard } from './PageStatsCardComponent';

// Types
export type {
  LinkComponentType,
  PageStatsCardSize,
  PageStatsCardVariant,
  PageStatsCardPortalVariant,
  TrendDirection,
  PageStatsCardTrend,
  PageStatsCardComparison,
  PageBadge,
  PageStatsCardProps,
} from './types';

// Constants (for extension)
export { sizeConfig, subtitleColorClasses } from './constants';

// Sub-components (for extension)
export { StatsCardSkeleton } from './StatsCardSkeleton';
