'use client';

/**
 * PageShellStatic - Static Variant (No Query)
 *
 * @module page-shell-core/PageShellStatic
 */

import { cn } from '@pageshell/core/utils';
import { PageQuickActions } from '@pageshell/layouts';
import { PageShellProvider, usePageShellContext } from '../context';
import { usePageShellSetup } from '../hooks';
import { HeaderSection } from '../components';
import type { PageShellStaticExtendedProps } from './types';

// =============================================================================
// Inner Component (uses context)
// =============================================================================

function PageShellStaticInner({
  title,
  description,
  label,
  badge,
  headerAction,
  headerActions,
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
  // New header props
  headerIcon,
  headerMeta,
  headerSize,
  headerAlign,
  headerDivider,
  // Accessibility and testing
  ariaLabel,
  testId,
}: Omit<PageShellStaticExtendedProps, 'theme'>) {
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

  return (
    <main {...mainProps}>
      <HeaderSection {...headerProps} />
      {quickActions && quickActions.length > 0 && (
        <div className={cn(config.animate, config.animateDelay(1))}>
          <PageQuickActions actions={quickActions} />
        </div>
      )}
      <div className={cn('space-y-6', config.animate, config.animateDelay(2), contentClassName)}>
        {children}
      </div>
    </main>
  );
}

// =============================================================================
// Outer Component (wraps with Provider)
// =============================================================================

export function PageShellStatic(props: PageShellStaticExtendedProps) {
  const { theme = 'admin', ...innerProps } = props;

  return (
    <PageShellProvider theme={theme}>
      <PageShellStaticInner {...innerProps} />
    </PageShellProvider>
  );
}
