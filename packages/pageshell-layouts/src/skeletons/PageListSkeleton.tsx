'use client';

import type { ReactNode } from 'react';
import { Card, Skeleton, TableSkeleton } from '@pageshell/primitives';
import { usePageShellContextOptional } from '@pageshell/theme';
import { cn } from '@pageshell/core';
import { type SkeletonBaseProps, defaultAnimationConfig } from './types';

export interface PageListSkeletonProps extends SkeletonBaseProps {
  rows?: number;
  columns?: number;
  showFilters?: boolean;
  showStats?: boolean;
  /** Custom stats skeleton (replaces default) */
  statsSkeleton?: ReactNode;
  /** Custom filters skeleton (replaces default) */
  filtersSkeleton?: ReactNode;
  /** Custom table skeleton (replaces default) */
  tableSkeleton?: ReactNode;
}

/**
 * Default stats skeleton component
 */
function DefaultStatsSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-16" />
      </div>
      <Skeleton className="h-8 w-8 rounded" />
    </div>
  );
}

/**
 * Default filters skeleton component
 */
function DefaultFiltersSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-28" />
      </div>
    </div>
  );
}

/**
 * PageListSkeleton - Skeleton for ListPage composite
 *
 * Renders a complete skeleton with stats, filters, and table sections.
 * Use within PageShell context for proper animations.
 */
export function PageListSkeleton({
  rows = 10,
  columns = 6,
  showFilters = true,
  showStats = true,
  statsSkeleton,
  filtersSkeleton,
  tableSkeleton,
}: PageListSkeletonProps) {
  const context = usePageShellContextOptional();
  const config = context?.config ?? defaultAnimationConfig;

  return (
    <>
      {/* Stats Card Skeleton */}
      {showStats && (
        <Card className={cn('p-5', config.animate)}>
          {statsSkeleton ?? <DefaultStatsSkeleton />}
        </Card>
      )}

      {/* Filters Skeleton */}
      {showFilters && (
        <Card className={cn('p-5', config.animate, config.animateDelay(1))}>
          {filtersSkeleton ?? <DefaultFiltersSkeleton />}
        </Card>
      )}

      {/* Table Skeleton */}
      <div className={cn(config.animate, config.animateDelay(2))}>
        {tableSkeleton ?? <TableSkeleton rows={rows} columns={columns} />}
      </div>
    </>
  );
}

// Export sub-components for standalone use
PageListSkeleton.Stats = DefaultStatsSkeleton;
PageListSkeleton.Filters = DefaultFiltersSkeleton;

/**
 * @deprecated Use PageListSkeleton instead. This alias will be removed in a future version.
 */
export const ListSkeleton = PageListSkeleton;
