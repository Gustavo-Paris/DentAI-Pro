/**
 * useListPageFilters Hook
 *
 * Extracts filter synchronization logic from ListPage.
 * Handles normalization of filters and sync between client-side
 * filtering (listLogic) and server-side filtering (state).
 *
 * @see ADR-0102: ListPage Context Decomposition
 * @module list/hooks/useListPageFilters
 */

'use client';

import * as React from 'react';
import { normalizeFilters, convertFiltersToListLogicFormat, convertCardFiltersToFilterConfig } from '../utils';
import type { FilterConfig } from '../../shared/types';
import type { CardFilterConfig, ViewMode, OnListStateChange, ControlledListState } from '../types';

// =============================================================================
// Types
// =============================================================================

/**
 * Options for useListPageFilters hook
 */
export interface UseListPageFiltersOptions {
  /**
   * Filter configurations.
   * Can be array or object keyed by filter name.
   */
  filters?: FilterConfig[] | Record<string, Omit<FilterConfig, 'key'>>;

  /**
   * Card-specific filters (deprecated, merged with filters).
   */
  cardFilters?: Record<string, CardFilterConfig>;

  /**
   * Current view mode for determining which filters to merge.
   */
  viewMode: ViewMode;

  /**
   * Whether columns are provided (affects cardFilters merge logic).
   */
  hasColumns: boolean;

  /**
   * List logic instance for client-side filtering.
   */
  listLogic?: {
    search: string;
    filters: Record<string, string>;
    hasActiveFilters: boolean;
    setFilter: (key: string, value: string) => void;
    setSearch: (query: string) => void;
    clearFilters: () => void;
  };

  /**
   * Whether client-side filtering is enabled.
   */
  useClientSideFiltering: boolean;

  /**
   * External filter change callback (for controlled mode).
   */
  onFiltersChange?: (filters: Record<string, string>) => void;

  /**
   * External search change callback (for controlled mode).
   */
  onSearchChange?: (search: string) => void;

  /**
   * Unified state change callback (for controlled mode).
   */
  onStateChange?: OnListStateChange;

  /**
   * Current list state (for controlled mode callbacks).
   */
  listState?: ControlledListState;
}

/**
 * Result from useListPageFilters hook
 */
export interface UseListPageFiltersResult {
  /** Normalized filter configurations array */
  normalizedFilters: FilterConfig[];

  /** Filters in listLogic format (for useListLogic) */
  listLogicFilters: Record<string, {
    options: Array<string | { value: string; label: string }>;
    defaultValue?: string;
    label?: string;
  }>;

  /** Current search query */
  searchQuery: string;

  /** Update search query (synced) */
  setSearchQuery: (query: string) => void;

  /** Active filter values by key */
  activeFilters: Record<string, string>;

  /** Update a single filter (synced) */
  handleFilterChange: (key: string, value: string) => void;

  /** Whether any filters or search are active */
  hasActiveFilters: boolean;

