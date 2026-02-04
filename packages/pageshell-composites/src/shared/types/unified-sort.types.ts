/**
 * Unified Sort Configuration Types
 *
 * Unified sort configuration that works for both table and card modes.
 * Part of the ListPage Unified API.
 *
 * @module shared/types/unified-sort
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort option in the unified sort configuration
 */
export interface UnifiedSortOption<TItem = unknown> {
  /**
   * Sort key (used for server-side sorting and as identifier)
   */
  value: string;

  /**
   * Display label for the sort option
   */
  label: string;

  /**
   * Default sort direction for this option
   * @default 'asc'
   */
  direction?: SortDirection;

  /**
   * Custom compare function for client-side sorting.
   * If not provided, auto-inferred from field type:
   * - string → localeCompare
   * - number → numeric comparison
   * - Date → date comparison
   */
  compare?: (a: TItem, b: TItem) => number;
}

/**
 * Unified sort configuration
 *
 * Works for both table and card modes:
 * - Table: Column headers clickable, server-side sorting via query params
 * - Card: Dropdown selector, client-side sorting
 *
 * @example
 * ```tsx
 * sort={{
 *   options: [
 *     { value: 'progress', label: 'Progress', direction: 'desc' },
 *     { value: 'title', label: 'Title', direction: 'asc' },
 *     { value: 'createdAt', label: 'Date', direction: 'desc' },
 *   ],
 *   default: 'progress',
 * }}
 * ```
 */
export interface UnifiedSortConfig<TItem = unknown> {
  /**
   * Available sort options
   */
  options: UnifiedSortOption<TItem>[];

  /**
   * Default sort option value
   */
  default: string;

  /**
   * Default sort direction (applies when direction not specified in option)
   * @default 'asc'
   */
  defaultDirection?: SortDirection;

  /**
   * Force client-side sorting even in table mode.
   * Useful when data is already fully loaded.
   * @default true for card mode, false for table mode
   */
  clientSide?: boolean;
}
