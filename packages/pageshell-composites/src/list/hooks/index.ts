/**
 * List Hooks
 *
 * Extracted hooks for list composites.
 *
 * @module list/hooks
 */

export {
  useListPageState,
  type UseListPageStateOptions,
  type UseListPageStateReturn,
} from './useListPageState';

export {
  useControlledState,
  type UseControlledStateOptions,
  type UseControlledStateResult,
} from './useControlledState';

export {
  useListPageQuery,
  type UseListPageQueryOptions,
  type UseListPageQueryResult,
} from './useListPageQuery';

export {
  useListPageFilters,
  type UseListPageFiltersOptions,
  type UseListPageFiltersResult,
} from './useListPageFilters';

export {
  useViewMode,
  type ViewMode,
  type ResolvedViewMode,
  type UseViewModeOptions,
  type UseViewModeResult,
} from './useViewMode';

export {
  useUnifiedActions,
  type UseUnifiedActionsOptions,
  type UseUnifiedActionsResult,
} from './useUnifiedActions';

export {
  useUnifiedFilters,
  type UseUnifiedFiltersOptions,
  type UseUnifiedFiltersResult,
} from './useUnifiedFilters';

export {
  useUnifiedSort,
  type UseUnifiedSortOptions,
  type UseUnifiedSortResult,
  type TableSortConfig,
} from './useUnifiedSort';
