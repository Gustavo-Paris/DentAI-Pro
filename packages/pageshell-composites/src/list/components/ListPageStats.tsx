/**
 * ListPage Stats
 *
 * Stats grid for ListPage composite.
 *
 * @module list/components/ListPageStats
 */

'use client';

import * as React from 'react';
import { cn, formatValue } from '@pageshell/core';
import { resolveIcon } from '@pageshell/primitives';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { StatConfig } from '../../shared/types';

// =============================================================================
// Types
// =============================================================================

export interface ListPageStatsProps<TData = unknown> {
  /** Stats configuration array */
  stats: StatConfig[];
  /** Query data to extract stat values from */
  data: TData | undefined;
}

// =============================================================================
// Component
// =============================================================================

export function ListPageStats<TData = unknown>({
  stats,
  data,
}: ListPageStatsProps<TData>) {
  if (!stats || stats.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat) => {
        const value = data
          ? (data as Record<string, unknown>)[stat.key]
          : undefined;
        const TrendIcon =
          stat.trend === 'up'
            ? TrendingUp
            : stat.trend === 'down'
              ? TrendingDown
              : Minus;
        const StatIcon = resolveIcon(stat.icon);

        return (
          <div
            key={stat.key}
            className="p-3 sm:p-4 rounded-xl border border-border bg-card"
          >
            {/* Header: Label + Icon */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-muted-foreground truncate pr-2">
                {stat.label}
              </span>
              {StatIcon && (
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
                  <StatIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                </div>
              )}
            </div>
            {/* Value + Trend */}
            <div className="flex items-end justify-between gap-2">
              <p className="text-lg sm:text-2xl font-bold text-foreground truncate">
                {formatValue(value, stat.format || 'number')}
              </p>
              {stat.trendValue && (
                <span
                  className={cn(
                    'flex items-center gap-1 text-xs font-medium shrink-0',
                    stat.trend === 'up' && 'text-success',
                    stat.trend === 'down' && 'text-destructive',
                    stat.trend === 'neutral' && 'text-muted-foreground'
                  )}
                >
                  <TrendIcon className="h-3 w-3" />
                  {stat.trend === 'up' ? '+' : stat.trend === 'down' ? '' : ''}
                  {stat.trendValue}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

ListPageStats.displayName = 'ListPageStats';
