'use client';

/**
 * LinearFlowSkeleton Component
 *
 * Loading skeleton for linear flow pages with step progress indicator.
 * Supports both standalone use (with basic animation) and within PageShell
 * context (with staggered animations).
 *
 * @example Basic usage
 * ```tsx
 * <LinearFlowSkeleton stepCount={5} />
 * ```
 */

import { cn } from '@pageshell/core';
import { usePageShellContextOptional } from '@pageshell/theme';
import { type SkeletonBaseProps, defaultAnimationConfig } from './types';

export interface LinearFlowSkeletonProps extends SkeletonBaseProps {
  /** Number of steps to show in progress indicator */
  stepCount?: number;
  /** Whether to show step progress bar */
  showSteps?: boolean;
  /** Whether to show footer navigation */
  showFooter?: boolean;
  /** Number of content placeholder sections */
  contentSections?: number;
  /** Additional CSS classes */
  className?: string;
}

export function LinearFlowSkeleton({
  stepCount = 5,
  showSteps = true,
  showFooter = true,
  contentSections = 2,
  className,
}: LinearFlowSkeletonProps) {
  const context = usePageShellContextOptional();
  const config = context?.config ?? defaultAnimationConfig;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Step Progress Skeleton */}
      {showSteps && (
        <div className={cn('sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border py-4', config.animate)}>
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: stepCount }, (_, i) => (
              <div key={i} className="flex items-center gap-2">
                {/* Step circle */}
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 bg-muted rounded-full" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
                {/* Connector (except last) */}
                {i < stepCount - 1 && (
                  <div className="h-0.5 w-8 md:w-12 lg:w-16 bg-muted" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Sections Skeleton */}
      {Array.from({ length: contentSections }, (_, i) => (
        <div key={i} className={cn('rounded-lg border border-border bg-card p-6 space-y-4', config.animate, config.animateDelay(i + 1))}>
          {/* Section title */}
          <div className="h-6 w-48 bg-muted rounded" />

          {/* Section content rows */}
          <div className="space-y-3">
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-5/6 bg-muted rounded" />
            <div className="h-4 w-4/6 bg-muted rounded" />
          </div>

          {/* Form-like elements */}
          <div className="grid gap-4 pt-2">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-10 w-full bg-muted rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-10 w-full bg-muted rounded" />
            </div>
          </div>
        </div>
      ))}

      {/* Footer Navigation Skeleton */}
      {showFooter && (
        <div className={cn('flex items-center justify-between pt-6 border-t border-border', config.animate, config.animateDelay(contentSections + 1))}>
          <div className="h-10 w-24 bg-muted rounded" />
          <div className="h-10 w-28 bg-muted rounded" />
        </div>
      )}
    </div>
  );
}

LinearFlowSkeleton.displayName = 'LinearFlowSkeleton';
