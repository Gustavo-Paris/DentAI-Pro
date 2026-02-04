/**
 * ListPage Types
 *
 * Type definitions for the declarative ListPage composite.
 * Supports both table and card view modes (ADR-0051).
 *
 * This file re-exports from modular type files for organization:
 * - types/graph.types.ts - Graph view types
 * - types/card.types.ts - Card view types
 * - types/state.types.ts - State management types
 *
 * @module list/types
 */

import type { ReactNode } from 'react';
import type { IconProp } from '@pageshell/primitives';
import type {
  CompositeBaseProps,
  CompositeQueryResult,
  ColumnConfig,
  FilterConfig,
  RowActionsConfig,
  BulkActionsConfig,
  StatConfig,
  PaginationConfig,
  EmptyStateConfig,
  HeaderActionConfig,
  OffsetPaginationConfig,
  UnifiedActionsConfig,
  UnifiedSortConfig,
  ListAriaLabels,
} from '../shared/types';
import type { ViewMode, ResolvedViewMode } from './hooks/useViewMode';

// =============================================================================
// Re-exports from modular type files
// =============================================================================

// Re-export ViewMode types for convenience
export type { ViewMode, ResolvedViewMode };

// Graph view types
export type {
  GraphEdge,
  GraphNodePosition,
  GraphViewConfig,
} from './types/graph.types';

// Card view types
export type {
  CardFilterOption,
  CardFilterConfig,
  CardStatsTrend,
  CardStatsCard,
  CardStatsSectionConfig,
  CardSkeletonConfig,
  EmptySearchStateConfig,
  ListPageSlots,
  CardActionConfirm,
  CardActionConfig,
  CardActionsConfig,
  CardSectionConfig,
  CardSortOption,
  CardSortConfig,
} from './types/card.types';

// State management types
export type {
  ListState,
  ListStateActions,
  ControlledListState,
  ControlledListStateField,
  OnListStateChange,
  DefaultListState,
} from './types/state.types';

// Import types needed for ListPageProps
import type {
  GraphEdge,
  GraphViewConfig,
} from './types/graph.types';
import type {
  CardFilterConfig,
  CardStatsSectionConfig,
  CardSkeletonConfig,
  EmptySearchStateConfig,
  ListPageSlots,
  CardActionsConfig,
  CardSectionConfig,
  CardSortConfig,
} from './types/card.types';
import type {
  ListState,
  ControlledListState,
  OnListStateChange,
  DefaultListState,
} from './types/state.types';

// =============================================================================
// ListPage Props
// =============================================================================

/**
 * Props for the ListPage composite
 *
 * @example Table mode (default)
 * ```tsx
 * <ListPage
 *   theme="admin"
 *   title="Users"
 *   query={usersQuery}
 *   columns={[
 *     { key: 'name', label: 'Name' },
 *     { key: 'email', label: 'Email' },
 *   ]}
 *   rowActions={{
 *     edit: { label: 'Edit', href: '/users/:id/edit' },
 *   }}
 * />
 * ```
 *
 * @example Card mode
 * ```tsx
 * <ListPage
 *   theme="admin"
 *   title="Products"
 *   viewMode="cards"
 *   query={productsQuery}
 *   renderCard={(product) => <ProductCard data={product} />}
 *   cardActions={{
 *     edit: { label: 'Edit', href: '/products/:id/edit' },
 *   }}
 * />
 * ```
 *
 * @example Auto mode (responsive)
 * ```tsx
 * <ListPage
 *   title="Items"
 *   viewMode="auto"
 *   columns={[...]} // Required for table view
 *   renderCard={(item) => ...} // Required for card view
 * />
 * ```
 */
/**
 * Query result interface for ListPage.
 * Uses shared CompositeQueryResult with additional properties for broader compatibility.
 *
 * @see CompositeQueryResult in shared/types.ts
 */
export type ListPageQueryResult<TData> = CompositeQueryResult<TData> & {
  /** Additional properties from tRPC/React Query */
  [key: string]: unknown;
};

/**
 * Hook factory that creates a query with given params.
 * This is the primary way to integrate with tRPC for reactive queries.
 *
 * The return type accepts any object with the required CompositeQueryResult properties.
 * This makes it compatible with tRPC's UseTRPCQueryResult, React Query's UseQueryResult,
 * and other query libraries through structural typing.
 *
 * @example
 * ```tsx
 * useQuery={(state) => api.users.list.useQuery({
 *   page: state.page,
 *   search: state.search,
 *   filters: state.filters,
 * })}
 * ```
 */
