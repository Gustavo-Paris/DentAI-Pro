import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { IconProp } from '@pageshell/primitives';
import type { StatusVariant } from '@pageshell/primitives';

// =============================================================================
// Badge Types
// =============================================================================

export interface PageBadge {
  /** Badge label */
  label: string;
  /** Badge variant */
  variant?: StatusVariant;
}

// =============================================================================
// Breadcrumb Types
// =============================================================================

export interface PageBreadcrumb {
  /** Display label */
  label: string;
  /** Navigation href */
  href?: string;
  /** Optional icon */
  icon?: IconProp;
}

// =============================================================================
// Meta Types
// =============================================================================

export interface PageHeaderMeta {
  /** Meta label */
  label: string;
  /** Meta value */
  value: string | number;
  /** Meta icon */
  icon?: IconProp;
}

// =============================================================================
// Action Types
// =============================================================================

/** tRPC mutation-like interface for loading state */
export interface MutationLike {
  mutateAsync: (input?: unknown) => Promise<unknown>;
  isPending?: boolean;
}

/** Header action button configuration */
export interface HeaderActionConfig {
  /** Button label */
  label: string;
  /** Button variant */
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  /** Optional icon */
  icon?: IconProp;
  /** Navigation href */
  href?: string;
  /** Click handler (mutually exclusive with mutation) */
  onClick?: () => void;
  /** tRPC mutation for async actions */
  mutation?: MutationLike;
  /** Mutation input (when using mutation) */
  mutationInput?: unknown;
  /** Conditional visibility */
  show?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Test ID for e2e testing */
  testId?: string;
}

/** Single action or ReactNode */
export type HeaderActionProp = HeaderActionConfig | ReactNode;

/** Multiple action configs */
export type HeaderActionsProp = HeaderActionConfig[];

/** Action prop - single, array, or ReactNode */
export type ActionProp = HeaderActionConfig | HeaderActionConfig[] | ReactNode;

// =============================================================================
// Header Size & Align
// =============================================================================

export type PageHeaderSize = 'sm' | 'md' | 'lg';
export type PageHeaderAlign = 'left' | 'center';

// =============================================================================
// PageHeader Props
// =============================================================================

export interface PageHeaderProps {
  /** Optional ID for the heading element */
  id?: string;
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Section label (above title) */
  label?: string;
  /** Badge(s) */
  badge?: PageBadge | PageBadge[];
  /** Header action(s) - config object, array, or ReactNode */
  action?: ActionProp;
  /** Title icon */
  icon?: IconProp;
  /** Breadcrumb items */
  breadcrumbs?: PageBreadcrumb[];
  /** Back navigation URL */
  backHref?: string;
  /** Back navigation label */
  backLabel?: string;
  /** Back navigation handler */
  onBack?: () => void;
  /** Header size */
  size?: PageHeaderSize;
  /** Content alignment */
  align?: PageHeaderAlign;
  /** Sticky positioning */
  sticky?: boolean;
  /** Show bottom divider */
  divider?: boolean;
  /** Additional metadata items */
  meta?: PageHeaderMeta[];
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Custom Link component for framework-agnostic usage */
  LinkComponent?: React.ComponentType<{
    href: string;
    children: React.ReactNode;
    className?: string;
  }>;
}
