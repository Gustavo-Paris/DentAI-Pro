'use client';

import { Card, Skeleton } from '@pageshell/primitives';
import { usePageShellContextOptional } from '@pageshell/theme';
import { cn } from '@pageshell/core';
import { type SkeletonBaseProps, defaultAnimationConfig } from './types';

export interface DashboardSkeletonProps extends SkeletonBaseProps {
  // New API (page-shell style)
  statsCount?: number;
  modulesCount?: number;
  showStatusBar?: boolean;

  // Legacy API (from @repo/ui standalone)
  showStats?: boolean;
  showChart?: boolean;
  showTable?: boolean;
}

export function DashboardSkeleton({
  // New props
  statsCount,
  modulesCount = 4,
  showStatusBar = true,

  // Legacy props
  showStats = true,
  showChart = true,
  showTable = true,

  className,
}: DashboardSkeletonProps) {
  const context = usePageShellContextOptional();
  const config = context?.config ?? defaultAnimationConfig;

  // Resolve statsCount: explicit value takes precedence, otherwise derive from showStats
  const resolvedStatsCount = statsCount ?? (showStats ? 4 : 0);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Status Bar Skeleton */}
      {showStatusBar && (
        <Card className={cn('p-5', config.animate)}>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-8">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </Card>
      )}

      {/* Stats Grid Skeleton */}
      {resolvedStatsCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: resolvedStatsCount }).map((_, i) => (
            <Card key={i} className={cn('p-5', config.animate, config.animateDelay(i + 1))}>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </Card>
          ))}
        </div>
      )}

      {/* Chart Skeleton (legacy support) */}
      {showChart && (
        <Card className={cn('p-4', config.animate, config.animateDelay(2))}>
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
          <div className="h-64 flex items-end gap-2">
            {Array.from({ length: 12 }).map((_, i) => {
              const height = 20 + (i % 4) * 20;
              return (
                <Skeleton
                  key={i}
                  className="flex-1 rounded-t-sm"
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modules Grid Skeleton */}
      {modulesCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: modulesCount }).map((_, i) => (
            <Card key={i} className={cn('p-5', config.animate, config.animateDelay(Math.min(i + 1, 5)))}>
              <Skeleton className="h-10 w-10 rounded-lg mb-4" />
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-4 w-20" />
            </Card>
          ))}
        </div>
      )}

      {/* Table Skeleton (legacy support) */}
      {showTable && (
        <Card className={cn('overflow-hidden', config.animate, config.animateDelay(3))}>
          <div className="flex items-center gap-4 px-4 py-3 bg-muted/30 border-b border-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1 max-w-32" />
            ))}
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <div key={rowIndex} className="flex items-center gap-4 px-4 py-4">
                {Array.from({ length: 4 }).map((_, colIndex) => (
                  <Skeleton
                    key={colIndex}
                    className={cn('h-4 flex-1', colIndex === 0 ? 'max-w-48' : 'max-w-24')}
                  />
                ))}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
