/**
 * Layout Skeleton Components
 *
 * Standardized loading skeletons for common UI patterns.
 *
 * @package @pageshell/primitives
 */

import * as React from 'react';
import { cn } from '@pageshell/core';
import { Skeleton } from '../skeleton';

// =============================================================================
// Base Types
// =============================================================================

export interface SkeletonBaseProps {
  className?: string;
}

// =============================================================================
// StatsSkeleton
// =============================================================================

export interface StatsSkeletonProps extends SkeletonBaseProps {
  count?: number;
}

/**
 * StatsSkeleton - Loading state for stats cards grid
 *
 * @example
 * ```tsx
 * <StatsSkeleton count={4} />
 * ```
 */
export function StatsSkeleton({ count = 4, className }: StatsSkeletonProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card p-6 space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// TableSkeleton
// =============================================================================

export interface TableSkeletonProps extends SkeletonBaseProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

/**
 * TableSkeleton - Loading state for data tables
 *
 * @example
 * ```tsx
 * <TableSkeleton rows={5} columns={4} showHeader />
 * ```
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("rounded-lg border border-border overflow-hidden", className)}>
      {showHeader && (
        <div className="flex items-center gap-4 px-4 py-3 bg-muted/30 border-b border-border">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1 max-w-32" />
          ))}
        </div>
      )}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-center gap-4 px-4 py-4"
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={cn(
                  "h-4 flex-1",
                  colIndex === 0 ? "max-w-48" : "max-w-24"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// FormSkeleton
// =============================================================================

export interface FormSkeletonProps extends SkeletonBaseProps {
  fields?: number;
  showButton?: boolean;
}

/**
 * FormSkeleton - Loading state for forms
 *
 * @example
 * ```tsx
 * <FormSkeleton fields={4} showButton />
 * ```
 */
export function FormSkeleton({
  fields = 4,
  showButton = true,
  className,
}: FormSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      {showButton && (
        <Skeleton className="h-10 w-32 rounded-md" />
      )}
    </div>
  );
}

// =============================================================================
// ChartSkeleton
// =============================================================================

export interface ChartSkeletonProps extends SkeletonBaseProps {
  type?: "bar" | "line" | "pie";
}

/**
 * ChartSkeleton - Loading state for charts
 *
 * @example
 * ```tsx
 * <ChartSkeleton type="bar" />
 * ```
 */
export function ChartSkeleton({
  type = "bar",
  className,
}: ChartSkeletonProps) {
  if (type === "pie") {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <Skeleton className="h-48 w-48 rounded-full" />
      </div>
    );
  }

  return (
    <div className={cn("p-4 space-y-4", className)}>
      {/* Chart header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      {/* Chart area */}
      <div className="h-64 flex items-end gap-2">
        {type === "bar" ? (
          // Bar chart
          Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-t-sm"
              style={{ height: `${Math.random() * 80 + 20}%` }}
            />
          ))
        ) : (
          // Line chart placeholder
          <div className="w-full h-full flex items-center justify-center">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// ListSkeleton
// =============================================================================

export interface ListSkeletonProps extends SkeletonBaseProps {
  items?: number;
  showAvatar?: boolean;
  showAction?: boolean;
}

/**
 * ListSkeleton - Loading state for list views
 *
 * @example
 * ```tsx
 * <ListSkeleton items={5} showAvatar showAction />
 * ```
 */
export function ListSkeleton({
  items = 5,
  showAvatar = true,
  showAction = false,
  className,
}: ListSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card"
        >
          {showAvatar && (
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          {showAction && (
            <Skeleton className="h-8 w-20 rounded-md shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// PageHeaderSkeleton
// =============================================================================

/**
 * PageHeaderSkeleton - Loading state for page headers
 *
 * @example
 * ```tsx
 * <PageHeaderSkeleton />
 * ```
 */
export function PageHeaderSkeleton({ className }: SkeletonBaseProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </div>
  );
}
