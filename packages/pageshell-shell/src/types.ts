/**
 * PageShell Types
 *
 * @module types
 */

import type { ReactNode } from 'react';
import type { PageShellTheme } from '@pageshell/theme';
import type { IconProp } from '@pageshell/primitives';
import type { ErrorFallbackConfig } from './lib/error-fallback';

// =============================================================================
// Re-exports from @pageshell/layouts
// These are the canonical type definitions - use them directly
// =============================================================================

export type {
  // Breadcrumb
  PageBreadcrumb,
  // Header
  PageHeaderMeta,
  PageHeaderSize,
  PageHeaderAlign,
  PageBadge,
  // Actions
  HeaderActionConfig,
  ActionProp,
  // Quick Actions
  QuickAction,
  QuickActionBadge,
  // Skeletons
  SkeletonVariant,
  SkeletonConfig,
} from '@pageshell/layouts';

// =============================================================================
// Re-exports from @pageshell/interactions
// =============================================================================

export type { WizardBackgroundVariant } from '@pageshell/interactions';

// =============================================================================
// Re-exports from @pageshell/primitives
// =============================================================================

export type { StatusVariant as BadgeVariant } from '@pageshell/primitives';

// =============================================================================
// Query Types
// =============================================================================

/**
 * Error type compatible with both standard Error and tRPC errors.
 * tRPC errors have `message` but may lack `name` property.
 */
export type QueryError = Error | { message: string } | null;

/**
 * Query result interface for data fetching.
 * Compatible with tRPC query results without manual adaptation.
 */
export interface QueryResult<TData> {
  data: TData | undefined;
  isLoading: boolean;
  error: QueryError;
  refetch: () => void;
}

// =============================================================================
// Empty State Types
// =============================================================================

/**
 * Empty state configuration
 */
export interface PageEmptyState {
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Icon - can be string name, component, or JSX element */
  icon?: IconProp | ReactNode;
  /** Variant */
  variant?: 'data' | 'search' | 'card';
  /** Action button */
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

// =============================================================================
// Action Types
// =============================================================================

/**
 * @deprecated Import `ActionVariant` from `@pageshell/core` for new code.
 */
export type ActionVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'link' | 'accent';

/**
 * @deprecated Import `ActionSize` from `@pageshell/core` for new code.
 */
export type ActionSize = 'sm' | 'md' | 'lg' | 'icon';

/**
 * @deprecated Import `ButtonActionConfig` from `@pageshell/core` for new code.
 * This local type will be removed in a future version.
 */
export interface ActionConfig {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: IconProp;
  variant?: ActionVariant;
  size?: ActionSize;
  disabled?: boolean;
  loading?: boolean;
  /** Conditionally show/hide the action */
  show?: boolean;
  /** Test ID for automation testing */
  testId?: string;
}

// =============================================================================
// Header Action Types
// =============================================================================

export type PageHeaderActionVariant = ActionVariant;
export type PageHeaderActionSize = ActionSize;

export interface PageHeaderActionConfig extends ActionConfig {
  /** Show icon only on mobile */
  mobileIconOnly?: boolean;
}

export type PageHeaderAction = PageHeaderActionConfig | PageHeaderActionConfig[];

// =============================================================================
// PageShell Props
// =============================================================================

// Import canonical types for use in props
import type {
  PageBadge as LayoutsPageBadge,
  QuickAction as LayoutsQuickAction,
  SkeletonVariant as LayoutsSkeletonVariant,
  SkeletonConfig as LayoutsSkeletonConfig,
} from '@pageshell/layouts';

import type { WizardBackgroundVariant as WizardBgVariant } from '@pageshell/interactions';

/**
 * Base props shared by all PageShell variants
 */
interface PageShellBaseProps {
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Label badge above title */
  label?: string;
  /** Badge next to title */
  badge?: LayoutsPageBadge;
  /** Header action(s) - can be ActionConfig objects or JSX elements */
  headerAction?: ActionConfig | ActionConfig[] | ReactNode;
  /** Header actions (array) */
  headerActions?: ActionConfig[];
  /** Theme variant */
  theme?: PageShellTheme;
  /** Quick actions grid */
  quickActions?: LayoutsQuickAction[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for PageShell with query
 */
export interface PageShellProps<TData> extends PageShellBaseProps {
  /** Data query result */
  query: QueryResult<TData>;
  /** Empty state check function */
  emptyCheck?: (data: TData) => boolean;
  /** Empty state configuration */
  emptyState?: PageEmptyState;
  /** Render children with data */
  children: (data: TData) => ReactNode;
  /** Error fallback configuration */
  errorFallback?: ReactNode | ErrorFallbackConfig;
}

/**
 * Props for PageShell.Static (no query)
 */
export interface PageShellStaticProps extends PageShellBaseProps {
  /** Static children */
  children: ReactNode;
}

/**
 * Props for PageShell.Multi (multiple queries)
 */
export interface PageShellMultiProps<TQueries extends Record<string, QueryResult<unknown>>> extends PageShellBaseProps {
  /** Multiple query results */
  queries: TQueries;
  /** Render children with all data */
  children: (data: { [K in keyof TQueries]: NonNullable<TQueries[K]['data']> }) => ReactNode;
  /** Error fallback configuration */
  errorFallback?: ReactNode | ErrorFallbackConfig;
}

// Re-export ErrorFallbackConfig for convenience
export type PageShellErrorFallbackConfig = ErrorFallbackConfig;

// =============================================================================
// LinearFlow Types
// =============================================================================

/**
 * Linear flow variant props - for page-to-page navigation flows
 */
export interface PageShellLinearFlowProps<TData = unknown> {
  /** Theme variant */
  theme: PageShellTheme;

  // Header
  /** Page title */
  title: string;
  /** Optional description */
  description?: string;
  /** Icon variant (e.g., 'rocket', 'wand', 'sparkles') */
  icon?: IconProp;
  /** Additional header CSS classes */
  headerClassName?: string;

  // Navigation
  /** Back navigation href */
  backHref?: string;
  /** Back button label */
  backLabel?: string;
  /** Next navigation href */
  nextHref?: string;
  /** Next button label */
  nextLabel?: string;
  /** Handler for next action (before navigation) */
  onNext?: () => void | Promise<void>;
  /** Disable next button */
  nextDisabled?: boolean;
  /** Next button loading state */
  nextLoading?: boolean;

  // Background
  /** Background style */
  background?: WizardBgVariant;
  /** Vertical spacing between header and content */
  spacing?: 'compact' | 'default' | 'relaxed';

  // Data
  /** Optional tRPC query result */
  query?: QueryResult<TData>;
  /**
   * Loading skeleton component (custom).
   * Optional if using skeletonVariant.
   */
  skeleton?: ReactNode;
  /**
   * Skeleton preset variant - uses built-in skeleton components.
   * Use this instead of importing skeleton components manually.
   *
   * @example
   * skeletonVariant="linearFlow"
   * skeletonConfig={{ stepCount: 5 }}
   */
  skeletonVariant?: LayoutsSkeletonVariant;
  /** Configuration for skeleton preset */
  skeletonConfig?: LayoutsSkeletonConfig;

  // Content
  /** Render function or static content */
  children: ReactNode | ((data: TData) => ReactNode);
  /** Additional CSS classes */
  className?: string;
}
