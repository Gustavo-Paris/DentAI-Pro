/**
 * PageList Type Definitions
 *
 * @package @pageshell/interactions
 */

import type { ReactNode, ReactElement } from 'react';
import type { StatusBadgeProps, IconName } from '@pageshell/primitives';
import type { LucideIcon } from 'lucide-react';

// =============================================================================
// Basic Types
// =============================================================================

/** Icon type - string name, LucideIcon component, or undefined */
export type PageIconVariant = IconName | LucideIcon | undefined;

/** Action prop - either a config object or ReactNode */
export type ActionProp = ActionConfig | ReactNode;

/**
 * Action configuration
 * @deprecated Import `ButtonActionConfig` from `@pageshell/core` for new code.
 * This local type will be removed in a future version.
 */
export interface ActionConfig {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  disabled?: boolean;
}

/** List visual variants */
export type PageListVariant = 'default' | 'compact' | 'card';

/** Icon color variants */
export type PageListIconColor = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';

// =============================================================================
// Badge & Action Types
// =============================================================================

/** Badge configuration */
export interface PageListBadge {
  label: string;
  variant?: StatusBadgeProps['variant'];
}

/** Item action configuration */
export interface PageListItemAction {
  /** Action icon */
  icon: PageIconVariant;
  /** Action label (for accessibility) */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Disable action */
  disabled?: boolean;
}

/** Avatar configuration */
export interface PageListAvatar {
  /** Image source URL */
  src?: string;
  /** Alt text */
  alt: string;
  /** Fallback initials (auto-generated from alt if not provided) */
  fallback?: string;
}

// =============================================================================
// Empty State Types
// =============================================================================

/**
 * Empty state configuration
 *
 * @example With action config
 * emptyState={{
 *   title: "Nenhum item",
 *   action: { label: "Criar Item" }
 * }}
 */
export interface PageListEmptyState {
  /** Empty state title */
  title: string;
  /** Empty state description */
  description?: string;
  /** Optional icon */
  icon?: PageIconVariant | ReactElement;
  /** Optional action - config object or ReactNode */
  action?: ActionProp;
}

// =============================================================================
// Component Props Types
// =============================================================================

/**
 * PageList component props
 */
export interface PageListProps<T> {
  /** List items */
  items: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number) => ReactNode;
  /** Key extractor function */
  keyExtractor?: (item: T, index: number) => string;

  // Variants
  /** Visual variant */
  variant?: PageListVariant;
  /** Show dividers between items */
  dividers?: boolean;
  /** Enable animations */
  animated?: boolean;
  /** Maximum animation delay index */
  maxAnimationDelay?: number;

  // Selection
  /** Enable selection */
  selectable?: boolean;
  /** Selected item keys */
  selectedKeys?: Set<string>;
  /** Selection change handler */
  onSelectionChange?: (keys: Set<string>) => void;

  // Click
  /** Item click handler */
  onItemClick?: (item: T, index: number) => void;

  // States
  /** Loading state */
  isLoading?: boolean;
  /** Custom skeleton */
  skeleton?: ReactNode;
  /** Number of skeleton items */
  skeletonCount?: number;
  /** Empty state configuration */
  emptyState?: PageListEmptyState;

  // Accessibility
  /** Accessible label */
  ariaLabel?: string;
  /** Test ID */
  testId?: string;
  /** Additional CSS classes */
  className?: string;
  /** Additional CSS classes for each item wrapper */
  itemClassName?: string;
}

/**
 * PageList.Item component props
 */
export interface PageListItemProps {
  /** Item icon */
  icon?: PageIconVariant;
  /** Icon color variant */
  iconColor?: PageListIconColor;
  /** Item avatar (alternative to icon) */
  avatar?: PageListAvatar;
  /** Item title */
  title: string;
  /** Item description */
  description?: string;
  /** Timestamp */
  timestamp?: string | Date;
  /** Badge */
  badge?: PageListBadge;
  /** Item actions */
  actions?: PageListItemAction[];
  /** Additional content (rendered below title/description) */
  children?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for automated testing */
  testId?: string;
}

/**
 * PageListSkeleton component props
 */
export interface PageListSkeletonProps {
  /** Number of skeleton items */
  count?: number;
  /** Visual variant */
  variant?: PageListVariant;
  /** Show dividers */
  dividers?: boolean;
  /** Additional CSS classes */
  className?: string;
}
