export { ListPage } from './ListPage';
export type {
  ListPageProps,
  ListPageQueryResult,
  ListState,
  ListStateActions,
  ListPageUseQuery,
  ListPageProcedure,
  // Controlled state types (external state management)
  ControlledListState,
  ControlledListStateField,
  OnListStateChange,
  DefaultListState,
  // Card mode types (ADR-0051)
  CardActionConfig,
  CardActionsConfig,
  CardActionConfirm,
  CardSectionConfig,
  CardSortConfig,
  CardSortOption,
  CardFilterConfig,
  CardFilterOption,
  CardStatsSectionConfig,
  CardStatsCard,
  CardStatsTrend,
  CardSkeletonConfig,
  EmptySearchStateConfig,
  ListPageSlots,
  // Graph mode types
  GraphEdge,
  GraphViewConfig,
  GraphNodePosition,
} from './types';

// Re-export unified action types from shared for convenience
export type {
  UnifiedActionConfig,
  UnifiedActionsConfig,
  UnifiedActionConfirm,
  ActionVisibility,
} from '../shared/types';

// ViewMode types and hook (ADR-0051)
export {
  useViewMode,
  type ViewMode,
  type ResolvedViewMode,
  type UseViewModeOptions,
  type UseViewModeResult,
} from './hooks';

// Unified Actions hook (ListPage Unified API)
export {
  useUnifiedActions,
  type UseUnifiedActionsOptions,
  type UseUnifiedActionsResult,
} from './hooks';

// Controlled State hook (external state management)
export {
  useControlledState,
  type UseControlledStateOptions,
  type UseControlledStateResult,
} from './hooks';

// Query hook (extracted query resolution logic)
export {
  useListPageQuery,
  type UseListPageQueryOptions,
  type UseListPageQueryResult,
} from './hooks';

// Filters hook (extracted filter sync logic)
export {
  useListPageFilters,
  type UseListPageFiltersOptions,
  type UseListPageFiltersResult,
} from './hooks';

// Context (for advanced use cases)
export {
  ListPageContext,
  useListPageContext,
  useListPageContextOptional,
  ListPageProvider,
  type ListPageContextValue,
  type ListPageContextType,
  type ListPageContextLabels,
  type ListPageProviderProps,
} from './context';

// Unified Filters hook (ListPage Unified API)
export {
  useUnifiedFilters,
  type UseUnifiedFiltersOptions,
  type UseUnifiedFiltersResult,
} from './hooks';

// Re-export unified filter types from shared for convenience
export type { CardFilterRenderMode } from '../shared/types';

// Unified Sort hook (ListPage Unified API)
export {
  useUnifiedSort,
  type UseUnifiedSortOptions,
  type UseUnifiedSortResult,
  type TableSortConfig,
} from './hooks';

// Re-export unified sort types from shared for convenience
export type {
  SortDirection,
  UnifiedSortOption,
  UnifiedSortConfig,
} from '../shared/types';

// ViewModeToggle component
export { ViewModeToggle, type ViewModeToggleProps } from './components';

// ListPageSkeleton component
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
} from './components';

// GraphView components and types
export {
  // Lazy-loaded (recommended for most use cases)
  LazyGraphView,
  type LazyGraphViewProps,
  // Direct import (for cases where bundle size isn't a concern)
  GraphView,
  type GraphViewProps,
  // Skeleton
  GraphViewSkeleton,
  type GraphViewSkeletonProps,
  // Node components
  DefaultGraphNode,
  CustomGraphNode,
  type DefaultNodeData,
  type CustomNodeData,
  // Layout utilities
  calculateSpiralLayout,
  calculateGridLayout,
  calculateConnectionCounts,
  type LayoutNode,
} from './components';
