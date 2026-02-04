/**
 * SplitPanelPage Skeletons
 *
 * Loading skeletons for SplitPanelPage panels.
 *
 * @module split-panel/components/SplitPanelSkeletons
 */

'use client';

import * as React from 'react';
import { Skeleton } from '@pageshell/primitives';

// =============================================================================
// List Panel Skeleton
// =============================================================================

export interface ListPanelSkeletonProps {
  /** Number of skeleton rows */
  rows?: number;
}

export const ListPanelSkeleton = React.memo(function ListPanelSkeleton({
  rows = 5,
}: ListPanelSkeletonProps) {
  return (
    <div
      className="space-y-2 p-3"
      aria-busy="true"
      aria-label="Loading panel list"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg" aria-hidden="true">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            {/* Title - shimmer for data content */}
            <Skeleton animation="shimmer" className="h-4 w-3/4" />
            {/* Subtitle - shimmer for data content */}
            <Skeleton animation="shimmer" className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
});

ListPanelSkeleton.displayName = 'ListPanelSkeleton';

// =============================================================================
// Main Panel Skeleton
// =============================================================================

export const MainPanelSkeleton = React.memo(function MainPanelSkeleton() {
  return (
    <div
      className="flex flex-col h-full p-4 space-y-4"
      aria-busy="true"
      aria-label="Loading panel content"
    >
      <div className="flex items-center gap-3 pb-4 border-b border-border" aria-hidden="true">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          {/* Header text - shimmer for data */}
          <Skeleton animation="shimmer" className="h-4 w-32" />
          <Skeleton animation="shimmer" className="h-3 w-24" />
        </div>
      </div>
      <div className="flex-1 space-y-4" aria-hidden="true">
        {/* Message bubbles - shimmer for data content */}
        <div className="flex justify-start">
          <Skeleton animation="shimmer" className="h-16 w-3/4 rounded-lg" />
        </div>
        <div className="flex justify-end">
          <Skeleton animation="shimmer" className="h-12 w-2/3 rounded-lg" />
        </div>
        <div className="flex justify-start">
          <Skeleton animation="shimmer" className="h-20 w-4/5 rounded-lg" />
        </div>
      </div>
    </div>
  );
});

MainPanelSkeleton.displayName = 'MainPanelSkeleton';
