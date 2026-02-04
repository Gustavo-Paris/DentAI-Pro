/**
 * useListPageQuery Hook
 *
 * Extracts query resolution and data processing logic from ListPage.
 * Handles multiple data sources: items, useQuery, procedure, query.
 *
 * @see ADR-0102: ListPage Context Decomposition
 * @module list/hooks/useListPageQuery
 */

'use client';

import * as React from 'react';
import type { ListState, ListPageQueryResult, ListPageUseQuery, ListPageProcedure } from '../types';
import type { CompositeQueryResult } from '../../shared/types';
import { extractArrayFromData, extractTotalFromData } from '../../shared/utils';

// =============================================================================
// Types
// =============================================================================

/**
 * Options for useListPageQuery hook
 */
export interface UseListPageQueryOptions<TRow, TData, TInput = ListState> {
  /**
   * Direct items array (highest priority).
   * When provided, used instead of query.
   */
  items?: TRow[];

  /**
   * Direct loading state (for items mode).
   */
  isLoading?: boolean;

  /**
   * Hook factory - creates query with state params.
   * Second priority after items.
   */
  useQuery?: ListPageUseQuery<TData, TInput>;

  /**
   * tRPC procedure reference.
   * Third priority.
   */
  procedure?: ListPageProcedure<TData, TInput>;

  /**
   * Pre-executed query result.
   * Lowest priority.
   */
  query?: CompositeQueryResult<TData>;

  /**
   * Map internal state to query input format.
   */
  queryInput?: (state: ListState) => TInput | Partial<TInput>;

  /**
   * Current list state for query input.
   */
  listState: ListState;

  /**
   * Extract rows array from query data.
   */
  getRows?: (data: TData) => TRow[];

  /**
   * Extract total count from query data.
   */
  getTotal?: (data: TData) => number;

  /**
   * Client-side sorted items from useListLogic.
   * Used when client-side filtering is enabled.
   */
  sortedItems?: TRow[];

  /**
   * Filtered count from useListLogic.
   * Used when client-side filtering is enabled.
   */
  filteredCount?: number;

  /**
   * Whether client-side filtering is enabled.
   */
  useClientSideFiltering?: boolean;

  /**
   * Sort config for client-side sorting.
   */
  cardSortConfig?: {
    compareFn: (sortKey: string) => (a: TRow, b: TRow) => number;
  };

  /**
   * Current sort key from listLogic.
   */
  sortKey?: string | null;
}

/**
 * Result from useListPageQuery hook
 */
export interface UseListPageQueryResult<TRow, TData> {
  /** Processed rows ready for display */
  rows: TRow[];
  /** Total count for pagination */
  total: number;
  /** Loading state */
  isLoading: boolean;
  /** Raw query data */
  data?: TData;
  /** Query object (for refetch, etc.) */
  query?: ListPageQueryResult<TData>;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * useListPageQuery - Unified query resolution for ListPage
 *
 * Handles the complexity of multiple data sources with consistent output.
 * Priority order: items > useQuery > procedure > query
 *
 * @example Basic usage with useQuery
 * ```tsx
 * const { rows, total, isLoading } = useListPageQuery({
 *   useQuery: (state) => api.users.list.useQuery(state),
 *   listState,
 * });
 * ```
 *
 * @example With direct items
 * ```tsx
 * const { rows, total, isLoading } = useListPageQuery({
 *   items: myItems,
 *   isLoading: false,
 *   listState,
 * });
 * ```
 *
 * @example With custom data extraction
 * ```tsx
 * const { rows, total } = useListPageQuery({
 *   useQuery: (state) => api.users.list.useQuery(state),
 *   listState,
 *   getRows: (data) => data.users,
 *   getTotal: (data) => data.metadata.total,
 * });
 * ```
 */
export function useListPageQuery<TRow, TData, TInput = ListState>(
  options: UseListPageQueryOptions<TRow, TData, TInput>
): UseListPageQueryResult<TRow, TData> {
  const {
    items: directItems,
    isLoading: directIsLoading,
    useQuery: useQueryFactory,
    procedure,
    query: directQuery,
    queryInput,
    listState,
    getRows = extractArrayFromData as (data: TData) => TRow[],
    getTotal,
    sortedItems,
    filteredCount,
    useClientSideFiltering = false,
    cardSortConfig,
    sortKey,
  } = options;

  // Map ListState to query input format
  const resolvedQueryInput = React.useMemo<TInput>(() => {
    if (queryInput) {
      return queryInput(listState) as TInput;
    }
    return listState as unknown as TInput;
  }, [queryInput, listState]);

  // Resolve query - priority: items > useQuery > procedure > query
  //
  // NOTE: These conditional hook calls are safe because:
  // 1. Props (useQueryFactory, procedure) are stable and don't change between renders
  // 2. The condition order is consistent across the component lifecycle
  // 3. Only ONE query source should be provided per component instance
  //
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Safe: props are stable
  const factoryQuery = useQueryFactory ? useQueryFactory(resolvedQueryInput) : null;
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Safe: props are stable
  const procedureQuery = procedure ? procedure.useQuery(resolvedQueryInput) : null;

  // Use resolved query (priority: items > factory > procedure > direct)
  const query = React.useMemo(() => {
    // When directItems is provided, create a synthetic query object
    if (directItems !== undefined) {
      return {
        data: directItems as unknown as TData,
        isLoading: directIsLoading ?? false,
      } as ListPageQueryResult<TData>;
    }
    // When loading with items prop, create a synthetic loading query
    if (directIsLoading) {
      return {
        data: undefined as unknown as TData,
        isLoading: true,
      } as ListPageQueryResult<TData>;
    }
    return factoryQuery || procedureQuery || directQuery;
  }, [directItems, directIsLoading, factoryQuery, procedureQuery, directQuery]);

  // Process rows
  const rows = React.useMemo<TRow[]>(() => {
    // When using client-side filtering, use listLogic's sorted/filtered items
    if (useClientSideFiltering && sortedItems) {
      return sortedItems;
    }
    // When using direct items without filtering, return them directly
    if (directItems !== undefined) {
      // Apply client-side sorting if cardSortConfig is provided
      if (cardSortConfig && sortKey) {
        const sorted = [...directItems].sort(cardSortConfig.compareFn(sortKey));
        return sorted;
      }
      return directItems;
    }
    if (!query?.data) return [];
    return getRows(query.data);
  }, [
    useClientSideFiltering,
    sortedItems,
    sortKey,
    directItems,
    cardSortConfig,
    query?.data,
    getRows,
  ]);

  // Calculate total
  const total = React.useMemo<number>(() => {
    // When using client-side filtering, use filtered count
    if (useClientSideFiltering && filteredCount !== undefined) {
      return filteredCount;
    }
    // Server-side data: use getTotal or extract from data
    if (!query?.data) return 0;
    return getTotal
      ? getTotal(query.data)
      : extractTotalFromData(query.data as unknown, rows.length);
  }, [useClientSideFiltering, filteredCount, query?.data, getTotal, rows.length]);

  // Resolve loading state
  const isLoading = directIsLoading ?? query?.isLoading ?? false;

  return {
    rows,
    total,
    isLoading,
    data: query?.data,
    query: query as ListPageQueryResult<TData> | undefined,
  };
}
