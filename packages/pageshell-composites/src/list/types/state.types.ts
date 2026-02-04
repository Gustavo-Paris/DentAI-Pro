/**
 * ListPage State Types
 *
 * Type definitions for internal and controlled state management.
 *
 * @module list/types/state
 */

// =============================================================================
// Internal State Types
// =============================================================================

/**
 * Internal list state
 */
export interface ListState {
  /** Current page (1-indexed) */
  page: number;
  /** Page size */
  pageSize: number;
  /** Sort column */
  sortKey: string | null;
  /** Sort direction */
  sortDirection: 'asc' | 'desc';
  /** Active filters */
  filters: Record<string, string>;
  /** Search query */
  search: string;
  /** Selected row IDs */
  selectedIds: Set<string | number>;
}

/**
 * List state actions
 */
export interface ListStateActions {
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSort: (key: string, direction: 'asc' | 'desc') => void;
  setFilter: (key: string, value: string) => void;
  setSearch: (query: string) => void;
  selectRow: (id: string | number) => void;
  deselectRow: (id: string | number) => void;
  selectAll: (ids: (string | number)[]) => void;
  deselectAll: () => void;
  reset: () => void;
}

// =============================================================================
// Controlled State Types (External State Management)
// =============================================================================

/**
 * Controlled list state for external state management (Redux, Zustand, URL params).
 * This is a serializable version of ListState suitable for external stores.
 *
 * @example With Zustand
 * ```tsx
 * const useListStore = create<ControlledListState>((set) => ({
 *   page: 1,
 *   pageSize: 10,
 *   sortKey: null,
 *   sortDirection: 'asc',
 *   filters: {},
 *   search: '',
 *   selectedIds: [],
 * }));
 *
 * function MyList() {
 *   const state = useListStore();
 *   const setState = useListStore.setState;
 *   return (
 *     <ListPage
 *       state={state}
 *       onStateChange={(newState) => setState(newState)}
 *     />
 *   );
 * }
 * ```
 *
 * @example With URL params
 * ```tsx
 * function MyList() {
 *   const searchParams = useSearchParams();
 *   const router = useRouter();
 *
 *   const state: ControlledListState = {
 *     page: Number(searchParams.get('page')) || 1,
 *     pageSize: Number(searchParams.get('pageSize')) || 10,
 *     sortKey: searchParams.get('sortKey'),
 *     sortDirection: searchParams.get('sortDirection') as 'asc' | 'desc' || 'asc',
 *     filters: JSON.parse(searchParams.get('filters') || '{}'),
 *     search: searchParams.get('search') || '',
 *   };
 *
 *   const handleStateChange = (newState: ControlledListState) => {
 *     const params = new URLSearchParams();
 *     params.set('page', String(newState.page));
 *     // ... other params
 *     router.push(`?${params.toString()}`);
 *   };
 *
 *   return <ListPage state={state} onStateChange={handleStateChange} />;
 * }
 * ```
 */
export interface ControlledListState {
  /** Current page (1-indexed) */
  page: number;
  /** Page size */
  pageSize: number;
  /** Sort column key (null = no sorting) */
  sortKey: string | null;
  /** Sort direction */
  sortDirection: 'asc' | 'desc';
  /** Active filters as key-value pairs */
  filters: Record<string, string>;
  /** Search query string */
  search: string;
  /** Selected row IDs (array for serialization) */
  selectedIds?: (string | number)[];
}

/**
 * Fields that changed in a state update.
 * Used to optimize updates by only reacting to specific changes.
 */
export type ControlledListStateField = keyof ControlledListState;

/**
 * Callback for controlled state changes.
 *
 * @param state - The new state object
 * @param changedFields - Which fields changed in this update
 *
 * @example
 * ```tsx
 * const handleStateChange: OnListStateChange = (state, changedFields) => {
 *   if (changedFields.includes('page') || changedFields.includes('pageSize')) {
 *     // Only refetch when pagination changes
 *     refetch(state.page, state.pageSize);
 *   }
 *   if (changedFields.includes('filters')) {
 *     // Track filter usage
 *     analytics.track('filter_applied', state.filters);
 *   }
 *   // Always update store
 *   setListState(state);
 * };
 * ```
 */
export type OnListStateChange = (
  state: ControlledListState,
  changedFields: ControlledListStateField[]
) => void;

/**
 * Default state for uncontrolled initialization
 */
export interface DefaultListState {
  /** Initial page */
  page?: number;
  /** Initial page size */
  pageSize?: number;
  /** Initial sort key */
  sortKey?: string | null;
  /** Initial sort direction */
  sortDirection?: 'asc' | 'desc';
  /** Initial filters */
  filters?: Record<string, string>;
  /** Initial search */
  search?: string;
  /** Initial selection */
  selectedIds?: (string | number)[];
}
