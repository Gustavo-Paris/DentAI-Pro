'use client';

/**
 * CardGridSkeleton - Skeleton for card grid layouts
 *
 * Used by PageShell when skeletonVariant="cards" is specified.
 *
 * @example
 * <CardGridSkeleton count={6} columns={3} />
 */

import { Card, Skeleton } from '@pageshell/primitives';
import { usePageShellContextOptional } from '@pageshell/theme';
import { cn } from '@pageshell/core';
import { type SkeletonBaseProps, defaultAnimationConfig } from './types';

export interface CardGridSkeletonProps extends SkeletonBaseProps {
  /** Number of skeleton cards to show */
  count?: number;
  /** Number of columns (responsive) */
  columns?: 2 | 3 | 4;
  /** Show header skeleton */
  showHeader?: boolean;
  /** Show hero skeleton (for achievements/badges pages) */
  showHero?: boolean;
  /** Show stats bar skeleton */
  showStats?: boolean;
  /**
   * Show image placeholder in cards (aspect-video).
   * When true, uses a simpler card layout suitable for content cards.
   * @default false
   */
  showImage?: boolean;
}

const columnClasses = {
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

export function CardGridSkeleton({
  count = 6,
  columns = 3,
  showHeader = true,
  showHero = false,
  showStats = false,
  showImage = false,
}: CardGridSkeletonProps) {
  const context = usePageShellContextOptional();
  const config = context?.config ?? defaultAnimationConfig;

  return (
    <>
      {/* Header Skeleton */}
      {showHeader && (
        <div className={cn('space-y-2', config.animate)}>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      )}

      {/* Hero Skeleton (for gamification pages) */}
      {showHero && (
        <Card className={cn('p-6', config.animate, config.animateDelay(1))}>
          <div className="flex items-center justify-between">
            <div className="space-y-3 flex-1">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-80 max-w-full" />
              <div className="flex gap-4 mt-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-32 w-32 rounded-full" />
          </div>
        </Card>
      )}

      {/* Stats Bar Skeleton */}
      {showStats && (
        <Card className={cn('p-4', config.animate, config.animateDelay(showHero ? 2 : 1))}>
          <div className="flex items-center justify-between gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-8" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Card Grid Skeleton */}
      <div className={cn('grid gap-6', columnClasses[columns])}>
        {Array.from({ length: count }).map((_, i) => {
          const baseDelay = (showHero ? 2 : 0) + (showStats ? 1 : 0) + 1;

          // Simple card layout with image (for content cards like courses, testimonials)
          if (showImage) {
            return (
              <Card
                key={i}
                className={cn('overflow-hidden p-0', config.animate, config.animateDelay(Math.min(baseDelay + Math.floor(i / columns), 5)))}
              >
                <Skeleton className="aspect-video w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex items-center gap-2 pt-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </Card>
            );
          }

          // Default card layout (for badges, achievements, etc.)
          return (
            <Card
              key={i}
              className={cn('p-5', config.animate, config.animateDelay(Math.min(baseDelay + Math.floor(i / columns), 5)))}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              {/* Card Title */}
              <Skeleton className="h-5 w-32 mb-2" />
              {/* Card Description */}
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              {/* Card Footer */}
              <Skeleton className="h-3 w-24" />
            </Card>
          );
        })}
      </div>
    </>
  );
}
