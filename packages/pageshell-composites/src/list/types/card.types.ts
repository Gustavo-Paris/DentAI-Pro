/**
 * ListPage Card View Types
 *
 * Type definitions for card/grid visualization mode.
 *
 * @see ADR-0051: ListPage + CardListPage Consolidation
 * @module list/types/card
 */

import type { ReactNode } from 'react';
import type { IconName } from '@pageshell/primitives';

// =============================================================================
// Card Mode Types (ADR-0051)
// =============================================================================

/**
 * Card filter option
 */
export interface CardFilterOption {
  value: string;
  label: string;
}

/**
 * Card filter configuration (for card mode)
 */
export interface CardFilterConfig {
  /** Filter type */
  type: 'select' | 'buttons';
  /** Filter options */
  options: CardFilterOption[];
  /** Default value */
  default?: string;
  /** Filter label */
  label?: string;
}

/**
 * Stats card trend indicator
 */
export interface CardStatsTrend {
  /** Trend value (e.g., 12.5 for +12.5%) */
  value: number;
  /** Trend direction */
  direction: 'up' | 'down' | 'neutral';
  /** Custom label (optional) */
  label?: string;
}

/**
 * Stats card configuration
 */
export interface CardStatsCard {
  /** Stat label */
  label: string;
  /** Stat value */
  value: string | number;
  /** Icon (string name) */
  icon?: string;
  /** Trend indicator */
  trend?: CardStatsTrend;
  /** Loading state */
  isLoading?: boolean;
}

/**
 * Stats section configuration (for card mode)
 */
export interface CardStatsSectionConfig {
  /** Stats cards */
  cards: CardStatsCard[];
  /** Grid columns */
  columns?: 2 | 3 | 4;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Skeleton configuration (for card mode)
 */
export interface CardSkeletonConfig {
  /** Number of card placeholders */
  count?: number;
  /** Grid columns */
  columns?: 2 | 3 | 4;
  /** Show stats bar skeleton */
  showStats?: boolean;
  /** Show header skeleton */
  showHeader?: boolean;
}

/**
 * Empty search state configuration
 */
export interface EmptySearchStateConfig {
  /** Title for empty search results */
  title: string;
  /** Description */
  description: string;
  /** Show clear filters button */
  showClearButton?: boolean;
}

/**
 * Customization slots for ListPage
 */
export interface ListPageSlots {
  /** Before header content */
  headerSlot?: ReactNode;
  /** Before filters (card mode) */
  beforeFilters?: ReactNode;
  /** After filters (card mode) */
  afterFilters?: ReactNode;
  /** Before table/cards content */
  beforeTableSlot?: ReactNode;
  /** Before cards (card mode alias) */
  beforeCards?: ReactNode;
  /** After table/cards content */
  afterTableSlot?: ReactNode;
  /** After cards (card mode alias) */
  afterCards?: ReactNode;
}

/**
 * Card action confirmation dialog
 */
export interface CardActionConfirm<TItem = unknown> {
  /** Dialog title (can be function for dynamic) */
  title: string | ((item: TItem) => string);
  /** Dialog description */
  description?: string;
  /** Dialog body content */
  body?: ReactNode | ((item: TItem) => ReactNode);
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Loading button text */
  loadingText?: string;
  /** Variant */
  variant?: 'default' | 'destructive';
}

/**
 * Single card action configuration
 */
export interface CardActionConfig<TItem = unknown> {
  /** Action label */
  label: string;
  /** Icon name (from registry) */
  icon?: string;
  /** Navigation href (supports :param interpolation) */
  href?: string | ((item: TItem) => string);
  /** Click handler */
  onClick?: (item: TItem) => void;
  /** Mutation for async operations */
  mutation?: {
    mutateAsync: (input: unknown) => Promise<unknown>;
  };
  /** Extract mutation input from item */
  mutationInput?: (item: TItem) => unknown;
  /** Success message after mutation */
  successMessage?: string;
  /** Navigate after successful mutation */
  successHref?: string | ((item: TItem) => string);
  /** Confirmation dialog */
  confirm?: CardActionConfirm<TItem> | boolean;
  /** Condition to show action */
  showWhen?: (item: TItem) => boolean;
  /** Condition to disable action */
  disabledWhen?: (item: TItem) => boolean;
  /** Action variant */
  variant?: 'default' | 'destructive';
}

/**
 * Card actions configuration (record of named actions)
 */
export type CardActionsConfig<TItem = unknown> = Record<
  string,
  CardActionConfig<TItem>
>;

/**
 * Section configuration for grouped cards
 */
export interface CardSectionConfig<TItem> {
  /** Enable sections */
  enabled: boolean;
  /** Get section key for item */
  getSectionKey: (item: TItem) => string;
  /** Section labels */
  sectionLabels: Record<string, string>;
  /** Section icons mapped by section key */
  sectionIcons?: Record<string, IconName | string>;
  /** Section icon CSS classes mapped by section key */
  sectionIconClassNames?: Record<string, string>;
  /** Section label CSS classes mapped by section key */
  sectionLabelClassNames?: Record<string, string>;
  /** Section order (optional) */
  sectionOrder?: string[];
}

/**
 * Sort option for card mode
 */
export interface CardSortOption {
  value: string;
  label: string;
}

/**
 * Sort configuration for card mode (client-side sorting)
 */
export interface CardSortConfig<TItem> {
  /** Sort options */
  options: CardSortOption[];
  /** Default sort value */
  default: string;
  /** Compare function generator */
  compareFn: (sortKey: string) => (a: TItem, b: TItem) => number;
}
