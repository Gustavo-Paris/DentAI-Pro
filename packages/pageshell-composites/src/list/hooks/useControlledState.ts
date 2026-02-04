/**
 * useControlledState Hook
 *
 * Manages controlled vs uncontrolled state for ListPage.
 * Enables external state management (Redux, Zustand, URL params) while
 * maintaining backward compatibility with internal state.
 *
 * @module list/hooks/useControlledState
 */

'use client';

import * as React from 'react';
import type {
  ControlledListState,
  ControlledListStateField,
  OnListStateChange,
  DefaultListState,
} from '../types';

// =============================================================================
// Types
// =============================================================================

/**
 * Options for useControlledState hook
 */
export interface UseControlledStateOptions {
  /**
   * External state for controlled mode.
   * When provided, ListPage becomes controlled.
   */
  state?: ControlledListState;

  /**
   * Callback for state changes in controlled mode.
   * Called whenever internal state would change.
   */
  onStateChange?: OnListStateChange;

  /**
   * Default state for uncontrolled mode initialization.
   * Only used when `state` is not provided.
   */
  defaultState?: DefaultListState;

  // Granular controlled props (take precedence over state object)

  /** Controlled page */
  page?: number;
  /** Controlled page change handler */
  onPageChange?: (page: number) => void;

  /** Controlled page size */
  pageSize?: number;
  /** Controlled page size change handler */
  onPageSizeChange?: (pageSize: number) => void;

  /** Controlled sort key */
  sortKey?: string | null;
  /** Controlled sort direction */
  sortDirection?: 'asc' | 'desc';
  /** Controlled sort change handler */
  onSortChange?: (sortKey: string | null, sortDirection: 'asc' | 'desc') => void;

  /** Controlled filters */
  filters?: Record<string, string>;
  /** Controlled filter change handler */
  onFilterChange?: (filters: Record<string, string>) => void;

  /** Controlled search */
  search?: string;
  /** Controlled search change handler */
  onSearchChange?: (search: string) => void;

  /** Controlled selection (already in ListPageProps) */
  selectedIds?: (string | number)[];
  /** Controlled selection change handler (already in ListPageProps) */
  onSelectionChange?: (ids: (string | number)[]) => void;
}

/**
 * Result from useControlledState hook
 */
export interface UseControlledStateResult {
  /** Whether the component is in controlled mode */
  isControlled: boolean;

  /** Current resolved state (controlled or internal) */
  state: ControlledListState;

  /** Update page */
  setPage: (page: number) => void;

  /** Update page size */
  setPageSize: (pageSize: number) => void;

  /** Update sort */
  setSort: (sortKey: string | null, sortDirection: 'asc' | 'desc') => void;

  /** Update a single filter */
  setFilter: (key: string, value: string) => void;

  /** Update all filters */
  setFilters: (filters: Record<string, string>) => void;

  /** Clear all filters */
  clearFilters: () => void;

  /** Update search */
  setSearch: (search: string) => void;

  /** Update selection */
  setSelectedIds: (ids: (string | number)[]) => void;

  /** Reset to default state */
  reset: () => void;
}

// =============================================================================
// Default State
// =============================================================================

const DEFAULT_STATE: ControlledListState = {
  page: 1,
  pageSize: 10,
  sortKey: null,
  sortDirection: 'asc',
  filters: {},
  search: '',
  selectedIds: [],
};

// =============================================================================
// Hook
// =============================================================================

/**
 * useControlledState - Manages controlled vs uncontrolled state
 *
 * This hook provides a unified interface for state management that works
 * whether the component is controlled (external state) or uncontrolled
 * (internal state).
 *
 * @example Uncontrolled mode (default)
 * ```tsx
 * const { state, setPage, setFilter } = useControlledState({});
 * // State is managed internally
 * ```
 *
 * @example Fully controlled mode
 * ```tsx
 * const { state, setPage } = useControlledState({
 *   state: externalState,
 *   onStateChange: setExternalState,
 * });
 * // All changes go through onStateChange
 * ```
 *
 * @example Granular controlled mode
 * ```tsx
 * const { state, setPage } = useControlledState({
 *   page: urlParams.page,
 *   onPageChange: (page) => updateUrlParams({ page }),
 *   // Other fields use internal state
 * });
 * ```
 */
