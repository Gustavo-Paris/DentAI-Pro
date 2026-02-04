/**
 * DashboardStats Component
 *
 * Stats grid for DashboardPage composite.
 *
 * @module dashboard/components/DashboardStats
 */

'use client';

import * as React from 'react';
import { cn, formatValue } from '@pageshell/core';
import { resolveIcon } from '@pageshell/primitives';
import type { StatConfig } from '../../shared/types';

// =============================================================================
// Types
// =============================================================================

export interface DashboardStatsProps {
  /** Stats configuration */
  stats: StatConfig[];
  /** Data containing stat values */
  data?: Record<string, unknown>;
}

// =============================================================================
// Component
// =============================================================================

export function DashboardStats({ stats, data }: DashboardStatsProps) {
  if (!stats || stats.length === 0) return null;

  return (
    <div
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
      role="group"
      aria-label="Dashboard statistics"
    >
      {stats.map((stat) => {
        const value = data?.[stat.key];
        const StatIcon = resolveIcon(stat.icon);
        return (
          <div key={stat.key} className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              {StatIcon && (
                <StatIcon className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">
                {stat.label}
              </span>
            </div>
            <div
              className="mt-2 text-2xl font-bold"
              aria-live="polite"
              aria-atomic="true"
            >
              {formatValue(value, stat.format || 'number')}
            </div>
            {stat.trendValue && (
              <div
                className={cn(
                  'text-xs mt-1 flex items-center gap-1',
                  stat.trend === 'up' && 'text-success',
                  stat.trend === 'down' && 'text-destructive'
                )}
              >
                {stat.trend === 'up' && <span>↑</span>}
                {stat.trend === 'down' && <span>↓</span>}
                <span>{stat.trendValue}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

DashboardStats.displayName = 'DashboardStats';
