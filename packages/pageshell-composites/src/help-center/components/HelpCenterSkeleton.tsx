/**
 * HelpCenterSkeleton Component
 *
 * Loading skeleton for HelpCenterPage.
 *
 * @module help-center/components/HelpCenterSkeleton
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { Skeleton } from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

export interface HelpCenterSkeletonProps {
  /** Show search skeleton */
  showSearch?: boolean;
  /** Number of quick links */
  quickLinksCount?: number;
  /** Number of FAQ sections */
  faqSectionsCount?: number;
  /** Number of articles */
  articlesCount?: number;
  /** Show contact banner */
  showContact?: boolean;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function HelpCenterSkeleton({
  showSearch = true,
  quickLinksCount = 6,
  faqSectionsCount = 4,
  articlesCount = 6,
  showContact = true,
  className,
}: HelpCenterSkeletonProps) {
  return (
    <div className={cn('space-y-8', className)}>
      {/* Hero Skeleton */}
      <div className="text-center space-y-4 py-8 bg-muted/30 rounded-xl">
        <Skeleton className="h-8 w-64 mx-auto" />
        <Skeleton className="h-5 w-96 mx-auto" />
      </div>

      {/* Search Skeleton */}
      {showSearch && (
        <div className="max-w-xl mx-auto">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      )}

      {/* Quick Links Skeleton */}
      {quickLinksCount > 0 && (
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: quickLinksCount }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </div>
      )}

      {/* Articles Skeleton */}
      {articlesCount > 0 && (
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: articlesCount }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </div>
      )}

      {/* FAQ Skeleton */}
      {faqSectionsCount > 0 && (
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: faqSectionsCount }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact Skeleton */}
      {showContact && (
        <Skeleton className="h-24 w-full rounded-xl" />
      )}
    </div>
  );
}
