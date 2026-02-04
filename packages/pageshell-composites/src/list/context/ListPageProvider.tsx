/**
 * ListPageProvider
 *
 * Provider component that aggregates all ListPage state and makes it
 * available to sub-components via context.
 *
 * This is an internal component used by ListPage. For most use cases,
 * you don't need to use this directly - just use ListPage.
 *
 * @see ADR-0102: ListPage Context Decomposition
 * @module list/context/ListPageProvider
 */

'use client';

import * as React from 'react';
import {
  ListPageContext,
  type ListPageContextValue,
  type ListPageContextLabels,
} from './ListPageContext';
import type { ColumnConfig, RowActionsConfig } from '../../shared/types';
import type { CardActionsConfig, ListState, ResolvedViewMode } from '../types';

// =============================================================================
// Types
// =============================================================================

/**
 * Props for ListPageProvider
 */
export interface ListPageProviderProps<TRow = unknown, TData = unknown> {
  /** Child components */
  children: React.ReactNode;

  // View state
  viewMode: ResolvedViewMode;
  isTableView: boolean;
  isCardsView: boolean;
  isGraphView: boolean;
  isToggleEnabled: boolean;
  setViewMode: (mode: ResolvedViewMode) => void;

  // Data state
  rows: TRow[];
  total: number;
  isLoading: boolean;
  data?: TData;

  // Filter state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilters: Record<string, string>;
  setFilter: (key: string, value: string) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;

  // Selection state
  selectable: boolean;
  selectedIds: Set<string | number>;
  handleSelectRow: (id: string | number, selected: boolean) => void;
  handleSelectAll: (selected: boolean) => void;
  clearSelection: () => void;

  // Pagination state
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  // Sort state
  sortKey: string | null;
  sortDirection: 'asc' | 'desc';
  setSort: (key: string, direction: 'asc' | 'desc') => void;

  // Actions
  rowActions?: RowActionsConfig<TRow>;
  cardActions?: CardActionsConfig<TRow>;

  // Config
  rowKey: string | ((row: TRow) => string | number);
  columns?: ColumnConfig<TRow>[];
  labels: ListPageContextLabels;
  listState: ListState;
}

// =============================================================================
// Component
// =============================================================================

/**
 * ListPageProvider - Context provider for ListPage state
 *
 * Wraps sub-components and provides shared state via context.
 * Memoizes the context value to prevent unnecessary re-renders.
 *
 * @example Internal usage (within ListPage)
 * ```tsx
 * function ListPage(props) {
 *   // ... state setup ...
 *   return (
 *     <ListPageProvider
 *       viewMode={viewMode}
 *       rows={rows}
 *       // ... other state ...
 *     >
 *       <ListPageHeader />
 *       <ListPageFilters />
 *       <ListPageTable />
 *     </ListPageProvider>
 *   );
 * }
 * ```
 */
export function ListPageProvider<TRow = unknown, TData = unknown>({
  children,
  // View state
  viewMode,
  isTableView,
  isCardsView,
  isGraphView,
  isToggleEnabled,
  setViewMode,
  // Data state
  rows,
  total,
  isLoading,
  data,
  // Filter state
  searchQuery,
  setSearchQuery,
  activeFilters,
  setFilter,
  hasActiveFilters,
  clearFilters,
  // Selection state
  selectable,
  selectedIds,
  handleSelectRow,
  handleSelectAll,
  clearSelection,
  // Pagination state
  page,
  pageSize,
  setPage,
  setPageSize,
  // Sort state
  sortKey,
  sortDirection,
  setSort,
  // Actions
  rowActions,
  cardActions,
  // Config
  rowKey,
  columns,
  labels,
  listState,
}: ListPageProviderProps<TRow, TData>) {
  // Memoize context value to prevent re-renders when value object changes
  // Only re-create when actual values change
  const contextValue = React.useMemo<ListPageContextValue<TRow, TData>>(
    () => ({
      // View state
      viewMode,
      isTableView,
      isCardsView,
      isGraphView,
      isToggleEnabled,
      setViewMode,
      // Data state
      rows,
      total,
      isLoading,
      data,
      // Filter state
      searchQuery,
      setSearchQuery,
      activeFilters,
      setFilter,
      hasActiveFilters,
      clearFilters,
      // Selection state
      selectable,
      selectedIds,
      handleSelectRow,
      handleSelectAll,
      clearSelection,
      // Pagination state
      page,
      pageSize,
      setPage,
      setPageSize,
      // Sort state
      sortKey,
      sortDirection,
      setSort,
      // Actions
      rowActions,
      cardActions,
      // Config
      rowKey,
      columns,
      labels,
      listState,
    }),
    [
      // View state
      viewMode,
      isTableView,
      isCardsView,
      isGraphView,
      isToggleEnabled,
      setViewMode,
      // Data state
      rows,
      total,
      isLoading,
      data,
      // Filter state
      searchQuery,
      setSearchQuery,
      activeFilters,
      setFilter,
      hasActiveFilters,
      clearFilters,
      // Selection state
      selectable,
      selectedIds,
      handleSelectRow,
      handleSelectAll,
      clearSelection,
      // Pagination state
      page,
      pageSize,
      setPage,
      setPageSize,
      // Sort state
      sortKey,
      sortDirection,
      setSort,
      // Actions
      rowActions,
      cardActions,
      // Config
      rowKey,
      columns,
      labels,
      listState,
    ]
  );

  return (
    <ListPageContext.Provider value={contextValue as ListPageContextValue}>
      {children}
    </ListPageContext.Provider>
  );
}

ListPageProvider.displayName = 'ListPageProvider';
