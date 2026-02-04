/**
 * SectionedFormSkeleton Component
 *
 * Loading skeleton for SectionedFormPage.
 *
 * @module sectioned-form/components/SectionedFormSkeleton
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { Skeleton } from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

export interface SectionedFormSkeletonProps {
  /** Number of sections to show */
  sections?: number;
  /** Fields per section */
  fieldsPerSection?: number;
  /** Show alert skeleton */
  showAlert?: boolean;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function SectionedFormSkeleton({
  sections = 2,
  fieldsPerSection = 3,
  showAlert = true,
  className,
}: SectionedFormSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Alert Skeleton */}
      {showAlert && (
        <Skeleton className="h-16 w-full rounded-lg" />
      )}

      {/* Section Skeletons */}
      {Array.from({ length: sections }).map((_, sectionIndex) => (
        <div
          key={sectionIndex}
          className="rounded-lg border border-border bg-card p-4 space-y-4"
        >
          {/* Section Header */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-5 w-5" />
          </div>

          {/* Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: fieldsPerSection }).map((_, fieldIndex) => (
              <div key={fieldIndex} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Footer Skeleton */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Skeleton className="h-10 w-24" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
