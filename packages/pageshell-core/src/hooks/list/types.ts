/**
 * List Logic Types
 *
 * @module hooks/list
 */

// =============================================================================
// Filter Types
// =============================================================================

/**
 * Filter configuration
 */
export interface ListFilterConfig {
  /** Filter options */
  options: Array<string | { value: string; label: string }>;
  /** Default value */
  defaultValue?: string;
  /** Filter label */
  label?: string;
}

// =============================================================================
// Sort Types
// =============================================================================

/**
 * Sort configuration
 */
export interface ListSortConfig {
  /** Available sort options */
  options: Array<{ value: string; label: string }>;
  /** Default sort key */
  default?: string;
  /** Default sort order */
  defaultOrder?: 'asc' | 'desc';
  /** Compare function for client-side sorting */
  compareFn?: (sortKey: string) => (a: unknown, b: unknown) => number;
}

// =============================================================================
// Pagination Types
// =============================================================================

/**
 * Pagination configuration
 */
export interface ListPaginationConfig {
  /** Items per page */
  pageSize?: number;
  /** Pagination type */
  type?: 'pages' | 'infinite' | 'none';
}

// =============================================================================
// State Types
// =============================================================================

/**
 * List state
 */
export interface ListState {
  /** Current search query */
  search: string;
  /** Current filter values by key */
  filters: Record<string, string>;
  /** Current sort field */
  sortBy: string;
  /** Current sort order */
  sortOrder: 'asc' | 'desc';
  /** Current page (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
}

/**
 * Query params for server-side fetching
 */
export interface ListQueryParams {
  search: string;
  filters: Record<string, string>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
  /** Calculated offset for SQL LIMIT/OFFSET */
  offset: number;
}

// =============================================================================
// Hook Options
// =============================================================================

/**
 * useListLogic options
 */
export interface UseListLogicOptions<TItem> {
  // Data (for client-side filtering)
  /** Items to filter/sort/paginate (client-side) */
  items?: TItem[];

  // Search
  /** Fields to search in (for client-side search, supports dot notation) */
  searchFields?: string[];
  /** Search debounce delay in ms */
  searchDebounceMs?: number;
  /** Initial search value */
  initialSearch?: string;

  // Filters
  /** Filter configurations */
  filters?: Record<string, ListFilterConfig>;
  /** Initial filter values */
  initialFilters?: Record<string, string>;

  // Sort
  /** Sort configuration */
  sort?: ListSortConfig;

  // Pagination
  /** Page size */
  pageSize?: number;
  /** Initial page (1-indexed) */
  initialPage?: number;

  // Callbacks
  /** Called when any state changes */
  onStateChange?: (state: ListState) => void;
  /** Called when filters reset */
  onReset?: () => void;
}

// =============================================================================
// Hook Return Type
// =============================================================================

/**
 * useListLogic return type
 */
export interface UseListLogicReturn<TItem> {
  // Raw state
  /** Current search query (immediate, not debounced) */
  search: string;
  /** Debounced search query */
  debouncedSearch: string;
  /** Current filter values */
  filters: Record<string, string>;
  /** Current sort field */
  sortBy: string;
  /** Current sort order */
  sortOrder: 'asc' | 'desc';
  /** Current page (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;

  // Computed (client-side only)
  /** Items after search filter (requires items prop) */
  filteredItems: TItem[];
  /** Items after sort (requires items prop) */
  sortedItems: TItem[];
  /** Items after pagination (requires items prop) */
  paginatedItems: TItem[];
  /** Total number of pages */
  totalPages: number;
  /** Total filtered count */
  filteredCount: number;
  /** Whether any filters are active */
  hasActiveFilters: boolean;

  // Actions
  /** Set search query */
  setSearch: (value: string) => void;
  /** Set a single filter value */
  setFilter: (key: string, value: string) => void;
  /** Set multiple filter values */
  setFilters: (filters: Record<string, string>) => void;
  /** Clear all filters and search */
  clearFilters: () => void;
  /** Reset to initial state */
  reset: () => void;
  /** Set sort field */
  setSort: (field: string) => void;
  /** Toggle sort order */
  toggleSortOrder: () => void;
  /** Set sort field and order together */
  setSortBy: (field: string, order?: 'asc' | 'desc') => void;
  /** Set current page */
  setPage: (page: number) => void;
  /** Set page size */
  setPageSize: (size: number) => void;
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  prevPage: () => void;

  // Query params (for server-side fetching)
  /** Query params object for API calls */
  queryParams: ListQueryParams;
  /** Full state object */
  state: ListState;
}
