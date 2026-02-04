/**
 * ProgressiveExtractionPage Skeletons
 *
 * Skeleton components for ProgressiveExtractionPage loading states.
 *
 * @module progressive-extraction/components/ProgressiveExtractionSkeletons
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { Card, Skeleton } from '@pageshell/primitives';

// =============================================================================
// Field Skeleton
// =============================================================================

export interface FieldSkeletonProps {
  /** Skeleton size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const heights: Record<string, string> = {
  sm: 'h-6',
  md: 'h-16',
  lg: 'h-24',
  xl: 'h-32',
};

export const FieldSkeleton = React.memo(function FieldSkeleton({
  size = 'md',
}: FieldSkeletonProps) {
  return <Skeleton className={cn('w-full', heights[size])} />;
});

FieldSkeleton.displayName = 'FieldSkeleton';

// =============================================================================
// Tags Skeleton
// =============================================================================

export const TagsSkeleton = React.memo(function TagsSkeleton() {
  return (
    <div className="flex gap-2">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-6 w-24" />
    </div>
  );
});

TagsSkeleton.displayName = 'TagsSkeleton';

// =============================================================================
// Loading Skeleton
// =============================================================================

export const LoadingSkeleton = React.memo(function LoadingSkeleton() {
  return (
    <div
      className="max-w-2xl mx-auto space-y-6"
      aria-busy="true"
      aria-label="Loading extraction"
    >
      {/* Header */}
      <div className="flex items-center gap-4" aria-hidden="true">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-6 w-px" />
        <Skeleton className="h-6 w-48" />
      </div>

      {/* Content - shimmer for data */}
      <Card className="p-6" aria-hidden="true">
        <div className="space-y-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton animation="shimmer" className="h-64 w-full" />
          <Skeleton animation="shimmer" className="h-4 w-48" />
        </div>
      </Card>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border" aria-hidden="true">
        <Skeleton className="h-11 w-24" />
        <Skeleton className="h-11 w-32" />
      </div>
    </div>
  );
});

LoadingSkeleton.displayName = 'LoadingSkeleton';
