/**
 * useListPageState Hook
 *
 * Extracted state management from ListPage for better separation of concerns.
 * Handles search, filters, selection, and derived state.
 *
 * @module list/hooks/useListPageState
 */

'use client';

import * as React from 'react';
import type { ListState, ListPageProps } from '../types';
import { normalizeFilters, getRowKey } from '../utils';
import type { FilterConfig } from '../../shared/types';

// =============================================================================
// Types
// =============================================================================

export interface UseListPageStateOptions<TRow> {
  // Filters
  filters?: FilterConfig[] | Record<string, Omit<FilterConfig, 'key'>>;
  // Selection
  selectable?: boolean;
  selectedIds?: Array<string | number>;
  onSelectionChange?: (ids: Array<string | number>) => void;
  // Row key
  rowKey?: ListPageProps<TRow>['rowKey'];
  // List logic integration
  listLogic: {
    page: number;
    pageSize: number;
    sortBy: string | null;
    sortOrder: 'asc' | 'desc';
  };
}

export interface UseListPageStateReturn<TRow> {
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  // Filters
  normalizedFilters: ReturnType<typeof normalizeFilters>;
  activeFilters: Record<string, string>;
  setActiveFilters: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  activeFilterCount: number;
  hasActiveFilters: boolean;
  clearAllFilters: () => void;
  handleFilterChange: (key: string, value: string) => void;
  // Selection
  selectedIds: Set<string | number>;
  handleSelectRow: (id: string | number, selected: boolean) => void;
  handleSelectAll: (selected: boolean, rows: TRow[]) => void;
  clearSelection: () => void;
  // List state (for query input)
  listState: ListState;
}

// =============================================================================
// Hook
// =============================================================================

export function useListPageState<TRow = Record<string, unknown>>(
  options: UseListPageStateOptions<TRow>
): UseListPageStateReturn<TRow> {
  const {
    filters,
    selectable,
    selectedIds: controlledSelectedIds,
    onSelectionChange,
    rowKey = 'id',
    listLogic,
  } = options;

  // ===========================================================================
  // Search State
  // ===========================================================================

  const [searchQuery, setSearchQuery] = React.useState('');

  // ===========================================================================
  // Filter State
  // ===========================================================================

  const normalizedFilters = React.useMemo(() => normalizeFilters(filters), [filters]);

  const [activeFilters, setActiveFilters] = React.useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    normalizedFilters.forEach((f) => {
      if (f.defaultValue) defaults[f.key] = f.defaultValue;
    });
    return defaults;
  });

  // Count active filters (excluding empty/"all" values)
  const activeFilterCount = Object.values(activeFilters).filter(
    (v) => v && v !== '' && v !== 'all'
  ).length;

  // Has any active filter?
  const hasActiveFilters = activeFilterCount > 0 || searchQuery.length > 0;

  // Clear all filters
  const clearAllFilters = React.useCallback(() => {
    setSearchQuery('');
    setActiveFilters({});
  }, []);

  // Handle filter change
  const handleFilterChange = React.useCallback((key: string, value: string) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ===========================================================================
  // Selection State
  // ===========================================================================

  const [internalSelectedIds, setInternalSelectedIds] = React.useState<Set<string | number>>(new Set());
  const selectedIdsSet = controlledSelectedIds ? new Set(controlledSelectedIds) : internalSelectedIds;

  const handleSelectRow = React.useCallback((id: string | number, selected: boolean) => {
    const newSet = new Set(selectedIdsSet);
    if (selected) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    if (controlledSelectedIds) {
      onSelectionChange?.(Array.from(newSet));
    } else {
      setInternalSelectedIds(newSet);
    }
  }, [selectedIdsSet, controlledSelectedIds, onSelectionChange]);

  const handleSelectAll = React.useCallback((selected: boolean, rows: TRow[]) => {
    if (selected) {
      const allIds = rows.map((row, i) => getRowKey(row, rowKey, i));
      if (controlledSelectedIds) {
        onSelectionChange?.(allIds);
      } else {
        setInternalSelectedIds(new Set(allIds));
      }
    } else {
      if (controlledSelectedIds) {
        onSelectionChange?.([]);
      } else {
        setInternalSelectedIds(new Set());
      }
    }
  }, [rowKey, controlledSelectedIds, onSelectionChange]);

  const clearSelection = React.useCallback(() => {
    if (controlledSelectedIds) {
      onSelectionChange?.([]);
    } else {
      setInternalSelectedIds(new Set());
    }
  }, [controlledSelectedIds, onSelectionChange]);

  // ===========================================================================
  // List State (for query input)
  // ===========================================================================

  const listState = React.useMemo<ListState>(() => ({
    page: listLogic.page,
    pageSize: listLogic.pageSize,
    sortKey: listLogic.sortBy || null,
    sortDirection: listLogic.sortOrder,
    filters: activeFilters,
    search: searchQuery,
    selectedIds: selectedIdsSet,
  }), [
    listLogic.page,
    listLogic.pageSize,
    listLogic.sortBy,
    listLogic.sortOrder,
    activeFilters,
    searchQuery,
    selectedIdsSet,
  ]);

  return {
    // Search
    searchQuery,
    setSearchQuery,
    // Filters
    normalizedFilters,
    activeFilters,
    setActiveFilters,
    activeFilterCount,
    hasActiveFilters,
    clearAllFilters,
    handleFilterChange,
    // Selection
    selectedIds: selectedIdsSet,
    handleSelectRow,
    handleSelectAll,
    clearSelection,
    // List state
    listState,
  };
}