export function useControlledState(
  options: UseControlledStateOptions
): UseControlledStateResult {
  const {
    state: controlledState,
    onStateChange,
    defaultState,
    // Granular controlled props
    page: controlledPage,
    onPageChange,
    pageSize: controlledPageSize,
    onPageSizeChange,
    sortKey: controlledSortKey,
    sortDirection: controlledSortDirection,
    onSortChange,
    filters: controlledFilters,
    onFilterChange,
    search: controlledSearch,
    onSearchChange,
    selectedIds: controlledSelectedIds,
    onSelectionChange,
  } = options;

  // Determine controlled mode
  const isFullyControlled = controlledState !== undefined;
  const hasAnyControlledProp =
    controlledPage !== undefined ||
    controlledPageSize !== undefined ||
    controlledSortKey !== undefined ||
    controlledFilters !== undefined ||
    controlledSearch !== undefined ||
    controlledSelectedIds !== undefined;

  const isControlled = isFullyControlled || hasAnyControlledProp;

  // Internal state for uncontrolled mode
  const [internalState, setInternalState] = React.useState<ControlledListState>(() => ({
    ...DEFAULT_STATE,
    ...defaultState,
  }));

  // Resolve current state (controlled takes precedence)
  const resolvedState = React.useMemo<ControlledListState>(() => {
    if (isFullyControlled) {
      return controlledState;
    }

    // Merge granular controlled props with internal state
    return {
      page: controlledPage ?? internalState.page,
      pageSize: controlledPageSize ?? internalState.pageSize,
      sortKey: controlledSortKey !== undefined ? controlledSortKey : internalState.sortKey,
      sortDirection: controlledSortDirection ?? internalState.sortDirection,
      filters: controlledFilters ?? internalState.filters,
      search: controlledSearch ?? internalState.search,
      selectedIds: controlledSelectedIds ?? internalState.selectedIds,
    };
  }, [
    isFullyControlled,
    controlledState,
    controlledPage,
    controlledPageSize,
    controlledSortKey,
    controlledSortDirection,
    controlledFilters,
    controlledSearch,
    controlledSelectedIds,
    internalState,
  ]);

  // Helper to update state
  const updateState = React.useCallback(
    (updates: Partial<ControlledListState>, changedFields: ControlledListStateField[]) => {
      const newState = { ...resolvedState, ...updates };

      if (onStateChange) {
        onStateChange(newState, changedFields);
      }

      if (!isFullyControlled) {
        setInternalState((prev) => ({ ...prev, ...updates }));
      }
    },
    [resolvedState, onStateChange, isFullyControlled]
  );

  // State setters
  const setPage = React.useCallback(
    (page: number) => {
      if (onPageChange) {
        onPageChange(page);
      } else {
        updateState({ page }, ['page']);
      }
    },
    [onPageChange, updateState]
  );

  const setPageSize = React.useCallback(
    (pageSize: number) => {
      if (onPageSizeChange) {
        onPageSizeChange(pageSize);
      } else {
        // Reset to page 1 when changing page size
        updateState({ pageSize, page: 1 }, ['pageSize', 'page']);
      }
    },
    [onPageSizeChange, updateState]
  );

  const setSort = React.useCallback(
    (sortKey: string | null, sortDirection: 'asc' | 'desc') => {
      if (onSortChange) {
        onSortChange(sortKey, sortDirection);
      } else {
        updateState({ sortKey, sortDirection }, ['sortKey', 'sortDirection']);
      }
    },
    [onSortChange, updateState]
  );

  const setFilter = React.useCallback(
    (key: string, value: string) => {
      const newFilters = { ...resolvedState.filters, [key]: value };
      // Remove empty filters
      if (value === '' || value === 'all') {
        delete newFilters[key];
      }
      if (onFilterChange) {
        onFilterChange(newFilters);
      } else {
        // Reset to page 1 when changing filters
        updateState({ filters: newFilters, page: 1 }, ['filters', 'page']);
      }
    },
    [resolvedState.filters, onFilterChange, updateState]
  );

  const setFilters = React.useCallback(
    (filters: Record<string, string>) => {
      if (onFilterChange) {
        onFilterChange(filters);
      } else {
        updateState({ filters, page: 1 }, ['filters', 'page']);
      }
    },
    [onFilterChange, updateState]
  );

  const clearFilters = React.useCallback(() => {
    if (onFilterChange) {
      onFilterChange({});
    }
    if (onSearchChange) {
      onSearchChange('');
    }
    updateState({ filters: {}, search: '', page: 1 }, ['filters', 'search', 'page']);
  }, [onFilterChange, onSearchChange, updateState]);

  const setSearch = React.useCallback(
    (search: string) => {
      if (onSearchChange) {
        onSearchChange(search);
      } else {
        // Reset to page 1 when changing search
        updateState({ search, page: 1 }, ['search', 'page']);
      }
    },
    [onSearchChange, updateState]
  );

  const setSelectedIds = React.useCallback(
    (ids: (string | number)[]) => {
      if (onSelectionChange) {
        onSelectionChange(ids);
      } else {
        updateState({ selectedIds: ids }, ['selectedIds']);
      }
    },
    [onSelectionChange, updateState]
  );

  const reset = React.useCallback(() => {
    const resetState = { ...DEFAULT_STATE, ...defaultState };
    if (onStateChange) {
      onStateChange(resetState, [
        'page',
        'pageSize',
        'sortKey',
        'sortDirection',
        'filters',
        'search',
        'selectedIds',
      ]);
    }
    if (!isFullyControlled) {
      setInternalState(resetState);
    }
  }, [defaultState, onStateChange, isFullyControlled]);

  return {
    isControlled,
    state: resolvedState,
    setPage,
    setPageSize,
    setSort,
    setFilter,
    setFilters,
    clearFilters,
    setSearch,
    setSelectedIds,
    reset,
  };
}
