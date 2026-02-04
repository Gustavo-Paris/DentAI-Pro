'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@pageshell/core';

/**
 * PageLoadingState - Standardized loading component for pages
 *
 * Provides consistent loading UI across all pages with support for:
 * - Different sizes (sm, md, lg, full)
 * - Custom messages
 * - Theme-aware styling
 *
 * @example Basic usage (full page):
 * <PageLoadingState />
 *
 * @example With message:
 * <PageLoadingState message="Loading course..." />
 *
 * @example Inline (smaller area):
 * <PageLoadingState size="md" message="Loading data..." />
 *
 * @example In loading.tsx file:
 * export default function Loading() {
 *   return <PageLoadingState message="Loading..." />;
 * }
 */

type LoadingSize = 'sm' | 'md' | 'lg' | 'full';

interface PageLoadingStateProps {
  /** Size variant - affects container height and spinner size */
  size?: LoadingSize;
  /** Optional message to display below spinner */
  message?: string;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for automated testing */
  testId?: string;
}

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

export function PageLoadingState({
  size = 'full',
  message,
  className,
  testId,
}: PageLoadingStateProps) {
  const config = sizeConfig[size];

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
      <Loader2
        className={cn(
          'animate-spin text-muted-foreground',
          config.spinner
        )}
        aria-hidden="true"
      />
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}

/**
 * PageLoadingSkeleton - For content-specific loading skeletons
 *
 * Use when you need a custom skeleton layout (like CourseLoading).
 * This is a wrapper that provides consistent container styling.
 *
 * @example
 * <PageLoadingSkeleton>
 *   <div className="h-12 w-full animate-pulse rounded bg-muted" />
 *   <div className="h-64 w-full animate-pulse rounded bg-muted mt-4" />
 * </PageLoadingSkeleton>
 */
interface PageLoadingSkeletonProps {
  children: React.ReactNode;
  className?: string;
  /** Test ID for automated testing */
  testId?: string;
}

export function PageLoadingSkeleton({
  children,
  className,
  testId,
}: PageLoadingSkeletonProps) {
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
