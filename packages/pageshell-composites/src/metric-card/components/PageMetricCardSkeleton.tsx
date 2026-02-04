/**
 * PageMetricCardSkeleton Component
 *
 * Loading skeleton for PageMetricCard.
 *
 * @module metric-card/components/PageMetricCardSkeleton
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { Card, Skeleton } from '@pageshell/primitives';
import type { PageMetricCardSkeletonProps } from '../types';
import { sizeClasses } from '../constants';

export function PageMetricCardSkeleton({
  variant = 'card',
  size = 'md',
  showIcon = true,
  showTrend = false,
  showProgress = false,
  className,
}: PageMetricCardSkeletonProps) {
  const sizes = sizeClasses[size];

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1.5 animate-pulse',
          className
        )}
      >
        {showIcon && <Skeleton className="h-4 w-4 rounded" />}
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-3 w-8" />
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center justify-between py-2 animate-pulse', className)}>
        <div className="flex items-center gap-2">
          {showIcon && <Skeleton className="h-4 w-4 rounded" />}
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={cn('rounded-lg p-4 border border-border animate-pulse', className)}>
        <div className="flex items-center gap-3 mb-3">
          {showIcon && <Skeleton className="h-5 w-5 rounded" />}
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-16 mb-2" />
        <div className="space-y-2 mb-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-8" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
        {showProgress && <Skeleton className="h-2 w-full rounded-full" />}
      </div>
    );
  }

  // Card variant
  return (
    <Card className={cn(sizes.container, 'animate-pulse', className)}>
      <div className="flex items-center gap-2 mb-2">
        {showIcon && <Skeleton className={cn('rounded-lg', sizes.icon)} />}
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-7 w-20 mb-1" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-12" />
        {showTrend && <Skeleton className="h-4 w-16" />}
      </div>
    </Card>
  );
}

PageMetricCardSkeleton.displayName = 'PageMetricCardSkeleton';
