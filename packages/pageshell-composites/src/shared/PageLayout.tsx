/**
 * PageLayout - Shared layout wrapper for composites
 *
 * Provides consistent layout, loading/error states, and theme support.
 * Simpler alternative to PageShellCore for composites.
 *
 * @module shared/PageLayout
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { Skeleton, EmptyState } from '@pageshell/primitives';
import type { CompositeQueryResult } from './types';
import { GenericErrorState } from './components';

// =============================================================================
// Types
// =============================================================================

/**
 * Empty state configuration
 */
export interface EmptyStateConfig {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Container width variants - controls the max-width of the container
 * - 'default': max-w-7xl (1280px)
 * - 'narrow': max-w-4xl (896px)
 * - 'wide': max-w-[1400px]
 * - 'fullWidth': w-full (no constraint)
 */
export type ContainerWidthVariant = 'default' | 'narrow' | 'wide' | 'fullWidth';

/**
 * @deprecated Use `ContainerWidthVariant` instead. Will be removed in v1.0.
 */
export type ContainerVariant = ContainerWidthVariant;

/**
 * PageLayout props
 */
export interface PageLayoutProps<TData = unknown> {
  /** Theme variant */
  theme?: string;
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Additional CSS classes */
  className?: string;
  /** Query result for data fetching */
  query: CompositeQueryResult<TData>;
  /** Custom loading skeleton */
  skeleton?: React.ReactNode;
  /** Empty state check function */
  emptyCheck?: (data: TData) => boolean;
  /** Empty state configuration */
  emptyState?: EmptyStateConfig;
  /** Container width variant */
  containerVariant?: ContainerWidthVariant;
  /** Children render function (receives data) */
  children: (data: TData) => React.ReactNode;
}

// =============================================================================
// Constants
// =============================================================================

const containerClasses: Record<ContainerWidthVariant, string> = {
  default: 'max-w-7xl mx-auto',
  narrow: 'max-w-4xl mx-auto',
  wide: 'max-w-[1400px] mx-auto',
  fullWidth: 'w-full',
};

// =============================================================================
// Default Skeleton
// =============================================================================

function DefaultSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// PageLayout Component
// =============================================================================

/**
 * Shared layout wrapper for composites.
 *
 * Provides:
 * - Loading state with skeleton
 * - Error state with retry
 * - Empty state
 * - Consistent container styling
 * - Theme support via data-theme
 *
 * @example
 * ```tsx
 * <PageLayout
 *   theme="admin"
 *   title="Settings"
 *   query={settingsQuery}
 *   emptyCheck={(data) => data.length === 0}
 *   emptyState={{ title: 'No settings', description: 'Add settings to get started' }}
 * >
 *   {(data) => <SettingsContent data={data} />}
 * </PageLayout>
 * ```
 */
export function PageLayout<TData = unknown>({
  theme,
  title,
  description,
  className,
  query,
  skeleton,
  emptyCheck,
  emptyState,
  containerVariant = 'default',
  children,
}: PageLayoutProps<TData>) {
  const containerCn = cn(containerClasses[containerVariant], className);

  // Loading state
  if (query.isLoading) {
    return (
      <main className={containerCn} data-theme={theme} aria-busy="true">
        {skeleton ?? <DefaultSkeleton />}
      </main>
    );
  }

  // Error state
  if (query.isError || query.error) {
    return (
      <main className={containerCn} data-theme={theme}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <GenericErrorState error={query.error} onRetry={query.refetch} size="lg" />
      </main>
    );
  }

  // Empty state
  if (query.data && emptyCheck?.(query.data) && emptyState) {
    return (
      <main className={containerCn} data-theme={theme}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <EmptyState
          icon={emptyState.icon}
          title={emptyState.title}
          description={emptyState.description}
          action={emptyState.action}
        />
      </main>
    );
  }

  // No data
  if (!query.data) {
    return null;
  }

  // Success state
  return (
    <main className={containerCn} data-theme={theme}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children(query.data)}
    </main>
  );
}

PageLayout.displayName = 'PageLayout';