export type ListPageUseQuery<TData, TInput = ListState> = (
  input: TInput
) => ListPageQueryResult<TData>;

/**
 * tRPC procedure reference.
 * Allows passing the procedure directly (e.g., api.users.list).
 */
export interface ListPageProcedure<TData, TInput = ListState> {
  useQuery: ListPageUseQuery<TData, TInput>;
}

export interface ListPageProps<
  TRow = Record<string, unknown>,
  TData = unknown,
  TInput = ListState,
> extends CompositeBaseProps {
  // ---------------------------------------------------------------------------
  // Card Mode Compatibility (ADR-0051)
  // ---------------------------------------------------------------------------

  /**
   * Page label shown above title (e.g., "Creator Portal").
   * Primarily used in card mode for consistency with CardListPage.
   */
  label?: string;

  /**
   * Direct items array (alternative to query).
   * When provided, used instead of query.data.
   * Useful for client-side data or when data is already loaded.
   */
  items?: TRow[];

  /**
   * Direct loading state (for items mode).
   * When items prop is used, this controls loading state.
   */
  isLoading?: boolean;

  // ---------------------------------------------------------------------------
  // Data - Multiple options (priority: items > useQuery > procedure > query)
  // ---------------------------------------------------------------------------

  /**
   * Hook factory - creates query with internal state params (recommended).
   * This enables reactive queries that update when filters/pagination/sorting change.
   * 
   * @example
   * ```tsx
   * useQuery={(state) => api.users.list.useQuery({
   *   page: state.page,
   *   pageSize: state.pageSize,
   *   search: state.search,
   *   role: state.filters.role || 'all',
   * })}
   * ```
   */
  useQuery?: ListPageUseQuery<TData, TInput>;

  /**
   * tRPC procedure reference - automatic hook invocation.
   * Convenience wrapper around useQuery.
   * 
   * @example
   * ```tsx
   * procedure={api.users.list}
   * ```
   */
  procedure?: ListPageProcedure<TData, TInput>;

  /**
   * Query result from data fetching hook (legacy pattern).
   * Compatible with tRPC, React Query, SWR.
   *
   * @deprecated Use `useQuery` or `procedure` for reactive queries.
   * This pattern requires external state management and doesn't respond
   * to filter/pagination changes.
   *
   * Migration example:
   * ```tsx
   * // Before (deprecated - static, doesn't react to state changes):
   * <ListPage query={api.users.list.useQuery()} />
   *
   * // After - Option 1: useQuery factory (recommended):
   * <ListPage useQuery={(state) => api.users.list.useQuery({
   *   page: state.page,
   *   search: state.search,
   *   ...state.filters,
   * })} />
   *
   * // After - Option 2: procedure shorthand:
   * <ListPage procedure={api.users.list} />
   * ```
   */
  query?: CompositeQueryResult<TData>;

  /**
   * Map ListPage internal state to query input format.
   * Useful when API expects different shape than ListState.
   * 
   * @example
   * ```tsx
   * queryInput={(state) => ({
   *   page: state.page,
   *   search: state.search,
   *   role: state.filters.role || 'all',
   *   status: state.filters.status || 'all',
   * })}
   * ```
   */
  queryInput?: (state: ListState) => TInput | Partial<TInput>;

  /**
   * Extract rows array from query data.
   * Default: looks for data.items, data.data, or data directly if array.
   */
  getRows?: (data: TData) => TRow[];

  /**
   * Extract total count from query data.
   * Default: looks for data.total, data.totalCount, or rows.length.
   */
  getTotal?: (data: TData) => number;

  /**
   * Unique row key accessor.
   * Default: 'id'
   */
  rowKey?: string | ((row: TRow) => string | number);

  // ---------------------------------------------------------------------------
  // Controlled State (External State Management)
  // ---------------------------------------------------------------------------

  /**
   * Controlled state for external state management (Redux, Zustand, URL params).
   * When provided, ListPage becomes controlled and all state changes go through
   * the onStateChange callback.
   *
   * @see ControlledListState for type definition
   *
   * @example With Zustand
   * ```tsx
   * const state = useListStore();
   * <ListPage
   *   state={state}
   *   onStateChange={(newState) => useListStore.setState(newState)}
   * />
   * ```
   *
   * @example With URL params
   * ```tsx
   * const state = parseUrlParams(searchParams);
   * <ListPage
   *   state={state}
   *   onStateChange={(newState) => router.push(buildUrl(newState))}
   * />
   * ```
   */
  state?: ControlledListState;

  /**
   * Callback for state changes in controlled mode.
   * Called whenever internal state would change.
   *
   * @param state - The new state object
   * @param changedFields - Which fields changed in this update
   */
  onStateChange?: OnListStateChange;

  /**
   * Default state for uncontrolled mode initialization.
   * Only used when `state` is not provided.
   */
  defaultState?: DefaultListState;

  // ---------------------------------------------------------------------------
  // Granular Controlled Props (alternative to state object)
  // ---------------------------------------------------------------------------

  /**
   * Controlled page number (1-indexed).
   * When provided, page state is controlled externally.
   */
  // Note: page is not a prop name conflict, using controlledPage internally
  // page?: number; -- Not added to avoid confusion with internal state

  /**
   * Callback when page changes.
   * Required when using controlled page.
   */
  onPageChange?: (page: number) => void;

  /**
   * Controlled page size.
   */
  // pageSize?: number; -- Handled by pagination prop

  /**
   * Callback when page size changes.
   */
  onPageSizeChange?: (pageSize: number) => void;

  /**
   * Callback when sort changes.
   * Useful for server-side sorting without full controlled mode.
   */
  onSortChange?: (sortKey: string | null, sortDirection: 'asc' | 'desc') => void;

  /**
   * Callback when filters change.
   * Useful for URL parameter sync without full controlled mode.
   */
  onFiltersChange?: (filters: Record<string, string>) => void;

  /**
   * Callback when search changes.
   * Useful for URL parameter sync without full controlled mode.
   */
  onSearchChange?: (search: string) => void;

  // ---------------------------------------------------------------------------
  // View Mode (ADR-0051)
  // ---------------------------------------------------------------------------

  /**
   * View mode for the list display.
   * - 'table': Table with columns (default, requires `columns` prop)
   * - 'cards': Card grid (requires `renderCard` prop)
   * - 'auto': Responsive - cards on mobile, table on desktop (requires both)
   *
   * @default 'table'
   */
  viewMode?: ViewMode;

  /**
   * Enable user toggle between table and cards view.
   * Shows toggle buttons allowing users to switch views.
   *
   * **Auto-enabled** when both `columns` and `renderCard` are provided.
   * Set to `false` to explicitly disable even when both are present.
   *
   * @default true (when columns AND renderCard provided), false otherwise
   *
   * @example
   * ```tsx
   * // Toggle auto-enabled (both columns and renderCard provided)
   * <ListPage
   *   columns={columns}
   *   renderCard={renderCard}
   *   defaultViewMode="cards"
   *   persistViewMode="users-view"
   * />
   *
   * // Explicitly disable toggle
   * <ListPage
   *   viewModeToggle={false}
   *   columns={columns}
   *   renderCard={renderCard}
   * />
   * ```
   */
  viewModeToggle?: boolean;

  /**
   * Default view mode when toggle is enabled.
   * Only used when `viewModeToggle` is true.
   *
   * @default 'table'
   */
  defaultViewMode?: ResolvedViewMode;

  /**
   * Persist view mode preference to localStorage.
   * - true: Uses generic key 'listpage-view-mode'
   * - string: Uses provided string as localStorage key (recommended for uniqueness)
   * - false/undefined: No persistence
   *
   * Only used when `viewModeToggle` is true.
   *
   * @default false
   *
   * @example
   * ```tsx
   * // Generic key (shared across all ListPages)
   * <ListPage viewModeToggle persistViewMode />
   *
   * // Custom key (unique per page)
   * <ListPage viewModeToggle persistViewMode="users-list-view" />
   * ```
   */
  persistViewMode?: boolean | string;

  /**
   * Breakpoint for mobile detection (pixels).
   * Only used when viewMode is 'auto'.
   * @default 768
   */
  mobileBreakpoint?: number;

  // ---------------------------------------------------------------------------
  // Unified Field Configuration (NEW - Recommended)
  // ---------------------------------------------------------------------------

  /**
   * Unified field configuration for both table and card views.
   * When provided, generates columns for table and auto-renders cards.
   * This is the recommended approach for new implementations.
   *
   * @example
   * ```tsx
   * fields={[
   *   { key: 'title', label: 'Título', cardSlot: 'title' },
   *   {
   *     key: 'status',
   *     label: 'Status',
   *     valueType: 'badge',
   *     valueEnum: {
   *       draft: { text: 'Rascunho', status: 'default' },
   *       active: { text: 'Ativo', status: 'success' },
   *     },
   *     cardSlot: 'badge',
   *   },
   *   { key: 'updatedAt', label: 'Atualizado', valueType: 'relativeTime', cardSlot: 'footer' },
   * ]}
   * ```
   */
  fields?: import('../shared/types').FieldConfig<TRow>[];

  /**
   * Card layout configuration when using fields prop.
   * Controls how auto-generated cards are rendered.
   *
   * @see ADR-0058 - ListPageCard Feature Evolution (footerAction)
   * @default { variant: 'standard' }
   */
  cardLayout?: import('../shared/types').CardLayoutConfig<TRow>;

  // ---------------------------------------------------------------------------
  // Columns (Table Mode) - Legacy, use `fields` instead
  // ---------------------------------------------------------------------------

  /**
   * Column definitions for table view.
   * Required when viewMode is 'table' (default) or 'auto'.
   * Smart defaults applied based on key names (e.g., 'createdAt' → date format).
   *
   * @deprecated Prefer using `fields` prop for unified table+card configuration.
   */
  columns?: ColumnConfig<TRow>[];

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Unified actions configuration (recommended).
   * Single configuration that works for both table and card modes.
   * Takes precedence over rowActions and cardActions when provided.
   *
   * @example
   * ```tsx
   * actions={{
   *   edit: {
   *     label: 'Edit',
   *     icon: 'pencil',
   *     href: '/items/:id/edit',
   *   },
   *   delete: {
   *     label: 'Delete',
   *     icon: 'trash',
   *     variant: 'destructive',
   *     mutation: deleteMutation,
   *     confirm: { title: 'Delete item?' },
   *   },
   * }}
   * ```
   *
   * @see UnifiedActionsConfig for full type definition
   */
  actions?: UnifiedActionsConfig<TRow>;

  /**
   * Row actions configuration (table mode).
   * Common actions (edit, delete, view) get smart defaults.
   *
   * @deprecated Use `actions` instead for unified table+card configuration.
   */
  rowActions?: RowActionsConfig<TRow>;

  /**
   * Bulk actions configuration.
   * Shown when rows are selected.
   */
  bulkActions?: BulkActionsConfig<TRow>;

  /**
   * Header actions (e.g., "Add New" button).
   */
  headerActions?: HeaderActionConfig[];

  /**
   * Create/Add action shorthand.
   * Rendered as primary button in header.
   */
  createAction?: {
    label?: string;
    href?: string;
    onClick?: () => void;
    /** Icon - accepts string name (e.g., 'plus') or ComponentType */
    icon?: IconProp;
  };

  /**
   * Section title shown between stats and filters.
   * Creates a visual section like "Usuários" with description and action.
   */
  sectionTitle?: string;

  /**
   * Section description shown below section title.
   */
  sectionDescription?: string;

  // ---------------------------------------------------------------------------
  // Filtering & Sorting
  // ---------------------------------------------------------------------------

  /**
   * Filter configurations.
   * Can be array or object keyed by filter name.
   */
  filters?: FilterConfig[] | Record<string, Omit<FilterConfig, 'key'>>;

  /**
   * Enable search filter.
   * Shorthand for adding a search filter.
   */
  searchable?: boolean | { placeholder?: string };

  /**
   * Client-side search configuration (for card mode with items).
   * When provided, enables field-specific client-side filtering.
   *
   * @example
   * ```tsx
   * searchConfig={{
   *   fields: ['title', 'description'],
   *   placeholder: 'Search...',
   *   debounce: 300,
   * }}
   * ```
   */
  searchConfig?: {
    /** Fields to search in (deep paths supported: 'user.name') */
    fields: string[];
    /** Placeholder text */
    placeholder?: string;
    /** Debounce in ms (default: 300) */
    debounce?: number;
  };

  /**
   * Unified sort configuration.
   * Works for both table and card modes with smart defaults.
   *
   * @see UnifiedSortConfig for full type definition
   *
   * @example
   * ```tsx
   * sort={{
   *   options: [
   *     { value: 'progress', label: 'Progress', direction: 'desc' },
   *     { value: 'title', label: 'Title', direction: 'asc' },
   *   ],
   *   default: 'progress',
   * }}
   * ```
   */
  sort?: UnifiedSortConfig<TRow>;

  /**
   * Initial sort configuration (table mode).
   * @deprecated Use the unified "sort" prop instead.
   */
  defaultSort?: {
    key: string;
    direction: 'asc' | 'desc';
  };

  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------

  /**
   * Pagination configuration (internal state managed).
   */
  pagination?: PaginationConfig | false;

  /**
   * Offset pagination configuration (external state managed).
   * For server-side pagination where parent controls page state.
   * When provided, renders pagination UI with external handlers.
   *
   * @example
   * ```tsx
   * offsetPagination={{
   *   type: 'offset',
   *   page: currentPage,
   *   pageSize: 10,
   *   total: totalItems,
   *   onPageChange: setPage,
   * }}
   * ```
   */
  offsetPagination?: OffsetPaginationConfig;

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  /**
   * Stats to display above the table.
   */
  stats?: StatConfig[];

  // ---------------------------------------------------------------------------
  // Empty State
  // ---------------------------------------------------------------------------

  /**
   * Empty state configuration.
   */
  emptyState?: EmptyStateConfig;

  // ---------------------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------------------

  /**
   * Enable row selection.
   */
  selectable?: boolean;

  /**
   * Controlled selection.
   */
  selectedIds?: (string | number)[];

  /**
   * Selection change handler.
   */
  onSelectionChange?: (ids: (string | number)[]) => void;

  // ---------------------------------------------------------------------------
  // Card Mode Props (ADR-0051)
  // ---------------------------------------------------------------------------

  /**
   * Render function for card view.
   * Required when viewMode is 'cards' or 'auto'.
   *
   * @example
   * ```tsx
   * renderCard={(item, index) => (
   *   <ProductCard key={item.id} data={item} />
   * )}
   * ```
   */
  renderCard?: (item: TRow, index: number) => ReactNode;

  /**
   * Card actions configuration (for card view).
   * Similar to rowActions but for card mode.
   */
  cardActions?: CardActionsConfig<TRow>;

  /**
   * Unified item href for navigation (both table and card modes).
   * Supports :param interpolation for string patterns.
   *
   * @example
   * ```tsx
   * // String pattern with :param interpolation
   * itemHref="/products/:id"
   *
   * // Function for complex URLs
   * itemHref={(item) => `/products/${item.id}`}
   *
   * // Conditional navigation (return null to disable)
   * itemHref={(item) => item.status === 'draft' ? null : `/products/${item.id}`}
   * ```
   */
  itemHref?: string | ((item: TRow) => string | null);

  /**
   * Callback when an item is clicked (side effects, not navigation).
   * Called before navigation when itemHref is also provided.
   *
   * @example
   * ```tsx
   * onItemClick={(item) => trackAnalytics('item_viewed', item.id)}
   * ```
   */
  onItemClick?: (item: TRow) => void;

  /**
   * Card href for navigation (supports :param interpolation).
   * @deprecated Use the unified "itemHref" prop instead.
   *
   * @example
   * ```tsx
   * cardHref="/products/:id"
   * // or
   * cardHref={(item) => `/products/${item.id}`}
   * ```
   */
  cardHref?: string | ((item: TRow) => string);

  /**
   * Grid CSS classes for card layout.
   * @default "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
   */
  gridClassName?: string;

  /**
   * Section configuration for grouped cards.
   * Only applies to card view mode.
   */
  sections?: CardSectionConfig<TRow>;

  /**
   * Key extractor for card list rendering.
   * @default (item) => item.id
   */
  keyExtractor?: (item: TRow) => string;

  /**
   * Callback when a table row is clicked.
   * Enables direct row click navigation without requiring the action menu.
   * @deprecated Use the unified "itemHref" and "onItemClick" props instead.
   *
   * @example
   * ```tsx
   * onRowClick={(item) => router.push(`/items/${item.id}`)}
   * ```
   */
  onRowClick?: (item: TRow) => void;

  /**
   * Sort configuration for card mode (client-side sorting).
   * Only applies when viewMode is 'cards' or 'auto' in cards mode.
   * @deprecated Use the unified "sort" prop instead.
   */
  cardSortConfig?: CardSortConfig<TRow>;

  /**
   * Refetch function called after successful card mutations.
   */
  refetch?: () => void;

  /**
   * Card filters configuration (for card mode).
   * Uses CardFilterConfig with 'select' or 'buttons' types.
   *
   * @example
   * ```tsx
   * cardFilters={{
   *   status: {
   *     type: 'buttons',
   *     options: [
   *       { value: 'all', label: 'All' },
   *       { value: 'active', label: 'Active' },
   *     ],
   *     default: 'all',
   *   },
   * }}
   * ```
   */
  cardFilters?: Record<string, CardFilterConfig>;

  /**
   * Stats section configuration (for card mode).
   * Displays KPI cards above the card grid.
   */
  statsSection?: CardStatsSectionConfig;

  /**
   * Empty search state (for card mode).
   * Shown when filters/search return no results.
   */
  emptySearchState?: EmptySearchStateConfig;

  /**
   * Skeleton configuration (for card mode).
   */
  skeletonConfig?: CardSkeletonConfig;

  // Note: `router` is inherited from CompositeBaseProps and uses RouterAdapter type.
  // It can be used for programmatic navigation in card actions.

  // ---------------------------------------------------------------------------
  // Graph Mode Props
  // ---------------------------------------------------------------------------

  /**
   * Graph view configuration.
   * Required when viewMode is 'graph' or when viewModeToggle includes graph.
   *
   * @example
   * ```tsx
   * graphConfig={{
   *   showControls: true,
   *   showMinimap: true,
   *   height: 600,
   *   background: 'dots',
   * }}
   * ```
   */
  graphConfig?: GraphViewConfig<TRow>;

  /**
   * Render function for graph nodes.
   * When provided, customizes how each item is displayed as a node.
   * Falls back to a default card-like node if not provided.
   *
   * @example
   * ```tsx
   * renderGraphNode={(item) => (
   *   <KnowledgeBaseGraphNode kb={item} />
   * )}
   * ```
   */
  renderGraphNode?: (item: TRow) => ReactNode;

  /**
   * Graph edges data or accessor function.
   * Defines connections between nodes.
   *
   * @example Static edges
   * ```tsx
   * graphEdges={[
   *   { id: 'e1', source: 'kb1', target: 'kb2', label: 'Related' },
   * ]}
   * ```
   *
   * @example Dynamic edges from items
   * ```tsx
   * graphEdges={(items) => computeEdgesFromItems(items)}
   * ```
   */
  graphEdges?: GraphEdge[] | ((items: TRow[]) => GraphEdge[]);

  /**
   * Callback when a graph node is clicked.
   *
   * @example
   * ```tsx
   * onGraphNodeClick={(item) => router.push(`/kb/${item.id}`)}
   * ```
   */
  onGraphNodeClick?: (item: TRow) => void;

  // ---------------------------------------------------------------------------
  // Customization Slots
  // ---------------------------------------------------------------------------

  /**
   * Unified slots object for customization (ADR-0051).
   * Supports both table and card mode slot names.
   */
  slots?: ListPageSlots;

  /**
   * Custom header content.
   * @deprecated Use slots.headerSlot instead
   */
  headerSlot?: ReactNode;

  /**
   * Custom content before the table/cards.
   * @deprecated Use slots.beforeTableSlot instead
   */
  beforeTableSlot?: ReactNode;

  /**
   * Custom content after the table/cards.
   * @deprecated Use slots.afterTableSlot instead
   */
  afterTableSlot?: ReactNode;

  /**
   * Custom skeleton for loading state.
   */
  skeleton?: ReactNode;

  // ---------------------------------------------------------------------------
  // i18n Labels
  // ---------------------------------------------------------------------------

  /**
   * i18n labels for text customization.
   * All labels have English defaults.
   *
   * @example
   * ```tsx
   * // Customizing for Portuguese
   * <ListPage
   *   labels={{
   *     search: { placeholder: 'Buscar...' },
   *     pagination: { showing: 'Mostrando', of: 'de', items: 'itens' },
   *     selection: { itemSelected: 'item selected', itemsSelected: 'items selected' },
   *   }}
   * />
   * ```
   */
  labels?: import('../shared/types').ListPageLabels;

  /**
   * i18n-aware ARIA labels for accessibility.
   * Overrides default English labels with localized versions.
   * @see ADR-0062
   */
  ariaLabels?: ListAriaLabels;
}

