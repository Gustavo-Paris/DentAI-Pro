'use client';

/**
 * PageShellMulti - Multi-Query Variant
 *
 * @module page-shell-core/PageShellMulti
 */

import { cn } from '@pageshell/core/utils';
import { Card, QueryError } from '@pageshell/primitives';
import { PageQuickActions } from '@pageshell/layouts';
import { resolveErrorFallback, renderErrorFallback } from '../lib/error-fallback';
import { PageShellProvider, usePageShellContext } from '../context';
import { usePageShellSetup } from '../hooks';
import { HeaderSection } from '../components';
import { getSkeletonPreset } from '../skeletons';
import type { QueryResult } from '../types';
import type { PageShellMultiExtendedProps } from './types';

// =============================================================================
// Inner Component (uses context)
// =============================================================================

function PageShellMultiInner<TQueries extends Record<string, QueryResult<unknown>>>({
  title,
  description,
  label,
  badge,
  headerAction,
  headerActions,
  queries,
  skeleton,
  skeletonVariant,
  skeletonConfig,
  quickActions,
  children,
  className,
  // Extended props
  breadcrumbs,
  backHref,
  backLabel,
  stickyHeader = false,
  containerVariant = 'default',
  documentTitle,
  padding = 'none',
  spacing = 'default',
  contentClassName,
  scrollToTop = false,
  headerIcon,
  headerMeta,
  headerSize,
  headerAlign,
  headerDivider,
  ariaLabel,
  testId,
  // Error handling
  errorFallback,
}: Omit<PageShellMultiExtendedProps<TQueries>, 'theme'>) {
  const { config } = usePageShellContext();

  // Consolidated setup (document title, scroll, container, header action)
  const { mainProps, buildHeaderProps } = usePageShellSetup({
    containerVariant,
    padding,
    spacing,
    className,
    ariaLabel,
    testId,
    documentTitle,
    scrollToTop,
    headerAction,
    headerActions,
  });

  // Build header props
  const headerProps = buildHeaderProps({
    title,
    description,
    label,
    badge,
    headerIcon,
    headerMeta,
    headerSize,
    headerAlign,
    stickyHeader,
    headerDivider,
    breadcrumbs,
    backHref,
    backLabel,
  });

  // Check if any query is loading
  const isLoading = Object.values(queries).some((q) => q.isLoading);

  // Find first error
  const errorEntry = Object.entries(queries).find(([, q]) => q.error);
  const error = errorEntry ? errorEntry[1].error : null;
  const errorRefetch = errorEntry ? errorEntry[1].refetch : undefined;

  // Resolve skeleton: prefer custom skeleton, fallback to preset
  const resolvedSkeleton = skeleton ?? getSkeletonPreset(skeletonVariant, skeletonConfig);

  // Loading state
  if (isLoading) {
    return (
      <main {...mainProps} aria-busy="true">
        {resolvedSkeleton}
      </main>
    );
  }

  // Error state
  if (error) {
    const resolvedError = resolveErrorFallback(errorFallback);
    const errorContent = renderErrorFallback(
      resolvedError,
      error as Error,
      errorRefetch,
      (err, retry) => <QueryError error={err} retry={retry} />
    );

    return (
      <main {...mainProps}>
        <HeaderSection {...headerProps} />
        <Card className={cn('p-5', config.animate, config.animateDelay(1))}>
          {errorContent}
        </Card>
      </main>
    );
  }

  // Extract all data
  const data = Object.fromEntries(
    Object.entries(queries).map(([key, q]) => [key, q.data])
  ) as { [K in keyof TQueries]: NonNullable<TQueries[K]['data']> };

  return (
    <main {...mainProps}>
      <HeaderSection {...headerProps} />
      {quickActions && quickActions.length > 0 && (
        <div className={cn(config.animate, config.animateDelay(1))}>
          <PageQuickActions actions={quickActions} />
        </div>
      )}
      <div className={cn('space-y-6', config.animate, config.animateDelay(2), contentClassName)}>
        {children(data)}
      </div>
    </main>
  );
}

// =============================================================================
// Outer Component (wraps with Provider)
// =============================================================================

export function PageShellMulti<TQueries extends Record<string, QueryResult<unknown>>>(
  props: PageShellMultiExtendedProps<TQueries>
) {
  const { theme = 'admin', ...innerProps } = props;

  return (
    <PageShellProvider theme={theme}>
      <PageShellMultiInner {...innerProps} />
    </PageShellProvider>
  );
}
