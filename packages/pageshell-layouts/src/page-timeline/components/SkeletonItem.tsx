/**
 * SkeletonItem Component
 *
 * Skeleton item for PageTimeline loading state.
 *
 * @package @pageshell/layouts
 */

'use client';

import { cn } from '@pageshell/core';
import { variantStyles } from '../constants';
import type { PageTimelineVariant } from '../types';

// =============================================================================
// Component
// =============================================================================

export function SkeletonItem({ variant }: { variant: PageTimelineVariant }) {
  return (
    <div className={cn('relative', variantStyles[variant].item)}>
      {/* Icon skeleton */}
      <div className="absolute -left-8 w-6 h-6 rounded-full bg-muted animate-pulse" />

      {/* Content skeleton */}
      <div className="ml-2 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
          <div className="h-3 bg-muted rounded w-16 animate-pulse" />
        </div>
        <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
      </div>
    </div>
  );
}
