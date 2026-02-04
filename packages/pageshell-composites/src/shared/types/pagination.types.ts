/**
 * Pagination Configuration Types
 *
 * Pagination settings for lists and tables.
 *
 * @module shared/types/pagination
 */

// =============================================================================
// Pagination Types
// =============================================================================

/**
 * Pagination type
 */
export type PaginationType = 'cursor' | 'offset' | 'none';

// =============================================================================
// Offset Pagination State
// =============================================================================

/**
 * Offset pagination state (for controlled pagination)
 */
export interface OffsetPaginationState {
  /** Current page number (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  total: number;
}

/**
 * Offset pagination handlers
 */
export interface OffsetPaginationHandlers {
  /** Page change handler */
  onPageChange: (page: number) => void;
  /** Page size change handler (optional) */
  onPageSizeChange?: (pageSize: number) => void;
}

/**
 * Complete offset pagination configuration
 */
export interface OffsetPaginationConfig extends OffsetPaginationState, OffsetPaginationHandlers {
  /** Pagination type discriminator */
  type: 'offset';
}

// =============================================================================
// Pagination Configuration
// =============================================================================

/**
 * Pagination configuration (legacy for cursor-based)
 */
export interface PaginationConfig {
  /** Page size options */
  pageSizes?: number[];
  /** Default page size */
  defaultPageSize?: number;
  /** Show page size selector? */
  showSizeChanger?: boolean;
  /** Show total count? */
  showTotal?: boolean;
  /** Pagination style variant */
  variant?: 'simple' | 'detailed' | 'counts';
}
