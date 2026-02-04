/**
 * DetailPageSkeleton Component
 *
 * Loading skeleton for DetailPage composite.
 * Thin wrapper around PresetSkeleton for backward compatibility.
 *
 * @module detail/components/DetailPageSkeleton
 */

'use client';

import * as React from 'react';
import { PresetSkeleton } from '../../shared/components';

// =============================================================================
// Types
// =============================================================================

export interface DetailPageSkeletonProps {
  /** Number of sections to render */
  sectionCount?: number;
  /** Additional CSS class */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * DetailPageSkeleton - Loading skeleton for DetailPage composite.
 *
 * @example
 * ```tsx
 * <DetailPageSkeleton sectionCount={3} />
 * ```
 */
export function DetailPageSkeleton({
  sectionCount = 2,
  className,
}: DetailPageSkeletonProps) {
  return (
    <PresetSkeleton
      preset="detailPage"
      sectionCount={sectionCount}
      className={className}
    />
  );
}

DetailPageSkeleton.displayName = 'DetailPageSkeleton';
