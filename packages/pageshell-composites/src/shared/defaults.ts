/**
 * Shared Defaults
 *
 * Consolidated default values for PageShell composites.
 * Single source of truth for common configurations.
 *
 * @module shared/defaults
 * @see Code Quality - Consolidation of scattered defaults
 */

// =============================================================================
// Empty State Defaults
// =============================================================================

export const EMPTY_STATE_DEFAULTS = {
  data: {
    title: 'No items found',
    description: 'Get started by creating a new item.',
  },
  search: {
    title: 'No results found',
    description: 'Try adjusting your search or filters.',
  },
  filter: {
    title: 'No items match filters',
    description: 'Remove some filters to see more results.',
  },
} as const;

// =============================================================================
// Error State Defaults
// =============================================================================

export const ERROR_STATE_DEFAULTS = {
  title: 'Error loading',
  description: 'An unexpected error occurred.',
  retryLabel: 'Try again',
} as const;

// =============================================================================
// Form Defaults
// =============================================================================

export const FORM_DEFAULTS = {
  submitText: 'Save',
  cancelText: 'Cancel',
  loadingText: 'Saving...',
  backLabel: 'Back',
  warnOnUnsavedChanges: true,
} as const;

// =============================================================================
// List Defaults
// =============================================================================

export const LIST_DEFAULTS = {
  pageSize: 10,
  pageSizes: [10, 25, 50, 100],
  searchDebounce: 300,
  searchPlaceholder: 'Search...',
} as const;

// =============================================================================
// Card List Defaults
// =============================================================================

export const CARD_LIST_DEFAULTS = {
  gridClassName: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3',
  searchDebounce: 300,
  emptyState: EMPTY_STATE_DEFAULTS.data,
  skeletonConfig: {
    count: 6,
    columns: 3 as const,
    showStats: false,
    showHeader: true,
  },
} as const;

// =============================================================================
// Infinite Card List Defaults
// =============================================================================

export const INFINITE_CARD_LIST_DEFAULTS = {
  loadMoreText: 'Load more',
  loadingText: 'Loading...',
  showLoadMoreIcon: true,
  showCount: true,
  cardsClassName: 'space-y-4',
  skeletonCount: 3,
  emptyState: {
    title: 'No items found',
    description: 'There are no items to display',
  },
  emptyFilterState: {
    title: 'No results',
    description: 'Try adjusting your filters',
    showClearButton: true,
  },
} as const;

// =============================================================================
// Skeleton Defaults
// =============================================================================

export const SKELETON_DEFAULTS = {
  list: {
    rows: 5,
    columns: 4,
    showHeader: true,
    showPagination: true,
  },
  cardGrid: {
    count: 6,
    columns: 3,
  },
  form: {
    fields: 4,
  },
  stats: {
    count: 4,
  },
} as const;

// =============================================================================
// Pagination Defaults
// =============================================================================

export const PAGINATION_DEFAULTS = {
  pageSizes: [10, 25, 50, 100],
  defaultPageSize: 10,
  showSizeChanger: true,
  showTotal: true,
} as const;

// =============================================================================
// Dialog/Modal Defaults
// =============================================================================

export const DIALOG_DEFAULTS = {
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  deleteLabel: 'Delete',
  deleteTitle: 'Confirm deletion',
  deleteDescription: 'This action cannot be undone.',
} as const;

// =============================================================================
// Export Combined Defaults
// =============================================================================

/**
 * All defaults in a single object for easy access.
 */
export const COMPOSITE_DEFAULTS = {
  emptyState: EMPTY_STATE_DEFAULTS,
  errorState: ERROR_STATE_DEFAULTS,
  form: FORM_DEFAULTS,
  list: LIST_DEFAULTS,
  cardList: CARD_LIST_DEFAULTS,
  infiniteCardList: INFINITE_CARD_LIST_DEFAULTS,
  skeleton: SKELETON_DEFAULTS,
  pagination: PAGINATION_DEFAULTS,
  dialog: DIALOG_DEFAULTS,
} as const;
