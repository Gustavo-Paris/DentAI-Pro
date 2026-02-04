/**
 * SkeletonItem Component
 *
 * Loading skeleton for PageList items.
 *
 * @package @pageshell/interactions
 */

'use client';

import { cn } from '@pageshell/core';
import { variantStyles } from '../constants';
import type { PageListVariant } from '../types';

// =============================================================================
// Component
// =============================================================================

export function SkeletonItem({ variant }: { variant: PageListVariant }) {
  const styles = variantStyles[variant];

  return (
    <div className={cn(styles.item, 'animate-pulse')} aria-hidden="true">
      <div className={cn('flex items-start', styles.content)}>
        {/* Icon/Avatar skeleton */}
        <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0" />

        {/* Content skeleton */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>

        {/* Timestamp skeleton */}
        <div className="h-3 bg-muted rounded w-12 flex-shrink-0" />
      </div>
    </div>
  );
}
