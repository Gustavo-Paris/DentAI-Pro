'use client';

/**
 * WizardSkeleton Component
 *
 * Loading skeleton for wizard pages.
 */

import { cn } from '@pageshell/core';
import { usePageShellContext } from '@pageshell/theme';

interface WizardSkeletonProps {
  /** Number of steps to show in progress indicator */
  steps?: number;
  /** Whether to show the progress bar */
  showProgress?: boolean;
  /** Number of content placeholder rows */
  contentRows?: number;
  /** Additional CSS classes */
  className?: string;
}

export function WizardSkeleton({
  steps = 4,
  showProgress = true,
  contentRows = 3,
  className,
}: WizardSkeletonProps) {
  const { theme } = usePageShellContext();

  // Theme-specific class prefixes
  const themePrefix = theme === 'student' ? 'dash' : theme;

  return (
    <div className={cn('space-y-6 animate-pulse', className)}>
      {/* Progress skeleton */}
      {showProgress && (
        <div className={`${themePrefix}-section-card`}>
          {/* Progress bar */}
          <div className="flex justify-between mb-3">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-4 w-16 bg-muted rounded" />
          </div>
          <div className="h-2 bg-muted rounded-full mb-6">
            <div className="h-2 w-1/3 bg-muted-foreground/20 rounded-full" />
          </div>

          {/* Step indicators */}
          <div className="flex justify-between gap-2">
            {Array.from({ length: steps }, (_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 bg-muted rounded-full" />
                <div className="h-3 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content skeleton */}
      <div className={`${themePrefix}-section-card space-y-4`}>
        {/* Title skeleton */}
        <div className="h-6 w-48 bg-muted rounded" />

        {/* Content rows */}
        {Array.from({ length: contentRows }, (_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-3/4 bg-muted rounded" />
          </div>
        ))}

        {/* Button skeleton */}
        <div className="h-10 w-32 bg-muted rounded mt-4" />
      </div>

      {/* Navigation skeleton */}
      <div className={`${themePrefix}-section-card flex justify-between p-4`}>
        <div className="h-10 w-24 bg-muted rounded" />
        <div className="h-10 w-28 bg-muted rounded" />
      </div>
    </div>
  );
}
