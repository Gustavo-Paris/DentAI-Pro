'use client';

/**
 * PageStats - Unified Stats Component
 *
 * Consolidates multiple stats components into a single component with variants:
 * - card: Single/multiple stat cards with trend indicators
 * - bar: Horizontal stats bar for gamification
 * - live: Live stats bar with timestamp
 * - grid: Grid of compact stat cards
 *
 * @module page-stats/PageStatsRoot
 */

import type { PageStatsProps } from './types';
import { CardStats, BarStats, LiveStats, GridStats } from './variants';

// =============================================================================
// Component
// =============================================================================

export function PageStats({ variant, ...props }: PageStatsProps) {
  switch (variant) {
    case 'card':
      return <CardStats {...props} />;
    case 'bar':
      return <BarStats {...props} />;
    case 'live':
      return <LiveStats {...props} />;
    case 'grid':
      return <GridStats {...props} />;
    default:
      return null;
  }
}
