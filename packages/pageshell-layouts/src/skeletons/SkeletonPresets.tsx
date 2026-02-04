'use client';

/**
 * SkeletonPresets - Maps skeleton variants to components
 *
 * Used by PageShell to render appropriate skeleton based on `skeletonVariant` prop.
 *
 * @example
 * // In PageShell
 * <PageShell
 *   skeletonVariant="cards"
 *   skeletonConfig={{ count: 6, showHero: true }}
 * >
 *
 * @example
 * // Direct usage
 * <SkeletonPreset variant="list" config={{ rows: 10 }} />
 */

import type { ReactNode } from 'react';
import { Card, Skeleton } from '@pageshell/primitives';
import { usePageShellContextOptional } from '@pageshell/theme';
import { cn } from '@pageshell/core';
import { DashboardSkeleton, type DashboardSkeletonProps } from './DashboardSkeleton';
import { PageListSkeleton, type PageListSkeletonProps } from './PageListSkeleton';
import { CardGridSkeleton, type CardGridSkeletonProps } from './CardGridSkeleton';
import { LinearFlowSkeleton, type LinearFlowSkeletonProps } from './LinearFlowSkeleton';
import { PageLeaderboardSkeleton, type PageLeaderboardSkeletonProps } from './LeaderboardSkeleton';
import { type SkeletonVariant, type SkeletonBaseProps, defaultAnimationConfig } from './types';

// =============================================================================
// Config Types (derived from component Props - single source of truth)
// =============================================================================

/** Config for dashboard skeleton - derived from DashboardSkeletonProps */
export type DashboardSkeletonConfig = Omit<DashboardSkeletonProps, keyof SkeletonBaseProps>;

/** Config for list skeleton - derived from PageListSkeletonProps */
export type ListSkeletonConfig = Omit<PageListSkeletonProps, keyof SkeletonBaseProps | 'statsSkeleton' | 'filtersSkeleton' | 'tableSkeleton'>;

/** Config for card grid skeleton - derived from CardGridSkeletonProps */
export type CardGridSkeletonConfig = Omit<CardGridSkeletonProps, keyof SkeletonBaseProps>;

/** Config for linear flow skeleton - derived from LinearFlowSkeletonProps */
export type LinearFlowSkeletonConfig = Omit<LinearFlowSkeletonProps, keyof SkeletonBaseProps>;

/** Config for leaderboard skeleton - derived from PageLeaderboardSkeletonProps */
export type LeaderboardSkeletonConfig = Omit<PageLeaderboardSkeletonProps, keyof SkeletonBaseProps>;

/** Config for detail skeleton (inline component) */
export interface DetailSkeletonConfig {
  sectionsCount?: number;
  showTabs?: boolean;
}

/** Config for form skeleton (inline component) */
export interface FormSkeletonConfig {
  fieldsCount?: number;
}

/** Union of all skeleton config types */
export type SkeletonConfig =
  | DashboardSkeletonConfig
  | ListSkeletonConfig
  | CardGridSkeletonConfig
  | DetailSkeletonConfig
  | FormSkeletonConfig
  | LinearFlowSkeletonConfig
  | LeaderboardSkeletonConfig;

// Re-export SkeletonVariant from types.ts
export type { SkeletonVariant } from './types';

// =============================================================================
// Skeleton Preset Component
// =============================================================================

interface SkeletonPresetProps {
  variant: SkeletonVariant;
  config?: SkeletonConfig;
}

export function SkeletonPreset({ variant, config = {} }: SkeletonPresetProps): ReactNode {
  switch (variant) {
    case 'dashboard':
      return <DashboardSkeleton {...(config as DashboardSkeletonConfig)} />;

    case 'list':
      return <PageListSkeleton {...(config as ListSkeletonConfig)} />;

    case 'cards':
      return <CardGridSkeleton {...(config as CardGridSkeletonConfig)} />;

    case 'detail':
      return <DetailSkeletonContent {...(config as DetailSkeletonConfig)} />;

    case 'form':
      return <FormSkeletonContent {...(config as FormSkeletonConfig)} />;

    case 'linearFlow':
      return <LinearFlowSkeleton {...(config as LinearFlowSkeletonConfig)} />;

    case 'leaderboard':
      return <PageLeaderboardSkeleton {...(config as LeaderboardSkeletonConfig)} />;

    default:
      return null;
  }
}

// =============================================================================
// Detail Skeleton (inline - for detail pages with sections)
// =============================================================================

function DetailSkeletonContent({
  sectionsCount = 3,
  showTabs = false,
}: DetailSkeletonConfig) {
  const context = usePageShellContextOptional();
  const config = context?.config ?? defaultAnimationConfig;

  return (
    <>
      {/* Header with back button */}
      <div className={cn('space-y-4', config.animate)}>
        <Skeleton className="h-4 w-20" />
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Tabs skeleton */}
      {showTabs && (
        <div className={cn('flex gap-4 border-b border-border pb-2', config.animate, config.animateDelay(1))}>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      )}

      {/* Sections */}
      {Array.from({ length: sectionsCount }).map((_, i) => (
        <Card key={i} className={cn('p-5', config.animate, config.animateDelay(i + 2))}>
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </Card>
      ))}
    </>
  );
}

// =============================================================================
// Form Skeleton (inline - for form pages)
// =============================================================================

function FormSkeletonContent({
  fieldsCount = 6,
}: FormSkeletonConfig) {
  const context = usePageShellContextOptional();
  const config = context?.config ?? defaultAnimationConfig;

  return (
    <Card className={cn('p-6', config.animate)}>
      <div className="space-y-6">
        {Array.from({ length: fieldsCount }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </Card>
  );
}

// =============================================================================
// Export helper to get skeleton element
// =============================================================================

export function getSkeletonPreset(
  variant?: SkeletonVariant,
  config?: SkeletonConfig
): ReactNode | undefined {
  if (!variant) return undefined;
  return <SkeletonPreset variant={variant} config={config} />;
}
