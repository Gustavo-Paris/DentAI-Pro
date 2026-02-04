/**
 * AnalyticsPage Skeleton
 *
 * Loading skeleton for AnalyticsPage.
 *
 * @module analytics/components/AnalyticsSkeleton
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { Card, Skeleton } from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

export interface AnalyticsSkeletonProps {
  /** Number of KPI cards to show */
  kpiCount?: number;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export const AnalyticsSkeleton = React.memo(function AnalyticsSkeleton({
  kpiCount = 4,
  className,
}: AnalyticsSkeletonProps) {
  return (
    <div
      className={cn('space-y-6', className)}
      aria-busy="true"
      aria-label="Loading analytics data"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* KPIs */}
      <div
        className={cn(
          'grid gap-4',
          kpiCount === 2 && 'grid-cols-2',
          kpiCount === 3 && 'grid-cols-3',
          kpiCount >= 4 && 'grid-cols-2 md:grid-cols-4'
        )}
      >
        {Array.from({ length: kpiCount }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="p-6">
        <Skeleton className="h-5 w-32 mb-4" />
        <Skeleton className="h-64 w-full" />
      </Card>
    </div>
  );
});

AnalyticsSkeleton.displayName = 'AnalyticsSkeleton';
