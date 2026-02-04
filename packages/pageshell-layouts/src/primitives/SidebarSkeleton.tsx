/**
 * SidebarSkeleton - Loading skeleton for sidebar navigation
 *
 * Displays a loading state that matches the sidebar structure:
 * - Brand header skeleton
 * - Navigation items skeleton
 * - User profile skeleton
 *
 * @module primitives/SidebarSkeleton
 */

'use client';

import * as React from 'react';
import { Skeleton } from '@pageshell/primitives';
import { cn } from '@pageshell/core';

// =============================================================================
// Types
// =============================================================================

export interface SidebarSkeletonProps {
  /** Number of navigation sections to show */
  sectionsCount?: number;
  /** Number of items per section */
  itemsPerSection?: number;
  /** Show user profile skeleton */
  showUserProfile?: boolean;
  /** Additional CSS class */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Skeleton loading state for sidebar navigation.
 *
 * @example
 * ```tsx
 * // Default configuration
 * <SidebarSkeleton />
 *
 * // Custom configuration
 * <SidebarSkeleton
 *   sectionsCount={2}
 *   itemsPerSection={4}
 *   showUserProfile={true}
 * />
 * ```
 */
export function SidebarSkeleton({
  sectionsCount = 2,
  itemsPerSection = 4,
  showUserProfile = true,
  className,
}: SidebarSkeletonProps) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Brand Header Skeleton */}
      <div className="flex-shrink-0 p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>

      {/* Navigation Skeleton */}
      <div className="flex-1 overflow-hidden py-4 px-3">
        {Array.from({ length: sectionsCount }).map((_, sectionIndex) => (
          <div
            key={sectionIndex}
            className={cn(sectionIndex > 0 && 'mt-6')}
          >
            {/* Section label skeleton */}
            <div className="px-3 mb-3">
              <Skeleton className="h-3 w-16" />
            </div>

            {/* Navigation items skeleton */}
            <div className="space-y-1">
              {Array.from({ length: itemsPerSection }).map((_, itemIndex) => (
                <div
                  key={itemIndex}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                  style={{
                    animationDelay: `${(sectionIndex * itemsPerSection + itemIndex) * 50}ms`,
                  }}
                >
                  <Skeleton className="w-[18px] h-[18px] rounded" />
                  <Skeleton
                    className={cn(
                      'h-4',
                      // Vary widths for more natural look
                      itemIndex % 3 === 0 && 'w-24',
                      itemIndex % 3 === 1 && 'w-32',
                      itemIndex % 3 === 2 && 'w-20'
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* User Profile Skeleton */}
      {showUserProfile && (
        <div className="flex-shrink-0 border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/30">
            {/* Avatar skeleton */}
            <Skeleton className="w-9 h-9 rounded-full" />
            {/* User info skeleton */}
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            {/* Chevron skeleton */}
            <Skeleton className="w-4 h-4 rounded" />
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Nav Item Skeleton (for individual item loading)
// =============================================================================

export interface SidebarNavItemSkeletonProps {
  className?: string;
}

/**
 * Single navigation item skeleton.
 * Useful for lazy-loading individual items.
 */
export function SidebarNavItemSkeleton({ className }: SidebarNavItemSkeletonProps) {
  return (
    <div className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg', className)}>
      <Skeleton className="w-[18px] h-[18px] rounded" />
      <Skeleton className="h-4 w-28" />
    </div>
  );
}
