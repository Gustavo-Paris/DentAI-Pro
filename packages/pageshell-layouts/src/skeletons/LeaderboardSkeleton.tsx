'use client';

/**
 * PageLeaderboardSkeleton - Declarative skeleton for leaderboard pages
 *
 * Provides a loading skeleton that matches the PageLeaderboardRow layout.
 * Supports both standalone use (with portal-animate classes) and within
 * PageShell context (with staggered animations).
 *
 * @example Basic usage
 * ```tsx
 * <PageLeaderboardSkeleton />
 * ```
 *
 * @example Customized
 * ```tsx
 * <PageLeaderboardSkeleton
 *   statsCount={4}
 *   rows={10}
 *   showHeader
 * />
 * ```
 */

import { cn } from '@pageshell/core';
import { usePageShellContextOptional } from '@pageshell/theme';
import { type SkeletonBaseProps, type SkeletonAnimationConfig } from './types';

/**
 * Default animation config for use outside PageShell context.
 * Uses portal-animate classes for consistent animation.
 */
const defaultLeaderboardConfig: SkeletonAnimationConfig = {
  animate: 'portal-animate-in',
  animateDelay: (n: number) => `portal-animate-in-delay-${n}`,
};

export interface PageLeaderboardSkeletonProps extends SkeletonBaseProps {
  /** Number of stats items to show (default: 3) */
  statsCount?: number;
  /** Number of leaderboard rows to show (default: 5) */
  rows?: number;
  /** Show header skeleton (default: true) */
  showHeader?: boolean;
  /** Show info panel skeleton at bottom (default: false) */
  showInfoPanel?: boolean;
}

export function PageLeaderboardSkeleton({
  statsCount = 3,
  rows = 5,
  showHeader = true,
  showInfoPanel = false,
}: PageLeaderboardSkeletonProps) {
  const context = usePageShellContextOptional();
  const config = context?.config ?? defaultLeaderboardConfig;

  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      {showHeader && (
        <div className={config.animate}>
          <div className="h-8 w-64 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-96 bg-muted/60 rounded animate-pulse" />
        </div>
      )}

      {/* Stats Bar Skeleton */}
      <div className={cn('portal-live-stats-bar', config.animate, config.animateDelay(1))}>
        {Array.from({ length: statsCount }).map((_, i) => (
          <div key={i} className="portal-live-stats-item">
            <div className="h-8 w-12 bg-muted rounded animate-pulse" />
            <div className="h-3 w-16 bg-muted/60 rounded animate-pulse mt-1" />
          </div>
        ))}
      </div>

      {/* Leaderboard List Skeleton */}
      <div className={cn('portal-card p-4 space-y-3', config.animate, config.animateDelay(2))}>
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-muted rounded animate-pulse" />
            <div className="h-5 w-28 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-4 w-24 bg-muted/60 rounded animate-pulse" />
        </div>

        {/* Leaderboard rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="portal-leaderboard-row animate-pulse"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {/* Rank */}
            <div className="w-12 h-8 bg-muted rounded" />

            {/* User info */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-muted rounded-full" />
              <div className="space-y-1.5">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-3 w-16 bg-muted/60 rounded" />
              </div>
            </div>

            {/* Badge breakdown (hidden on mobile) */}
            <div className="hidden md:flex items-center gap-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="text-center">
                  <div className="w-6 h-6 bg-muted rounded mx-auto" />
                  <div className="h-3 w-4 bg-muted/60 rounded mx-auto mt-1" />
                </div>
              ))}
            </div>

            {/* Score */}
            <div className="w-16 h-8 bg-muted rounded-full" />
          </div>
        ))}

        {/* Pagination skeleton */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
          <div className="h-4 w-32 bg-muted/60 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-9 w-9 bg-muted rounded animate-pulse" />
            <div className="h-9 w-9 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Info Panel Skeleton */}
      {showInfoPanel && (
        <div className={cn('portal-card p-4', config.animate, config.animateDelay(3))}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-muted rounded animate-pulse" />
            <div className="h-5 w-48 bg-muted rounded animate-pulse" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 bg-muted/30 rounded-lg">
                <div className="h-4 w-24 bg-muted rounded animate-pulse mb-1" />
                <div className="h-3 w-full bg-muted/60 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
