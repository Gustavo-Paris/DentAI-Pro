'use client';

/**
 * StatsCardSkeleton Component
 *
 * @module page-stats-card/StatsCardSkeleton
 */

import { cn } from '@pageshell/core';
import { sizeConfig } from './constants';
import type { PageStatsCardSize } from './types';

// =============================================================================
// Component
// =============================================================================

export function StatsCardSkeleton({ size }: { size: PageStatsCardSize }) {
  const config = sizeConfig[size];

  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-3 flex-1">
          <div className={cn('h-4 bg-muted rounded w-24', config.labelSize)} />
          <div className={cn('h-8 bg-muted rounded w-20', config.valueSize)} />
          <div className="h-3 bg-muted rounded w-16" />
        </div>
        <div className={cn('rounded-full bg-muted', config.iconBgSize, config.iconSize)} />
      </div>
    </div>
  );
}
