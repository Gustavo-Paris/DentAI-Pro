/**
 * TabbedListPage Skeleton
 *
 * Loading skeleton for TabbedListPage.
 * Thin wrapper around PresetSkeleton for backward compatibility.
 *
 * @module tabbed-list/components/TabbedListSkeleton
 */

'use client';

import * as React from 'react';
import { PresetSkeleton } from '../../shared/components';

// =============================================================================
// Types
// =============================================================================

export interface TabbedListSkeletonProps {
  /** Number of tabs */
  tabCount?: number;
  /** Number of list items */
  itemCount?: number;
  /** Additional CSS class */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * TabbedListSkeleton - Loading skeleton for TabbedListPage composite.
 *
 * @example
 * ```tsx
 * <TabbedListSkeleton tabCount={3} itemCount={5} />
 * ```
 */
export const TabbedListSkeleton = React.memo(function TabbedListSkeleton({
  tabCount = 3,
  itemCount = 5,
  className,
}: TabbedListSkeletonProps = {}) {
  return (
    <PresetSkeleton
      preset="tabbedList"
      tabCount={tabCount}
      itemCount={itemCount}
      className={className}
    />
  );
});

TabbedListSkeleton.displayName = 'TabbedListSkeleton';
