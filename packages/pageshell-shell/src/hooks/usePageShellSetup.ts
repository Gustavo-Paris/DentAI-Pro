/**
 * usePageShellSetup Hook
 *
 * Consolidates common setup logic used across PageShell variants.
 * Combines document title, scroll-to-top, container setup, and header action resolution.
 *
 * @module hooks/usePageShellSetup
 * @internal
 */

'use client';

import { useMemo, type ReactNode } from 'react';
import type { IconProp } from '@pageshell/primitives';
import { resolveHeaderAction } from '../lib/header-action';
import { useDocumentTitle } from './useDocumentTitle';
import { useScrollToTop } from './useScrollToTop';
import { useContainerSetup, type ContainerSetupConfig, type ContainerSetupResult } from './useContainerSetup';
import type { HeaderSectionProps } from '../components';
import type { PageBreadcrumb, PageHeaderMeta, PageHeaderSize, PageHeaderAlign, PageBadge, ActionConfig } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface PageShellSetupConfig extends ContainerSetupConfig {
  /** Document title override */
  documentTitle?: string;
  /** Scroll to top on mount */
  scrollToTop?: boolean;
  /** Single header action (button, element, or config) */
  headerAction?: ReactNode | ActionConfig | ActionConfig[];
  /** Multiple header actions */
  headerActions?: ActionConfig[];
}

export interface HeaderPropsConfig {
  title: string;
  description?: string;
  label?: string;
  badge?: PageBadge;
  headerIcon?: IconProp;
  headerMeta?: PageHeaderMeta[];
  headerSize?: PageHeaderSize;
  headerAlign?: PageHeaderAlign;
  stickyHeader?: boolean;
  headerDivider?: boolean;
  breadcrumbs?: PageBreadcrumb[];
  backHref?: string;
  backLabel?: string;
}

export interface PageShellSetupResult extends ContainerSetupResult {
  /** Resolved header action element */
  resolvedAction: React.ReactNode;
  /** Build HeaderSection props from config */
  buildHeaderProps: (config: HeaderPropsConfig) => Omit<HeaderSectionProps, 'children'>;
}

// =============================================================================
// Hook
// =============================================================================

export function usePageShellSetup(config: PageShellSetupConfig): PageShellSetupResult {
  const {
    documentTitle,
    scrollToTop = false,
    headerAction,
    headerActions,
    ...containerConfig
  } = config;

  // Document title effect
  useDocumentTitle(documentTitle);

  // Scroll to top effect
  useScrollToTop(scrollToTop);

  // Container setup (classes, refs, aria props)
  const containerSetup = useContainerSetup(containerConfig);

  // Resolve header action(s) - headerActions takes precedence
  const resolvedAction = useMemo(
    () => resolveHeaderAction(headerAction, headerActions),
    [headerAction, headerActions]
  );

  // Factory function to build HeaderSection props
  const buildHeaderProps = useMemo(() => {
    return (headerConfig: HeaderPropsConfig): Omit<HeaderSectionProps, 'children'> => ({
      className: containerSetup.headerAreaClasses,
      headerId: containerSetup.headerId,
      title: headerConfig.title,
      description: headerConfig.description,
      label: headerConfig.label,
      badge: headerConfig.badge,
      action: resolvedAction,
      icon: headerConfig.headerIcon,
      meta: headerConfig.headerMeta,
      size: headerConfig.headerSize,
      align: headerConfig.headerAlign,
      sticky: headerConfig.stickyHeader,
      divider: headerConfig.headerDivider,
      breadcrumbs: headerConfig.breadcrumbs,
      backHref: headerConfig.backHref,
      backLabel: headerConfig.backLabel,
    });
  }, [containerSetup.headerAreaClasses, containerSetup.headerId, resolvedAction]);

  return {
    ...containerSetup,
    resolvedAction,
    buildHeaderProps,
  };
}
