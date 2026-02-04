'use client';

/**
 * PageShellRoot - Main Query-Based Variant
 *
 * @module page-shell-core/PageShellRoot
 */

import { useMemo } from 'react';
import { cn } from '@pageshell/core/utils';
import { Button, Card, QueryError, EmptyState } from '@pageshell/primitives';
import { RefreshCw } from 'lucide-react';
import { PageQuickActions } from '@pageshell/layouts';
import { resolveErrorFallback, renderErrorFallback } from '../lib/error-fallback';
import { PageShellProvider, usePageShellContext } from '../context';
import { usePageShellSetup } from '../hooks';
import { HeaderSection, LoadingProgressBar } from '../components';
import { getSkeletonPreset } from '../skeletons';
import type { PageShellExtendedProps } from './types';

// =============================================================================
// Inner Component (uses context)
// =============================================================================

function PageShellRootInner<TData>({
  title,
  description,
  label,
  badge,
  headerAction,
  headerActions,
  query,
  skeleton,
  skeletonVariant,
  skeletonConfig,
  emptyCheck,
  emptyState,
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
  showRefresh = false,
  showProgressBar = false,
  padding = 'none',
  spacing = 'default',
  contentClassName,
  scrollToTop = false,
  // New header props
  headerIcon,
  headerMeta,
  headerSize,
  headerAlign,
  headerDivider,
  // Accessibility and testing
  ariaLabel,
  testId,
  // Error handling
  errorFallback,
}: Omit<PageShellExtendedProps<TData>, 'theme'>) {
  // Use context to get config (instead of calling getThemeConfig directly)
  const { config } = usePageShellContext();

  // Consolidated setup (document title, scroll, container, header action)
  const { mainProps, resolvedAction, buildHeaderProps } = usePageShellSetup({
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

  // Build header action with optional refresh button (memoized)
  const headerActionWithRefresh = useMemo(() => {
    if (!showRefresh || !query.refetch) return resolvedAction;

    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => query.refetch()}
          disabled={query.isLoading}
          aria-label="Refresh"
          className="h-8 w-8"
        >
          <RefreshCw
            className={cn('h-4 w-4', query.isLoading && 'animate-spin')}
          />
        </Button>
        {resolvedAction}
      </div>
    );
  }, [showRefresh, query.refetch, query.isLoading, resolvedAction]);

  // Build base header props
  const baseHeaderProps = buildHeaderProps({
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

  // Override action with refresh version
  const headerProps = { ...baseHeaderProps, action: headerActionWithRefresh };

  // Resolve skeleton: prefer custom skeleton, fallback to preset
  const resolvedSkeleton = skeleton ?? getSkeletonPreset(skeletonVariant, skeletonConfig);

  // Loading state
  if (query.isLoading) {
    return (
      <>
        {showProgressBar && <LoadingProgressBar isLoading />}
        <main {...mainProps} aria-busy="true">
          {resolvedSkeleton}
        </main>
      </>
    );
  }

  // Error state
  if (query.error) {
    const resolvedError = resolveErrorFallback(errorFallback);
    const errorContent = renderErrorFallback(
      resolvedError,
      query.error as Error,
      query.refetch,
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

  // Empty state
  if (query.data && emptyCheck?.(query.data) && emptyState) {
    return (
      <main {...mainProps}>
        <HeaderSection {...headerProps} />
        <div className={cn(config.animate, config.animateDelay(1))}>
          <EmptyState {...emptyState} />
        </div>
      </main>
    );
  }

  // Success state with data
  if (!query.data) {
    return null;
  }

  return (
    <main {...mainProps}>
      <HeaderSection {...headerProps} />
      {quickActions && quickActions.length > 0 && (
        <div className={cn(config.animate, config.animateDelay(1))}>
          <PageQuickActions actions={quickActions} />
        </div>
      )}
      <div className={cn('space-y-6', config.animate, config.animateDelay(2), contentClassName)}>
        {children(query.data)}
      </div>
    </main>
  );
}

// =============================================================================
// Outer Component (wraps with Provider)
// =============================================================================

export function PageShellRoot<TData>(props: PageShellExtendedProps<TData>) {
  const { theme = 'admin', ...innerProps } = props;

  return (
    <PageShellProvider theme={theme}>
      <PageShellRootInner {...innerProps} />
    </PageShellProvider>
  );
}
