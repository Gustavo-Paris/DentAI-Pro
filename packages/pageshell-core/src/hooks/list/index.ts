/**
 * List Logic Module
 *
 * @module hooks/list
 */

// Main hook
export { useListLogic } from './useListLogicCore';

// Types
export type {
  ListFilterConfig,
  ListSortConfig,
  ListPaginationConfig,
  UseListLogicOptions,
  ListState,
  ListQueryParams,
  UseListLogicReturn,
} from './types';

// Constants (for extension)
export { DEFAULT_PAGE_SIZE, DEFAULT_DEBOUNCE_MS } from './constants';
