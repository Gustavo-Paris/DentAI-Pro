/**
 * PageShellCore Extended Props Types
 *
 * @module page-shell-core/types
 */

import type { ReactNode } from 'react';
import type { IconProp } from '@pageshell/primitives';
import type { ContainerVariant, PaddingVariant, SpacingVariant } from '../lib/class-maps';
import type {
  PageShellProps,
  PageShellStaticProps,
  PageShellMultiProps,
  PageShellErrorFallbackConfig,
  QueryResult,
  PageBreadcrumb,
  PageHeaderMeta,
  PageHeaderSize,
  PageHeaderAlign,
} from '../types';
import type { SkeletonVariant, SkeletonConfig } from '../skeletons';

// =============================================================================
// Extended Props for Root Variant
// =============================================================================

export interface PageShellExtendedProps<TData> extends Omit<PageShellProps<TData>, 'className' | 'errorFallback' | 'skeleton' | 'skeletonVariant' | 'skeletonConfig'> {
  /** Loading skeleton component (custom). Optional if using skeletonVariant. */
  skeleton?: ReactNode;
  /** Skeleton preset variant - uses built-in skeleton components */
  skeletonVariant?: SkeletonVariant;
  /** Configuration for skeleton preset */
  skeletonConfig?: SkeletonConfig;
  /** Breadcrumb navigation */
  breadcrumbs?: PageBreadcrumb[];
  /** Back navigation href */
  backHref?: string;
  /** Back button label */
  backLabel?: string;
  /** Make header sticky on scroll */
  stickyHeader?: boolean;
  /** Container width variant */
  containerVariant?: ContainerVariant;
  /** Document title (sets browser tab title) */
  documentTitle?: string;
  /** Show refresh button in header */
  showRefresh?: boolean;
  /** Show loading progress bar */
  showProgressBar?: boolean;
  /** Padding variant */
  padding?: PaddingVariant;
  /** Vertical spacing between sections: compact (12px), default (16px), relaxed (24px) */
  spacing?: SpacingVariant;
  /** Additional container CSS classes */
  className?: string;
  /** Additional content area CSS classes */
  contentClassName?: string;
  /** Scroll to top on mount */
  scrollToTop?: boolean;
  /** Header icon */
  headerIcon?: IconProp;
  /** Header meta information */
  headerMeta?: PageHeaderMeta[];
  /** Header size variant */
  headerSize?: PageHeaderSize;
  /** Header alignment */
  headerAlign?: PageHeaderAlign;
  /** Show header divider */
  headerDivider?: boolean;
  /** Accessible label for the page (recommended for screen readers) */
  ariaLabel?: string;
  /** Test ID for automated testing */
  testId?: string;
  /** Custom error fallback - replaces default QueryError */
  errorFallback?: ReactNode | PageShellErrorFallbackConfig;
}

// =============================================================================
// Extended Props for Static Variant
// =============================================================================

export interface PageShellStaticExtendedProps extends Omit<PageShellStaticProps, 'className'> {
  /** Breadcrumb navigation */
  breadcrumbs?: PageBreadcrumb[];
  /** Back navigation href */
  backHref?: string;
  /** Back button label */
  backLabel?: string;
  /** Make header sticky on scroll */
  stickyHeader?: boolean;
  /** Container width variant */
  containerVariant?: ContainerVariant;
  /** Document title (sets browser tab title) */
  documentTitle?: string;
  /** Padding variant */
  padding?: PaddingVariant;
  /** Vertical spacing between sections: compact (12px), default (16px), relaxed (24px) */
  spacing?: SpacingVariant;
  /** Additional container CSS classes */
  className?: string;
  /** Additional content area CSS classes */
  contentClassName?: string;
  /** Scroll to top on mount */
  scrollToTop?: boolean;
  /** Header icon */
  headerIcon?: IconProp;
  /** Header meta information */
  headerMeta?: PageHeaderMeta[];
  /** Header size variant */
  headerSize?: PageHeaderSize;
  /** Header alignment */
  headerAlign?: PageHeaderAlign;
  /** Show header divider */
  headerDivider?: boolean;
  /** Accessible label for the page (recommended for screen readers) */
  ariaLabel?: string;
  /** Test ID for automated testing */
  testId?: string;
}

// =============================================================================
// Extended Props for Multi-Query Variant
// =============================================================================

export interface PageShellMultiExtendedProps<TQueries extends Record<string, QueryResult<unknown>>>
  extends Omit<PageShellMultiProps<TQueries>, 'errorFallback' | 'skeleton' | 'skeletonVariant' | 'skeletonConfig'> {
  /** Loading skeleton component (custom). Optional if using skeletonVariant. */
  skeleton?: ReactNode;
  /** Skeleton preset variant - uses built-in skeleton components */
  skeletonVariant?: SkeletonVariant;
  /** Configuration for skeleton preset */
  skeletonConfig?: SkeletonConfig;
  /** Breadcrumb navigation */
  breadcrumbs?: PageBreadcrumb[];
  /** Back navigation href */
  backHref?: string;
  /** Back button label */
  backLabel?: string;
  /** Make header sticky on scroll */
  stickyHeader?: boolean;
  /** Container width variant */
  containerVariant?: ContainerVariant;
  /** Document title (sets browser tab title) */
  documentTitle?: string;
  /** Padding variant */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Vertical spacing between sections */
  spacing?: 'compact' | 'default' | 'relaxed';
  /** Additional content area CSS classes */
  contentClassName?: string;
  /** Scroll to top on mount */
  scrollToTop?: boolean;
  /** Header icon */
  headerIcon?: IconProp;
  /** Header meta information */
  headerMeta?: PageHeaderMeta[];
  /** Header size variant */
  headerSize?: PageHeaderSize;
  /** Header alignment */
  headerAlign?: PageHeaderAlign;
  /** Show header divider */
  headerDivider?: boolean;
  /** Accessible label for the page */
  ariaLabel?: string;
  /** Test ID for automated testing */
  testId?: string;
  /** Custom error fallback - replaces default QueryError */
  errorFallback?: ReactNode | PageShellErrorFallbackConfig;
}
