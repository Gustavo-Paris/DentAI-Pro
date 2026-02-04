/**
 * ListPageContext
 *
 * Context for sharing state across ListPage sub-components.
 * Eliminates prop drilling and enables composable sub-components.
 *
 * @see ADR-0102: ListPage Context Decomposition
 * @module list/context/ListPageContext
 */

'use client';

import * as React from 'react';
import type { ColumnConfig, RowActionsConfig } from '../../shared/types';
import type { CardActionsConfig, ListState, ResolvedViewMode } from '../types';

// =============================================================================
// Types
// =============================================================================

/**
 * Resolved labels for i18n support
 */
export interface ListPageContextLabels {
  search: {
    placeholder: string;
    clear?: string;
  };
  pagination: {
    showing: string;
    to: string;
    of: string;
    items: string;
  };
  selection: {
    itemSelected: string;
    itemsSelected: string;
    clearSelection?: string;
  };
  emptyState: {
    title: string;
    description: string;
  };
}

/**
 * ListPage context value interface
 *
 * Contains all shared state and handlers for ListPage sub-components.
 * Generic types allow proper typing of row data.
 */
export interface ListPageContextValue<TRow = unknown, TData = unknown> {
  // ---------------------------------------------------------------------------
  // View State
  // ---------------------------------------------------------------------------

  /** Current resolved view mode (never 'auto') */
  viewMode: ResolvedViewMode;
  /** Whether currently showing table view */
  isTableView: boolean;
  /** Whether currently showing cards view */
  isCardsView: boolean;
  /** Whether currently showing graph view */
  isGraphView: boolean;
  /** Whether view toggle is enabled */
  isToggleEnabled: boolean;
  /** Set view mode (only works when toggle enabled) */
  setViewMode: (mode: ResolvedViewMode) => void;

  // ---------------------------------------------------------------------------
  // Data State
  // ---------------------------------------------------------------------------

  /** Current rows to display */
  rows: TRow[];
  /** Total count (for pagination) */
  total: number;
  /** Loading state */
  isLoading: boolean;
  /** Raw query data */
  data?: TData;

  // ---------------------------------------------------------------------------
  // Filter State
  // ---------------------------------------------------------------------------

  /** Current search query */
  searchQuery: string;
  /** Update search query */
  setSearchQuery: (query: string) => void;
  /** Active filter values by key */
  activeFilters: Record<string, string>;
  /** Update a single filter */
  setFilter: (key: string, value: string) => void;
  /** Whether any filters or search are active */
  hasActiveFilters: boolean;
  /** Clear all filters and search */
  clearFilters: () => void;

  // ---------------------------------------------------------------------------
  // Selection State
  // ---------------------------------------------------------------------------

  /** Whether selection is enabled */
  selectable: boolean;
  /** Currently selected row IDs */
  selectedIds: Set<string | number>;
  /** Handle row selection toggle */
  handleSelectRow: (id: string | number, selected: boolean) => void;
  /** Handle select/deselect all */
  handleSelectAll: (selected: boolean) => void;
  /** Clear all selections */
  clearSelection: () => void;

  // ---------------------------------------------------------------------------
  // Pagination State
  // ---------------------------------------------------------------------------

  /** Current page (1-indexed) */
  page: number;
  /** Page size */
  pageSize: number;
  /** Update page */
  setPage: (page: number) => void;
  /** Update page size */
  setPageSize: (size: number) => void;

  // ---------------------------------------------------------------------------
  // Sort State
  // ---------------------------------------------------------------------------

  /** Current sort column key */
  sortKey: string | null;
  /** Current sort direction */
  sortDirection: 'asc' | 'desc';
  /** Update sort */
  setSort: (key: string, direction: 'asc' | 'desc') => void;

  // ---------------------------------------------------------------------------
  // Actions Configuration
  // ---------------------------------------------------------------------------

  /** Resolved row actions for table view */
  rowActions?: RowActionsConfig<TRow>;
  /** Resolved card actions for card view */
  cardActions?: CardActionsConfig<TRow>;

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  /** Row key accessor */
  rowKey: string | ((row: TRow) => string | number);
  /** Column configuration (table view) */
  columns?: ColumnConfig<TRow>[];
  /** Resolved i18n labels */
  labels: ListPageContextLabels;
  /** Current list state (for query input) */
  listState: ListState;
}

// =============================================================================
// Context
// =============================================================================

/**
 * ListPage context with default undefined value.
 * Must be used within a ListPageProvider.
 */
const ListPageContext = React.createContext<ListPageContextValue | undefined>(
  undefined
);

ListPageContext.displayName = 'ListPageContext';

// =============================================================================
// Hook
// =============================================================================

/**
 * useListPageContext - Access ListPage shared state
 *
 * Must be used within a ListPage or ListPageProvider.
 * Throws if used outside of context.
 *
 * @example Basic usage in sub-component
 * ```tsx
 * function MyTableRow({ row }: { row: User }) {
 *   const { selectedIds, handleSelectRow, rowKey } = useListPageContext();
 *   const id = typeof rowKey === 'function' ? rowKey(row) : row[rowKey];
 *   const isSelected = selectedIds.has(id);
 *
 *   return (
 *     <tr onClick={() => handleSelectRow(id, !isSelected)}>
 *       ...
 *     </tr>
 *   );
 * }
 * ```
 *
 * @example With type safety
 * ```tsx
 * function MyComponent() {
 *   const { rows, rowActions } = useListPageContext<User>();
 *   // rows is typed as User[]
 *   // rowActions is typed as RowActionsConfig<User>
 * }
 * ```
 */
export function useListPageContext<
  TRow = unknown,
  TData = unknown,
>(): ListPageContextValue<TRow, TData> {
  const context = React.useContext(ListPageContext);

  if (context === undefined) {
    throw new Error(
      'useListPageContext must be used within a ListPage or ListPageProvider. ' +
      'Make sure your component is wrapped in a ListPage composite.'
    );
  }

  return context as ListPageContextValue<TRow, TData>;
}

/**
 * Optional context hook that doesn't throw
 * Returns undefined if used outside of context
 */
export function useListPageContextOptional<
  TRow = unknown,
  TData = unknown,
>(): ListPageContextValue<TRow, TData> | undefined {
  const context = React.useContext(ListPageContext);
  return context as ListPageContextValue<TRow, TData> | undefined;
}

// =============================================================================
// Export
// =============================================================================

export { ListPageContext };
export type { ListPageContextValue as ListPageContextType };
