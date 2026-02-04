/**
 * InfiniteCardList Types
 *
 * Type definitions for the InfiniteCardList composite.
 *
 * @module infinite-card-list/types
 */

import type { ReactNode } from 'react';
import type { IconProp } from '@pageshell/primitives';
import type {
  CompositeBaseProps,
  EmptyStateConfig,
} from '../shared/types';

// =============================================================================
// Infinite Query Result
// =============================================================================

/**
 * Page structure for infinite query
 */
export interface InfinitePage<TItem> {
  items: TItem[];
  nextCursor?: string | number | null;
}

/**
 * Compatible with tRPC useInfiniteQuery result
 */
export interface InfiniteQueryResult<TItem, TPage = InfinitePage<TItem>> {
  data?: {
    pages: TPage[];
    pageParams: unknown[];
  };
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage?: boolean;
  fetchNextPage: () => void;
  isError?: boolean;
  /** Error object - compatible with tRPC and React Query errors */
  error?: unknown;
}

// =============================================================================
// Sort Configuration
// =============================================================================

/**
 * Sort option
 */
export interface InfiniteSortOption {
  value: string;
  label: string;
}

/**
 * Sort configuration
 */
export interface InfiniteSortConfig {
  /** Sort options */
  options: InfiniteSortOption[];
  /** Default sort value */
  default: string;
  /** Sort label */
  label?: string;
}

// =============================================================================
// Filter Configuration
// =============================================================================

/**
 * Filter option
 */
export interface InfiniteFilterOption {
  value: string;
  label: string;
  /** Icon - accepts string name or ComponentType */
  icon?: IconProp;
}

/**
 * Filter configuration
 */
export interface InfiniteFilterConfig {
  /** Filter type */
  type: 'select' | 'buttons' | 'rating';
  /** Filter options */
  options: InfiniteFilterOption[];
  /** Default value */
  default?: string | number | null;
  /** Filter label */
  label?: string;
  /** Placeholder for select */
  placeholder?: string;
}

// =============================================================================
// Skeleton Configuration
// =============================================================================

/**
 * Skeleton configuration
 */
export interface InfiniteSkeletonConfig {
  /** Number of card placeholders */
  count?: number;
  /** Custom card skeleton */
  cardSkeleton?: ReactNode;
  /** Show header skeleton */
  showHeader?: boolean;
}

// =============================================================================
// InfiniteCardList Props
// =============================================================================

/**
 * InfiniteCardList component props
 *
 * @template TItem - The item type in the list
 * @template TPage - The page type from query
 */
export interface InfiniteCardListProps<
  TItem = Record<string, unknown>,
  TPage = InfinitePage<TItem>,
> extends Omit<CompositeBaseProps, 'title'> {
  /** Optional title (displayed above cards) */
  title?: string;

  // ---------------------------------------------------------------------------
  // Data Source
  // ---------------------------------------------------------------------------

  /**
   * Infinite query result (tRPC, React Query compatible)
   */
  query: InfiniteQueryResult<TItem, TPage>;

  /**
   * Extract items from a page
   * @default (page) => page.items
   */
  getItems?: (page: TPage) => TItem[];

  /**
   * Key extractor for list rendering
   * @default (item) => item.id
   */
  keyExtractor?: (item: TItem) => string;

  // ---------------------------------------------------------------------------
  // Sort
  // ---------------------------------------------------------------------------

  /**
   * Sort configuration
   */
  sortConfig?: InfiniteSortConfig;

  /**
   * Current sort value (controlled)
   */
  sortValue?: string;

  /**
   * Sort change handler
   */
  onSortChange?: (value: string) => void;

  // ---------------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------------

  /**
   * Filter configurations
   */
  filters?: Record<string, InfiniteFilterConfig>;

  /**
   * Current filter values (controlled)
   */
  filterValues?: Record<string, string | number | null>;

  /**
   * Filter change handler
   */
  onFilterChange?: (key: string, value: string | number | null) => void;

  // ---------------------------------------------------------------------------
  // Card Rendering
  // ---------------------------------------------------------------------------

  /**
   * Render card component
   */
  renderCard: (item: TItem, index: number) => ReactNode;

  // ---------------------------------------------------------------------------
  // Layout
  // ---------------------------------------------------------------------------

  /**
   * Container CSS classes
   */
  containerClassName?: string;

  /**
   * Cards container CSS classes
   * @default "space-y-4"
   */
  cardsClassName?: string;

  /**
   * Show item count label
   * @default true
   */
  showCount?: boolean;

  /**
   * Item count label formatter
   * @default (count) => `${count} item${count !== 1 ? 's' : ''}`
   */
  countLabel?: (count: number, filterValues?: Record<string, string | number | null>) => string;

  // ---------------------------------------------------------------------------
  // Load More
  // ---------------------------------------------------------------------------

  /**
   * Load more button text
   * @default "Load more"
   */
  loadMoreText?: string;

  /**
   * Loading text for load more button
   * @default "Loading..."
   */
  loadingText?: string;

  /**
   * Show load more icon
   * @default true
   */
  showLoadMoreIcon?: boolean;

  // ---------------------------------------------------------------------------
  // Empty States
  // ---------------------------------------------------------------------------

  /**
   * Empty state configuration (no data)
   */
  emptyState?: EmptyStateConfig;

  /**
   * Empty filter state (no results after filters)
   */
  emptyFilterState?: {
    title: string;
    description?: string;
    showClearButton?: boolean;
  };

  /**
   * Get dynamic empty state based on filters
   */
  getEmptyState?: (filterValues?: Record<string, string | number | null>) => {
    title: string;
    description?: string;
  };

  // ---------------------------------------------------------------------------
  // Skeleton
  // ---------------------------------------------------------------------------

  /**
   * Skeleton configuration
   */
  skeletonConfig?: InfiniteSkeletonConfig;

  /**
   * Custom skeleton component
   */
  skeleton?: ReactNode;

  // ---------------------------------------------------------------------------
  // Slots
  // ---------------------------------------------------------------------------

  /**
   * Slot overrides for customization
   */
  slots?: {
    /** Content before the cards list (e.g., rating distribution) */
    beforeCards?: ReactNode;
    /** Content after sort controls, before cards */
    afterControls?: ReactNode;
    /** Content after the cards list */
    afterCards?: ReactNode;
    /** Custom header content */
    header?: ReactNode;
  };
}
