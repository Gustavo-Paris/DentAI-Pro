/**
 * ListPage Sub-components
 *
 * Extracted components for the ListPage composite.
 * Organized into shared/, table/, and cards/ subfolders for viewMode support.
 *
 * @see ADR-0042: ListPage Sub-Component Extraction
 * @see ADR-0051: ListPage + CardListPage Consolidation
 *
 * @module list/components
 */

// =============================================================================
// Shared Components (used by both table and cards modes)
// =============================================================================

export {
  ListPageHeader,
  type ListPageHeaderProps,
  // Filters
  ListPageFilters as ListPageFiltersNew,
  type ListPageFiltersProps as ListPageFiltersPropsNew,
  type UnifiedFilterConfig,
  type SortConfig,
  type SortOption,
  // Empty State
  ListPageEmptyState,
  type ListPageEmptyStateProps,
  // Confirm Dialog
  ListPageConfirmDialog as ListPageConfirmDialogNew,
  type ListPageConfirmDialogProps as ListPageConfirmDialogPropsNew,
  type ConfirmDialogConfig as ConfirmDialogConfigNew,
  type ConfirmDialogState as ConfirmDialogStateNew,
  // View Mode Toggle
  ViewModeToggle,
  type ViewModeToggleProps,
} from './shared';

// =============================================================================
// Offset Pagination (for external state management)
// =============================================================================

export {
  OffsetPagination,
  type OffsetPaginationProps,
} from './OffsetPagination';

// =============================================================================
// Legacy Exports (backward compatibility - will be deprecated)
// =============================================================================

export {
  ListPageConfirmDialog,
  useConfirmDialog,
  type ConfirmDialogConfig,
  type ConfirmDialogState,
  type ListPageConfirmDialogProps,
} from './ListPageConfirmDialog';

export {
  ListPagePagination,
  type ListPagePaginationProps,
} from './ListPagePagination';

export {
  ListPageStats,
  type ListPageStatsProps,
} from './ListPageStats';

export {
  ListPageFilters,
  type ListPageFiltersProps,
} from './ListPageFilters';

// =============================================================================
// Table View Components
// =============================================================================

export {
  ListPageBulkActions,
  type ListPageBulkActionsProps,
} from './ListPageBulkActions';

export {
  ListPageTable,
  type ListPageTableProps,
} from './ListPageTable';

export {
  ListPageCard,
  type ListPageCardProps,
} from './ListPageCard';

export {
  ListPageSkeleton,
  ListPageHeaderSkeleton,
  ListPageFiltersSkeleton,
  ListPageStatsSkeleton,
  ListPageTableSkeleton,
  ListPageCardSkeleton,
  ListPageCardCompactSkeleton,
  ListPageCardsGridSkeleton,
  ListPagePaginationSkeleton,
  type ListPageSkeletonProps,
} from './ListPageSkeleton';

// =============================================================================
// Cards View Components (re-exported from card-list for now)
// =============================================================================

export * from './cards';

// =============================================================================
// Graph View Components
// =============================================================================

export * from './graph';