  /** Clear all filters and search (synced) */
  clearAllFilters: () => void;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * useListPageFilters - Unified filter management for ListPage
 *
 * Handles the complexity of:
 * 1. Normalizing filter configurations from different formats
 * 2. Merging cardFilters when in card view mode
 * 3. Syncing between client-side and server-side filtering
 * 4. Calling external callbacks for controlled mode
 *
 * @example Basic usage
 * ```tsx
 * const {
 *   normalizedFilters,
 *   searchQuery,
 *   setSearchQuery,
 *   handleFilterChange,
 * } = useListPageFilters({
 *   filters: { status: { type: 'select', options: [...] } },
 *   viewMode: 'table',
 *   hasColumns: true,
 *   useClientSideFiltering: false,
 * });
 * ```
 *
 * @example With client-side filtering
 * ```tsx
 * const listLogic = useListLogic({ items: myItems, ... });
 *
 * const { handleFilterChange } = useListPageFilters({
 *   filters,
 *   viewMode: 'cards',
 *   hasColumns: false,
 *   useClientSideFiltering: true,
 *   listLogic,
 * });
 * ```
 */
export function useListPageFilters(
  options: UseListPageFiltersOptions
): UseListPageFiltersResult {
  const {
    filters,
    cardFilters,
    viewMode,
    hasColumns,
    listLogic,
    useClientSideFiltering,
    onFiltersChange,
    onSearchChange,
    onStateChange,
    listState,
  } = options;

  // Local state for search and filters (when not using listLogic)
  const [localSearchQuery, setLocalSearchQuery] = React.useState('');
  const [localActiveFilters, setLocalActiveFilters] = React.useState<Record<string, string>>({});

  // Normalize and convert filters to array format
  // Merge cardFilters when in card view mode
  const normalizedFilters = React.useMemo(() => {
    const baseFilters = normalizeFilters(filters);
    // When in card view with cardFilters, merge them with regular filters
    if (cardFilters && (viewMode === 'cards' || (viewMode === 'auto' && !hasColumns))) {
      const convertedCardFilters = convertCardFiltersToFilterConfig(cardFilters);
      // Merge: cardFilters take precedence for same keys
      const filterMap = new Map(baseFilters.map(f => [f.key, f]));
      convertedCardFilters.forEach(f => filterMap.set(f.key, f));
      return Array.from(filterMap.values());
    }
    return baseFilters;
  }, [filters, cardFilters, viewMode, hasColumns]);

  // Convert to listLogic format
  const listLogicFilters = React.useMemo(
    () => convertFiltersToListLogicFormat(normalizedFilters),
    [normalizedFilters]
  );

  // Resolve search query source
  const searchQuery = useClientSideFiltering && listLogic
    ? listLogic.search
    : localSearchQuery;

  // Resolve active filters source
  const activeFilters = useClientSideFiltering && listLogic
    ? listLogic.filters
    : localActiveFilters;

  // Resolve hasActiveFilters
  const hasActiveFilters = useClientSideFiltering && listLogic
    ? listLogic.hasActiveFilters
    : Object.values(localActiveFilters).some(v => v && v !== '' && v !== 'all') ||
      localSearchQuery.length > 0;

  // Synced search handler
  const setSearchQuery = React.useCallback((query: string) => {
    // Update local state
    setLocalSearchQuery(query);

    // Sync with listLogic for client-side filtering
    if (useClientSideFiltering && listLogic) {
      listLogic.setSearch(query);
    }

    // Call external callbacks for controlled mode
    if (onSearchChange) {
      onSearchChange(query);
    }
    if (onStateChange && listState) {
      onStateChange(
        { ...listState, search: query, page: 1 },
        ['search', 'page']
      );
    }
  }, [useClientSideFiltering, listLogic, onSearchChange, onStateChange, listState]);

  // Synced filter change handler
  const handleFilterChange = React.useCallback((key: string, value: string) => {
    // Update local state
    setLocalActiveFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      if (value === '' || value === 'all') {
        delete newFilters[key];
      }
      return newFilters;
    });

    // Sync with listLogic for client-side filtering
    if (useClientSideFiltering && listLogic) {
      listLogic.setFilter(key, value);
    }

    // Call external callbacks for controlled mode
    if (onFiltersChange) {
      const newFilters = { ...activeFilters, [key]: value };
      if (value === '' || value === 'all') {
        delete newFilters[key];
      }
      onFiltersChange(newFilters);
    }
    if (onStateChange && listState) {
      const newFilters = { ...listState.filters, [key]: value };
      if (value === '' || value === 'all') {
        delete newFilters[key];
      }
      onStateChange(
        { ...listState, filters: newFilters, page: 1 },
        ['filters', 'page']
      );
    }
  }, [useClientSideFiltering, listLogic, onFiltersChange, onStateChange, activeFilters, listState]);

  // Synced clear all handler
  const clearAllFilters = React.useCallback(() => {
    // Update local state
    setLocalSearchQuery('');
    setLocalActiveFilters({});

    // Sync with listLogic for client-side filtering
    if (useClientSideFiltering && listLogic) {
      listLogic.clearFilters();
    }

    // Call external callbacks for controlled mode
    if (onFiltersChange) {
      onFiltersChange({});
    }
    if (onSearchChange) {
      onSearchChange('');
    }
    if (onStateChange && listState) {
      onStateChange(
        { ...listState, filters: {}, search: '', page: 1 },
        ['filters', 'search', 'page']
      );
    }
  }, [useClientSideFiltering, listLogic, onFiltersChange, onSearchChange, onStateChange, listState]);

  return {
    normalizedFilters,
    listLogicFilters,
    searchQuery,
    setSearchQuery,
    activeFilters,
    handleFilterChange,
    hasActiveFilters,
    clearAllFilters,
  };
}
