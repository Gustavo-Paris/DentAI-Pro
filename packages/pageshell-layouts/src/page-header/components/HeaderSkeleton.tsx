/**
 * HeaderSkeleton Component
 *
 * Loading skeleton for PageHeader.
 *
 * @package @pageshell/layouts
 */

'use client';

import { cn } from '@pageshell/core';
import { sizeConfig } from '../constants';
import type { PageHeaderSize } from '../types';

// =============================================================================
// Component
// =============================================================================

export function HeaderSkeleton({ size }: { size: PageHeaderSize }) {
  const config = sizeConfig[size];

  return (
    <div className="animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-4 bg-muted rounded w-16" />
        <div className="h-4 bg-muted rounded w-4" />
        <div className="h-4 bg-muted rounded w-24" />
      </div>

      {/* Title row skeleton */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className={cn('h-8 bg-muted rounded w-48', config.titleClass)} />
          <div className="h-4 bg-muted rounded w-64 max-w-full" />
        </div>
        <div className="h-10 bg-muted rounded w-28" />
      </div>
    </div>
  );
}
