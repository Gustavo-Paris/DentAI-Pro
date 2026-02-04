/**
 * LoadingState Primitive
 *
 * Standardized loading component for pages with:
 * - Different sizes (sm, md, lg, full)
 * - Custom messages
 * - Theme-aware styling via portal-* classes
 *
 * @module loading-state
 */

'use client';

import { cn } from '@pageshell/core';
import { resolveIcon } from '../icons';

// =============================================================================
// Types
// =============================================================================

export type LoadingSize = 'sm' | 'md' | 'lg' | 'full';

export interface LoadingStateProps {
  /** Size variant - affects container height and spinner size */
  size?: LoadingSize;
  /** Optional message to display below spinner */
  message?: string;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for automated testing */
  testId?: string;
}

export interface LoadingSkeletonProps {
  children: React.ReactNode;
  className?: string;
  /** Test ID for automated testing */
  testId?: string;
}

// =============================================================================
// Configuration
// =============================================================================

const sizeConfig: Record<LoadingSize, { container: string; spinner: string }> = {
  sm: {
    container: 'min-h-[200px]',
    spinner: 'h-5 w-5',
  },
  md: {
    container: 'min-h-[250px] sm:min-h-[300px] md:min-h-[400px]',
    spinner: 'h-6 w-6',
  },
  lg: {
    container: 'min-h-[60vh]',
    spinner: 'h-8 w-8',
  },
  full: {
    container: 'min-h-screen',
    spinner: 'h-8 w-8',
  },
};

// =============================================================================
// Components
// =============================================================================

/**
 * LoadingState - Standardized loading component
 *
 * @example Basic usage (full page):
 * <LoadingState />
 *
 * @example With message:
 * <LoadingState message="Loading course..." />
 *
 * @example Inline (smaller area):
 * <LoadingState size="md" message="Loading data..." />
 *
 * @example In loading.tsx file:
 * export default function Loading() {
 *   return <LoadingState message="Loading..." />;
 * }
 */
export function LoadingState({
  size = 'full',
  message,
  className,
  testId,
}: LoadingStateProps) {
  const config = sizeConfig[size];
  const LoaderIcon = resolveIcon('loader');

  return (
    <div
      data-testid={testId}
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        'portal-animate-in',
        config.container,
        className
      )}
      role="status"
      aria-busy="true"
      aria-label={message || 'Loading...'}
    >
      {LoaderIcon && (
        <LoaderIcon
          className={cn('animate-spin text-muted-foreground', config.spinner)}
          aria-hidden="true"
        />
      )}
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  );
}

/**
 * LoadingSkeleton - For content-specific loading skeletons
 *
 * Use when you need a custom skeleton layout.
 * This is a wrapper that provides consistent container styling.
 *
 * @example
 * <LoadingSkeleton>
 *   <div className="h-12 w-full animate-pulse rounded bg-muted" />
 *   <div className="h-64 w-full animate-pulse rounded bg-muted mt-4" />
 * </LoadingSkeleton>
 */
export function LoadingSkeleton({
  children,
  className,
  testId,
}: LoadingSkeletonProps) {
  return (
    <div
      data-testid={testId}
      className={cn('min-h-screen bg-background portal-animate-in', className)}
      role="status"
      aria-busy="true"
      aria-label="Loading content..."
    >
      {children}
    </div>
  );
}
