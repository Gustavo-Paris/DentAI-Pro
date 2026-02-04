'use client';

import { useState, useMemo, useCallback } from 'react';

/**
 * useTableState - Table State Management Hook
 *
 * Consolidates common table state management logic for filters, sorting,
 * pagination, and selection. Extracted from PageTable and ListPage components.
 *
 * @example Basic usage
 * ```tsx
 * const tableState = useTableState({
 *   data: users,
 *   searchFields: ['name', 'email'],
 * });
 *
 * return (
 *   <>
 *     <SearchInput value={tableState.search} onChange={tableState.setSearch} />
 *     <Table data={tableState.paginatedData} />
 *     <Pagination
 *       page={tableState.page}
 *       totalPages={tableState.totalPages}
 *       onPrevPage={tableState.handlePrevPage}
 *       onNextPage={tableState.handleNextPage}
 *     />
 *   </>
 * );
 * ```
 */

export interface UseTableStateOptions<T> {
  /** Data to manage */
  data: T[];
  /** Initial page number (1-indexed) */
  initialPage?: number;
  /** Initial page size */
  initialPageSize?: number;
  /** Initial sort configuration */
  initialSort?: { key: string; order: 'asc' | 'desc' };
  /** Initial filter values */
  initialFilters?: Record<string, string>;
  /** Fields to search when using search filter */
  searchFields?: (keyof T)[];
  /** Custom filter function */
  filterFn?: (item: T, search: string, filters: Record<string, string>) => boolean;
  /** Custom sort function */
  sortFn?: (a: T, b: T, sortBy: string, sortOrder: 'asc' | 'desc') => number;
}

export interface UseTableStateReturn<T> {
  // State
  search: string;
  filterValues: Record<string, string>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
  selectedKeys: Set<string>;

  // Setters
  setSearch: (value: string) => void;
  setFilterValues: (values: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  setSortBy: (key: string) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSelectedKeys: (keys: Set<string> | ((prev: Set<string>) => Set<string>)) => void;

  // Computed values
  filteredData: T[];
  sortedData: T[];
  paginatedData: T[];
  totalPages: number;
  totalItems: number;

  // Utilities
  clearSelection: () => void;
  selectAll: () => void;
  toggleSelection: (key: string) => void;
  handlePrevPage: () => void;
  handleNextPage: () => void;
  handleSortToggle: () => void;
  resetFilters: () => void;
}

/**
 * Hook for managing table state (filters, sorting, pagination, selection)
 */
export function useTableState<T extends Record<string, unknown>>({
  data,
  initialPage = 1,
  initialPageSize = 10,
  initialSort,
  initialFilters = {},
  searchFields = [],
  filterFn,
  sortFn,
}: UseTableStateOptions<T>): UseTableStateReturn<T> {
  // =========================================================================
  // State
  // =========================================================================

  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>(initialFilters);
  const [sortBy, setSortBy] = useState(initialSort?.key ?? '');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSort?.order ?? 'desc');
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // =========================================================================
  // Computed Values - Filtering
  // =========================================================================

  const filteredData = useMemo(() => {
    let result = data;

    // Apply search filter
    if (search && searchFields.length > 0) {
      const searchLower = search.toLowerCase();
      result = result.filter((item) =>
        searchFields.some((field) => {
          const value = item[field];
          return String(value ?? '').toLowerCase().includes(searchLower);
        })
      );
    }

    // Apply custom filters
    if (Object.keys(filterValues).length > 0) {
      if (filterFn) {
        result = result.filter((item) => filterFn(item, search, filterValues));
      } else {
        // Default filter: exact match on filter keys
        result = result.filter((item) => {
          return Object.entries(filterValues).every(([key, value]) => {
            if (!value || value === 'all') return true;
            return String(item[key] ?? '') === value;
          });
        });
      }
    }

    return result;
  }, [data, search, searchFields, filterValues, filterFn]);

  // =========================================================================
  // Computed Values - Sorting
  // =========================================================================

  const sortedData = useMemo(() => {
    if (!sortBy) return filteredData;

    const sorted = [...filteredData];

    if (sortFn) {
      sorted.sort((a, b) => sortFn(a, b, sortBy, sortOrder));
    } else {
      // Default sort: basic comparison
      sorted.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];

        // Handle null/undefined
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        // Compare values
        let comparison = 0;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal);
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else if (aVal instanceof Date && bVal instanceof Date) {
          comparison = aVal.getTime() - bVal.getTime();
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return sorted;
  }, [filteredData, sortBy, sortOrder, sortFn]);

  // =========================================================================
  // Computed Values - Pagination
  // =========================================================================

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(sortedData.length / pageSize));
  }, [sortedData.length, pageSize]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, page, pageSize]);

  const totalItems = filteredData.length;

  // =========================================================================
  // Handlers
  // =========================================================================

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page when search changes
  }, []);

  const handleFilterChange = useCallback(
    (values: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => {
      setFilterValues(values);
      setPage(1); // Reset to first page when filters change
    },
    []
  );

  const handleSortByChange = useCallback((key: string) => {
    setSortBy(key);
  }, []);

  const handleSortOrderChange = useCallback((order: 'asc' | 'desc') => {
    setSortOrder(order);
  }, []);

  const handleSortToggle = useCallback(() => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  const handlePrevPage = useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setPage((prev) => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  const clearSelection = useCallback(() => {
    setSelectedKeys(new Set());
  }, []);

  const selectAll = useCallback(() => {
    const allKeys = new Set(paginatedData.map((item) => String(item.id ?? item)));
    setSelectedKeys(allKeys);
  }, [paginatedData]);

  const toggleSelection = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setSearch('');
    setFilterValues({});
    setPage(1);
  }, []);

  // =========================================================================
  // Return
  // =========================================================================

  return {
    // State
    search,
    filterValues,
    sortBy,
    sortOrder,
    page,
    pageSize,
    selectedKeys,

    // Setters
    setSearch: handleSearchChange,
    setFilterValues: handleFilterChange,
    setSortBy: handleSortByChange,
    setSortOrder: handleSortOrderChange,
    setPage,
    setPageSize,
    setSelectedKeys,

    // Computed
    filteredData,
    sortedData,
    paginatedData,
    totalPages,
    totalItems,

    // Utilities
    clearSelection,
    selectAll,
    toggleSelection,
    handlePrevPage,
    handleNextPage,
    handleSortToggle,
    resetFilters,
  };
}
