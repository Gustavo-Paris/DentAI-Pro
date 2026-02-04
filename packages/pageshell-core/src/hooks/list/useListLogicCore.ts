/**
 * useListLogic - Headless List Logic Hook
 *
 * Encapsulates all list state management: search, filters, sort, pagination.
 * Can be used independently for custom UIs or with ListPage/CardListPage.
 *
 * @module hooks/list
 *
 * @example Client-side filtering
 * ```tsx
 * const list = useListLogic({
 *   items: users,
 *   searchFields: ['name', 'email'],
 *   filters: {
 *     role: { options: ['all', 'admin', 'user'] },
 *   },
 *   pageSize: 10,
 * });
 *
 * // Use with custom UI
 * <input value={list.search} onChange={(e) => list.setSearch(e.target.value)} />
 * <ul>
 *   {list.paginatedItems.map(item => <li key={item.id}>{item.name}</li>)}
 * </ul>
 * ```
 *
 * @example Server-side fetching (just state, no filtering)
 * ```tsx
 * const list = useListLogic({ pageSize: 20 });
 *
 * // Pass queryParams to your API
 * const { data } = api.users.list.useQuery(list.queryParams);
 * ```
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useDebouncedValue } from '../useDebounce';
import {
  matchesSearch,
  matchesFilters,
  getDefaultFilters,
} from '../../utils/searchUtils';
import { DEFAULT_PAGE_SIZE, DEFAULT_DEBOUNCE_MS } from './constants';
import type {
  UseListLogicOptions,
  UseListLogicReturn,
  ListState,
  ListQueryParams,
} from './types';

// =============================================================================
// Hook Implementation
// =============================================================================

export function useListLogic<TItem = unknown>(
  options: UseListLogicOptions<TItem> = {}
): UseListLogicReturn<TItem> {
  const {
    items = [],
    searchFields = [],
    searchDebounceMs = DEFAULT_DEBOUNCE_MS,
    initialSearch = '',
    filters: filterConfigs,
    initialFilters,
    sort,
    pageSize: initialPageSize = DEFAULT_PAGE_SIZE,
    initialPage = 1,
    onStateChange,
    onReset,
  } = options;

  // =========================================================================
  // State
  // =========================================================================

  const defaultFilters = useMemo(
    () => getDefaultFilters(filterConfigs),
    [filterConfigs]
  );

  const [search, setSearchState] = useState(initialSearch);
  const [filters, setFiltersState] = useState<Record<string, string>>(
    () => initialFilters ?? defaultFilters
  );
  const [sortBy, setSortByState] = useState(sort?.default ?? '');
  const [sortOrder, setSortOrderState] = useState<'asc' | 'desc'>(
    sort?.defaultOrder ?? 'desc'
  );
  const [page, setPageState] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  // Debounced search
  const debouncedSearch = useDebouncedValue(search, searchDebounceMs);

  // =========================================================================
  // Computed: Client-side filtering
  // =========================================================================

  const filteredItems = useMemo(() => {
    if (!items.length) return [];

    return items.filter((item) => {
      // Search filter
      if (
        searchFields.length > 0 &&
        !matchesSearch(item, debouncedSearch, searchFields)
      ) {
        return false;
      }

      // Attribute filters
      if (!matchesFilters(item, filters)) {
        return false;
      }

      return true;
    });
  }, [items, debouncedSearch, searchFields, filters]);

  const sortedItems = useMemo(() => {
    if (!filteredItems.length || !sortBy || !sort?.compareFn) {
      return filteredItems;
    }

    const compareFn = sort.compareFn(sortBy);
    const sorted = [...filteredItems].sort(compareFn);

    return sortOrder === 'desc' ? sorted.reverse() : sorted;
  }, [filteredItems, sortBy, sortOrder, sort]);

  const totalPages = useMemo(() => {
    if (pageSize <= 0) return 1;
    return Math.ceil(sortedItems.length / pageSize);
  }, [sortedItems.length, pageSize]);

  const paginatedItems = useMemo(() => {
    if (pageSize <= 0) return sortedItems;

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return sortedItems.slice(start, end);
  }, [sortedItems, page, pageSize]);

  const hasActiveFilters = useMemo(() => {
    if (search.trim().length > 0) return true;

    return Object.entries(filters).some(([key, value]) => {
      const defaultValue = defaultFilters[key] ?? 'all';
      return value !== defaultValue && value !== 'all';
    });
  }, [search, filters, defaultFilters]);

  // =========================================================================
  // State object
  // =========================================================================

  const state = useMemo<ListState>(
    () => ({
      search: debouncedSearch,
      filters,
      sortBy,
      sortOrder,
      page,
      pageSize,
    }),
    [debouncedSearch, filters, sortBy, sortOrder, page, pageSize]
  );

  const queryParams = useMemo<ListQueryParams>(
    () => ({
      ...state,
      offset: (page - 1) * pageSize,
    }),
    [state, page, pageSize]
  );

  // =========================================================================
  // Actions
  // =========================================================================

  const setSearch = useCallback(
    (value: string) => {
      setSearchState(value);
      setPageState(1); // Reset to first page on search
      onStateChange?.({ ...state, search: value, page: 1 });
    },
    [state, onStateChange]
  );

  const setFilter = useCallback(
    (key: string, value: string) => {
      setFiltersState((prev) => {
        const next = { ...prev, [key]: value };
        onStateChange?.({ ...state, filters: next, page: 1 });
        return next;
      });
      setPageState(1); // Reset to first page on filter change
    },
    [state, onStateChange]
  );

  const setFilters = useCallback(
    (newFilters: Record<string, string>) => {
      setFiltersState(newFilters);
      setPageState(1);
      onStateChange?.({ ...state, filters: newFilters, page: 1 });
    },
    [state, onStateChange]
  );

  const clearFilters = useCallback(() => {
    setSearchState('');
    setFiltersState(defaultFilters);
    setPageState(1);
    onStateChange?.({
      ...state,
      search: '',
      filters: defaultFilters,
      page: 1,
    });
  }, [state, defaultFilters, onStateChange]);

  const reset = useCallback(() => {
    setSearchState(initialSearch);
    setFiltersState(initialFilters ?? defaultFilters);
    setSortByState(sort?.default ?? '');
    setSortOrderState(sort?.defaultOrder ?? 'desc');
    setPageState(initialPage);
    setPageSizeState(initialPageSize);
    onReset?.();
  }, [
    initialSearch,
    initialFilters,
    defaultFilters,
    sort,
    initialPage,
    initialPageSize,
    onReset,
  ]);

  const setSort = useCallback(
    (field: string) => {
      setSortByState(field);
      onStateChange?.({ ...state, sortBy: field });
    },
    [state, onStateChange]
  );

  const toggleSortOrder = useCallback(() => {
    setSortOrderState((prev) => {
      const next = prev === 'asc' ? 'desc' : 'asc';
      onStateChange?.({ ...state, sortOrder: next });
      return next;
    });
  }, [state, onStateChange]);

  const setSortBy = useCallback(
    (field: string, order?: 'asc' | 'desc') => {
      setSortByState(field);
      if (order) {
        setSortOrderState(order);
      }
      onStateChange?.({
        ...state,
        sortBy: field,
        sortOrder: order ?? state.sortOrder,
      });
    },
    [state, onStateChange]
  );

  const setPage = useCallback(
    (newPage: number) => {
      const clampedPage = Math.max(1, Math.min(newPage, totalPages || 1));
      setPageState(clampedPage);
      onStateChange?.({ ...state, page: clampedPage });
    },
    [state, totalPages, onStateChange]
  );

  const setPageSize = useCallback(
    (size: number) => {
      setPageSizeState(size);
      setPageState(1); // Reset to first page on page size change
      onStateChange?.({ ...state, pageSize: size, page: 1 });
    },
    [state, onStateChange]
  );

  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  }, [page, totalPages, setPage]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page, setPage]);

  // =========================================================================
  // Return
  // =========================================================================

  return {
    // State
    search,
    debouncedSearch,
    filters,
    sortBy,
    sortOrder,
    page,
    pageSize,

    // Computed (client-side)
    filteredItems,
    sortedItems,
    paginatedItems,
    totalPages,
    filteredCount: filteredItems.length,
    hasActiveFilters,

    // Actions
    setSearch,
    setFilter,
    setFilters,
    clearFilters,
    reset,
    setSort,
    toggleSortOrder,
    setSortBy,
    setPage,
    setPageSize,
    nextPage,
    prevPage,

    // Query params
    queryParams,
    state,
  };
}
