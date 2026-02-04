/**
 * useUnifiedSort Hook
 *
 * Transforms unified sort configuration to mode-specific formats.
 * Part of the ListPage Unified API.
 *
 * @module list/hooks/useUnifiedSort
 */

import { useMemo } from 'react';
import type { UnifiedSortConfig, SortDirection } from '../../shared/types';
import type { CardSortConfig, CardSortOption } from '../types';
import type { ResolvedViewMode } from './useViewMode';

// =============================================================================
// Types
// =============================================================================

/**
 * Table sort configuration (legacy format)
 */
export interface TableSortConfig {
  key: string;
  direction: SortDirection;
}

export interface UseUnifiedSortOptions<TItem> {
  /** Unified sort configuration */
  sort?: UnifiedSortConfig<TItem>;
  /** Legacy default sort (for backwards compatibility) */
  defaultSort?: TableSortConfig;
  /** Legacy card sort config (for backwards compatibility) */
  cardSortConfig?: CardSortConfig<TItem>;
  /** Current view mode */
  viewMode: ResolvedViewMode;
}

export interface UseUnifiedSortResult<TItem> {
  /** Table sort config for table mode */
  tableSort: TableSortConfig | undefined;
  /** Card sort config for card mode */
  cardSort: CardSortConfig<TItem> | undefined;
  /** Whether unified sort is being used (vs legacy) */
  isUnified: boolean;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Create a compare function for client-side sorting.
 * Auto-infers comparison based on field type.
 */
function createCompareFn<TItem>(
  options: UnifiedSortConfig<TItem>['options']
): (sortKey: string) => (a: TItem, b: TItem) => number {
  return (sortKey: string) => {
    // Find the option with custom compare function
    const option = options.find((o) => o.value === sortKey);

    if (option?.compare) {
      return option.compare;
    }

    // Default comparison: try to infer type
    return (a: TItem, b: TItem) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // String comparison
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal);
      }

      // Number comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return aVal - bVal;
      }

      // Date comparison
      if (aVal instanceof Date && bVal instanceof Date) {
        return aVal.getTime() - bVal.getTime();
      }

      // Date string comparison (ISO format)
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const aDate = Date.parse(aVal);
        const bDate = Date.parse(bVal);
        if (!isNaN(aDate) && !isNaN(bDate)) {
          return aDate - bDate;
        }
      }

      // Fallback: string comparison
      return String(aVal).localeCompare(String(bVal));
    };
  };
}

/**
 * Convert unified sort option to card sort option
 */
function toCardSortOption(option: { value: string; label: string }): CardSortOption {
  return {
    value: option.value,
    label: option.label,
  };
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to transform unified sort to mode-specific formats.
 *
 * @example
 * ```tsx
 * const { tableSort, cardSort } = useUnifiedSort({
 *   sort: {
 *     options: [
 *       { value: 'progress', label: 'Progress', direction: 'desc' },
 *       { value: 'title', label: 'Title', direction: 'asc' },
 *     ],
 *     default: 'progress',
 *   },
 *   viewMode: 'cards',
 * });
 * ```
 */
export function useUnifiedSort<TItem = unknown>(
  options: UseUnifiedSortOptions<TItem>
): UseUnifiedSortResult<TItem> {
  const { sort, defaultSort, cardSortConfig, viewMode } = options;

  return useMemo(() => {
    // If no unified sort, use legacy props
    if (!sort) {
      return {
        tableSort: defaultSort,
        cardSort: cardSortConfig,
        isUnified: false,
      };
    }

    // Find default option to get direction
    const defaultOption = sort.options.find((o) => o.value === sort.default);
    const defaultDirection = defaultOption?.direction ?? sort.defaultDirection ?? 'asc';

    // Table sort config
    const tableSort: TableSortConfig = {
      key: sort.default,
      direction: defaultDirection,
    };

    // Card sort config
    const cardSort: CardSortConfig<TItem> = {
      options: sort.options.map(toCardSortOption),
      default: sort.default,
      compareFn: createCompareFn(sort.options),
    };

    return {
      tableSort,
      cardSort,
      isUnified: true,
    };
  }, [sort, defaultSort, cardSortConfig, viewMode]);
}

export default useUnifiedSort;
