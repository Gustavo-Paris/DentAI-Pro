/**
 * LinearFlowPage Skeleton
 *
 * Loading skeleton for LinearFlowPage.
 *
 * @module linear-flow/components/LinearFlowSkeleton
 */

'use client';

import * as React from 'react';
import { Card, Skeleton } from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

export interface LinearFlowSkeletonProps {
  /** Number of steps to show in skeleton */
  stepCount?: number;
}

// =============================================================================
// Component
// =============================================================================

export const LinearFlowSkeleton = React.memo(function LinearFlowSkeleton({
  stepCount = 4,
}: LinearFlowSkeletonProps) {
  return (
    <div
      className="space-y-8"
      aria-busy="true"
      aria-label="Loading flow"
    >
      {/* Header */}
      <div className="flex items-center gap-4" aria-hidden="true">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-6 w-px" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between" aria-hidden="true">
        {Array.from({ length: stepCount }).map((_, i) => (
          <React.Fragment key={i}>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            {i < stepCount - 1 && <Skeleton className="h-0.5 flex-1 mx-4" />}
          </React.Fragment>
        ))}
      </div>

      {/* Content - shimmer for data content */}
      <Card className="p-6" aria-hidden="true">
        <div className="space-y-4">
          <Skeleton animation="shimmer" className="h-6 w-48" />
          <Skeleton animation="shimmer" className="h-4 w-full" />
          <Skeleton animation="shimmer" className="h-4 w-3/4" />
          <Skeleton animation="shimmer" className="h-32 w-full" />
        </div>
      </Card>

      {/* Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-border" aria-hidden="true">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
});

LinearFlowSkeleton.displayName = 'LinearFlowSkeleton';
