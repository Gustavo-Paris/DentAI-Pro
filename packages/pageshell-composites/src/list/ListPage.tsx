/**
 * ListPage Composite
 *
 * Declarative CRUD list page with filtering, sorting, pagination,
 * and row/bulk actions. Supports table and card view modes.
 *
 * @see ADR-0051: ListPage + CardListPage Consolidation
 * @module list/ListPage
 */

'use client';

import * as React from 'react';
import { Link } from 'react-router-dom';
import { cn, useListLogic } from '@pageshell/core';
import { Button, resolveIcon } from '@pageshell/primitives';
import type {
  ListPageProps,
  ListState,
  ControlledListState,
  OnListStateChange,
  DefaultListState,
} from './types';
import { resolveDescription, resolveLabels } from '../shared/types';
import type { ListPageLabels, PaginationLabels, NavigationLabels } from '../shared/types';
import { extractArrayFromData, extractTotalFromData } from '../shared/utils';
import { defaultKeyExtractor } from '../shared/utils';
import { getContainerClasses } from '../shared/styles';
import type { ContainerVariant } from '../shared/types';
import { useConfirmDialog } from '../shared/hooks';
import { getRowKey, normalizeFilters, convertFiltersToListLogicFormat, convertCardFiltersToFilterConfig, fieldsToColumns } from './utils';
import { warnDeprecatedListPageProps } from './utils/deprecationWarnings';
import {
  ListPageConfirmDialog,
  ListPagePagination,
  ListPageStats,
  ListPageFilters,
  ListPageBulkActions,
  ListPageTable,
  CardView,
  ViewModeToggle,
  ListPageCard,
  ListPageSkeleton,
  LazyGraphView,
  OffsetPagination,
} from './components';
import { useListPageState, useViewMode, useUnifiedActions } from './hooks';

// =============================================================================
// List Page Component
// =============================================================================

/**
 * Declarative list page composite.
 *
 * @example
 * ```tsx
 * <ListPage
 *   theme="admin"
 *   title="Users"
 *   query={api.users.list.useQuery()}
 *   columns={[
 *     { key: 'name', label: 'Name' },
 *     { key: 'email', label: 'Email' },
 *     { key: 'createdAt', label: 'Created', format: 'date' },
 *   ]}
 *   rowActions={{
 *     edit: { label: 'Edit', href: '/users/:id/edit' },
 *   }}
 * />
 * ```
 */
export function ListPage<
  TRow = Record<string, unknown>,
  TData = unknown,
  TInput = ListState,
>(props: ListPageProps<TRow, TData, TInput>) {
  const {
    // Base (from CompositeBaseProps)
    theme = 'default',
    title,
    description,
    className,
    containerVariant = 'shell',
    router,
    // Card Mode Compatibility (ADR-0051)
    label,
    items: directItems,
    isLoading: directIsLoading,
    // Controlled State (for external state management)
    state: controlledState,
    onStateChange,
    defaultState,
    onPageChange,
    onPageSizeChange,
    onSortChange,
    onFiltersChange,
    onSearchChange,
    // View Mode (ADR-0051)
    viewMode = 'table',
    viewModeToggle,
    defaultViewMode = 'table',
    persistViewMode = false,
    mobileBreakpoint = 768,
    // Data - multiple options (priority: items > useQuery > procedure > query)
    useQuery: useQueryFactory,
    procedure,
    query: directQuery,
    queryInput,
    getRows = extractArrayFromData,
    getTotal,
    rowKey = 'id',
    // Unified Field Configuration (NEW)
    fields,
    cardLayout,
    // Columns (Table Mode) - legacy
    columns: propColumns,
    // Unified Actions (NEW - replaces rowActions + cardActions)
    actions,
    // Table Actions (legacy)
    rowActions,
    createAction,
    headerActions,
    // Section
    sectionTitle,
    sectionDescription,
    // Filtering
    filters,
    searchable,
    searchConfig,
    defaultSort,
    // Pagination
    pagination = {},
    offsetPagination,
    // Stats
    stats,
    // Empty state
    emptyState,
    // Selection (Table Mode)
    selectable,
    selectedIds: controlledSelectedIds,
    onSelectionChange,
    // Card Mode Props (ADR-0051)
    renderCard,
    cardActions,
    cardHref,
    gridClassName = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3',
    sections,
    keyExtractor = defaultKeyExtractor,
    onRowClick,
    cardSortConfig,
    refetch,
    cardFilters,
    statsSection,
    emptySearchState,
    skeletonConfig,
    // Graph Mode Props
    graphConfig,
    renderGraphNode,
    graphEdges,
    onGraphNodeClick,
    // Slots (unified slots object + legacy props)
    slots,
    headerSlot,
    beforeTableSlot,
    afterTableSlot,
    skeleton,
    // i18n Labels
    labels,
  } = props;

  // Warn about deprecated props (development only)
  warnDeprecatedListPageProps(props as unknown as Record<string, unknown>);

  // Resolve labels with defaults
  const resolvedLabels = resolveLabels(labels);

  // ---------------------------------------------------------------------------
  // Unified Field Configuration (NEW)
  // Generate columns and renderCard from fields when provided
  // ---------------------------------------------------------------------------

  // Generate columns from fields if not provided
  const columns = propColumns ?? (fields ? fieldsToColumns(fields) : undefined);

  // Note: effectiveRenderCard is computed after useUnifiedActions
  // to use resolvedCardActions instead of raw cardActions

  // Resolve slots (unified slots object takes precedence over legacy props)
  const resolvedSlots = {
    headerSlot: slots?.headerSlot ?? headerSlot,
    beforeFilters: slots?.beforeFilters,
    afterFilters: slots?.afterFilters,
    beforeTableSlot: slots?.beforeTableSlot ?? slots?.beforeCards ?? beforeTableSlot,
    afterTableSlot: slots?.afterTableSlot ?? slots?.afterCards ?? afterTableSlot,
  };

  // ---------------------------------------------------------------------------
  // View Mode Resolution (ADR-0051)
  // ---------------------------------------------------------------------------

  // Auto-enable toggle when both columns and renderCard (or fields) are provided
  // Check directly for renderCard or fields since effectiveRenderCard is computed later
  const hasCardRenderer = !!(renderCard || fields);
  const effectiveViewModeToggle = viewModeToggle ?? (!!columns && hasCardRenderer);

  const {
    resolvedViewMode,
    isMobile,
    isCardsView,
    isTableView,
    isGraphView,
    isToggleEnabled,
    setViewMode,
  } = useViewMode({
    viewMode,
    mobileBreakpoint,
    mobileViewMode: 'cards',
    enableToggle: effectiveViewModeToggle,
    defaultViewMode,
    persistViewMode,
  });

  // ---------------------------------------------------------------------------
  // Unified Actions Resolution (ListPage Unified API)
  // ---------------------------------------------------------------------------

  const {
    rowActions: resolvedRowActions,
    cardActions: resolvedCardActions,
    isUnified: isUsingUnifiedActions,
  } = useUnifiedActions({
    actions,
    rowActions,
    cardActions,
    viewMode: resolvedViewMode,
  });

  // Generate renderCard from fields if not provided
  // Uses resolvedCardActions from unified actions system
  const effectiveRenderCard = renderCard ?? (fields
    ? (item: TRow, index: number) => (
        <ListPageCard<TRow>
          item={item}
          fields={fields}
          layout={cardLayout}
          actions={resolvedCardActions}
          href={cardHref}
          index={index}
          refetch={refetch}
        />
      )
    : undefined);

  // Validate props based on viewMode (development only)
  // Note: fields prop auto-generates both columns and effectiveRenderCard
  if (process.env.NODE_ENV === 'development') {
    if (viewModeToggle && (!columns || !effectiveRenderCard)) {
      console.error(
        'ListPage: both columns and renderCard (or fields) are required when viewModeToggle is enabled. ' +
        'Toggle mode requires both views to be available.'
      );
    }
    if (resolvedViewMode === 'table' && !columns) {
      console.error(
        'ListPage: columns prop is required when viewMode is "table" (default). ' +
        'Either provide columns, fields, or set viewMode="cards".'
      );
    }
    if (resolvedViewMode === 'cards' && !effectiveRenderCard) {
      console.error(
        'ListPage: renderCard prop (or fields) is required when viewMode is "cards". ' +
        'Provide a renderCard function or fields configuration to render each item as a card.'
      );
    }
    if (viewMode === 'auto' && (!columns || !effectiveRenderCard)) {
      console.error(
        'ListPage: both columns and renderCard (or fields) are required when viewMode is "auto". ' +
        'Auto mode switches between table (desktop) and cards (mobile) views.'
      );
    }
    if (resolvedViewMode === 'graph' && !graphConfig) {
      console.error(
        'ListPage: graphConfig prop is required when viewMode is "graph". ' +
        'Provide a graphConfig configuration to render items as a graph.'
      );
    }
    // Deprecation warnings for legacy action props
    if (rowActions && !actions) {
      console.warn(
        'ListPage: rowActions prop is deprecated. Use the unified "actions" prop instead. ' +
        'See ListPage Unified API documentation for migration guide.'
      );
    }
    if (cardActions && !actions) {
      console.warn(
        'ListPage: cardActions prop is deprecated. Use the unified "actions" prop instead. ' +
        'See ListPage Unified API documentation for migration guide.'
      );
    }
    if (actions && (rowActions || cardActions)) {
      console.warn(
        'ListPage: Both "actions" (new) and "rowActions"/"cardActions" (legacy) props provided. ' +
        'The unified "actions" prop takes precedence. Remove legacy props to silence this warning.'
      );
    }
    // Deprecation warning for cardFilters
    if (cardFilters) {
      console.warn(
        'ListPage: cardFilters prop is deprecated. Use the unified "filters" prop with cardRenderAs option instead. ' +
        'Example: filters={{ status: { options: [...], cardRenderAs: "buttons" } }}'
      );
    }
    // Deprecation warning for defaultSort
    if (defaultSort && !props.sort) {
      console.warn(
        'ListPage: defaultSort prop is deprecated. Use the unified "sort" prop instead. ' +
        'Example: sort={{ options: [...], default: "progress" }}'
      );
    }
    // Deprecation warning for cardSortConfig
    if (cardSortConfig && !props.sort) {
      console.warn(
        'ListPage: cardSortConfig prop is deprecated. Use the unified "sort" prop instead. ' +
        'Example: sort={{ options: [...], default: "progress" }}'
      );
    }
    // Deprecation warning for cardHref
    if (cardHref && !props.itemHref) {
      console.warn(
        'ListPage: cardHref prop is deprecated. Use the unified "itemHref" prop instead. ' +
        'Example: itemHref="/products/:id"'
      );
    }
    // Deprecation warning for onRowClick
    if (onRowClick && !props.itemHref && !props.onItemClick) {
      console.warn(
        'ListPage: onRowClick prop is deprecated. Use "itemHref" for navigation or "onItemClick" for side effects. ' +
        'Example: itemHref="/items/:id" or onItemClick={(item) => track(item.id)}'
      );
    }
  }

  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------

  // Client-side filtering: enabled when directItems is provided (items prop)
  // This makes filtering work for both table and card views with client-side data
  const useClientSideFiltering = directItems !== undefined;
  const searchFields = searchConfig?.fields;

  // Normalize and convert filters to useListLogic format
  // Merge cardFilters when in card view mode (ADR-0051)
  const normalizedFiltersArray = React.useMemo(() => {
    const baseFilters = normalizeFilters(filters);
    // When in card view with cardFilters, merge them with regular filters
    if (cardFilters && (viewMode === 'cards' || (viewMode === 'auto' && !columns))) {
      const convertedCardFilters = convertCardFiltersToFilterConfig(cardFilters);
      // Merge: cardFilters take precedence for same keys
      const filterMap = new Map(baseFilters.map(f => [f.key, f]));
      convertedCardFilters.forEach(f => filterMap.set(f.key, f));
      return Array.from(filterMap.values());
    }
    return baseFilters;
  }, [filters, cardFilters, viewMode, columns]);
  const listLogicFilters = React.useMemo(
    () => convertFiltersToListLogicFormat(normalizedFiltersArray),
    [normalizedFiltersArray]
  );

  const listLogic = useListLogic({
    // Pass items for client-side filtering when directItems is provided
    items: useClientSideFiltering ? directItems : undefined,
    searchFields: useClientSideFiltering ? searchFields : undefined,
    searchDebounceMs: searchConfig?.debounce ?? 300,
    // Pass filters for client-side filtering
    filters: useClientSideFiltering ? listLogicFilters : undefined,
    sort: defaultSort ? {
      options: [{ value: defaultSort.key, label: defaultSort.key }],
      default: defaultSort.key,
      defaultOrder: defaultSort.direction,
      compareFn: cardSortConfig?.compareFn as ((sortKey: string) => (a: unknown, b: unknown) => number) | undefined,
    } : (cardSortConfig ? {
      options: cardSortConfig.options,
      default: cardSortConfig.default,
      compareFn: cardSortConfig.compareFn as ((sortKey: string) => (a: unknown, b: unknown) => number) | undefined,
    } : undefined),
    pageSize: typeof pagination === 'object' ? pagination.defaultPageSize : 10,
  });

  // List page state hook (search, filters, selection)
  const pageState = useListPageState<TRow>({
    filters,
    selectable,
    selectedIds: controlledSelectedIds,
    onSelectionChange,
    rowKey,
    listLogic: {
      page: listLogic.page,
      pageSize: listLogic.pageSize,
      sortBy: listLogic.sortBy,
      sortOrder: listLogic.sortOrder,
    },
  });

  const {
    searchQuery,
    setSearchQuery,
    normalizedFilters: normalizedFiltersFromState,
    activeFilters,
    hasActiveFilters: hasActiveFiltersFromState,
    clearAllFilters: clearAllFiltersFromState,
    handleFilterChange: handleFilterChangeFromState,
    selectedIds,
    handleSelectRow,
    handleSelectAll,
    clearSelection,
    listState,
  } = pageState;

  // Sync handlers: when client-side filtering is enabled, sync with listLogic
  // Also call external controlled callbacks when provided
  const syncedHandleFilterChange = React.useCallback((key: string, value: string) => {
    handleFilterChangeFromState(key, value);
    if (useClientSideFiltering) {
      listLogic.setFilter(key, value);
    }
    // Call external callback for controlled mode
    if (onFiltersChange) {
      const newFilters = { ...activeFilters, [key]: value };
      if (value === '' || value === 'all') {
        delete newFilters[key];
      }
      onFiltersChange(newFilters);
    }
    // Call unified state change callback
    if (onStateChange) {
      const newFilters = { ...activeFilters, [key]: value };
      if (value === '' || value === 'all') {
        delete newFilters[key];
      }
      onStateChange(
        {
          page: listState.page,
          pageSize: listState.pageSize,
          sortKey: listState.sortKey,
          sortDirection: listState.sortDirection,
          filters: newFilters,
          search: listState.search,
          selectedIds: Array.from(listState.selectedIds),
        },
        ['filters', 'page']
      );
    }
  }, [handleFilterChangeFromState, useClientSideFiltering, listLogic, onFiltersChange, onStateChange, activeFilters, listState]);

  const syncedSetSearchQuery = React.useCallback((query: string) => {
    setSearchQuery(query);
    if (useClientSideFiltering) {
      listLogic.setSearch(query);
    }
    // Call external callback for controlled mode
    if (onSearchChange) {
      onSearchChange(query);
    }
    // Call unified state change callback
    if (onStateChange) {
      onStateChange(
        {
          page: 1,
          pageSize: listState.pageSize,
          sortKey: listState.sortKey,
          sortDirection: listState.sortDirection,
          filters: listState.filters,
          search: query,
          selectedIds: Array.from(listState.selectedIds),
        },
        ['search', 'page']
      );
    }
  }, [setSearchQuery, useClientSideFiltering, listLogic, onSearchChange, onStateChange, listState]);

  const syncedClearAllFilters = React.useCallback(() => {
    clearAllFiltersFromState();
    if (useClientSideFiltering) {
      listLogic.clearFilters();
    }
    // Call external callbacks for controlled mode
    if (onFiltersChange) {
      onFiltersChange({});
    }
    if (onSearchChange) {
      onSearchChange('');
    }
    // Call unified state change callback
    if (onStateChange) {
      onStateChange(
        {
          page: 1,
          pageSize: listState.pageSize,
          sortKey: listState.sortKey,
          sortDirection: listState.sortDirection,
          filters: {},
          search: '',
          selectedIds: Array.from(listState.selectedIds),
        },
        ['filters', 'search', 'page']
      );
    }
  }, [clearAllFiltersFromState, useClientSideFiltering, listLogic, onFiltersChange, onSearchChange, onStateChange, listState]);

  // Use synced or listLogic state depending on client-side filtering mode
  const hasActiveFilters = useClientSideFiltering ? listLogic.hasActiveFilters : hasActiveFiltersFromState;

  // Confirmation dialog state (extracted to useConfirmDialog hook)
  const confirmDialog = useConfirmDialog();

  // Map ListState to query input format
  const resolvedQueryInput = React.useMemo<TInput>(() => {
    if (queryInput) {
      return queryInput(listState) as TInput;
    }
    return listState as unknown as TInput;
  }, [queryInput, listState]);

  // Resolve query - priority: items > useQuery > procedure > query
  //
  // NOTE: These conditional hook calls are safe because:
  // 1. Props (useQueryFactory, procedure) are stable and don't change between renders
  // 2. The condition order is consistent across the component lifecycle
  // 3. Only ONE query source should be provided per component instance
  //
  // This pattern is a pragmatic trade-off to support multiple query APIs
  // (factory hooks, tRPC procedures, direct queries) in a single component.
  // See: https://react.dev/reference/rules/rules-of-hooks#only-call-hooks-at-the-top-level
  //
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Safe: props are stable
  const factoryQuery = useQueryFactory ? useQueryFactory(resolvedQueryInput) : null;
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Safe: props are stable
  const procedureQuery = procedure ? procedure.useQuery(resolvedQueryInput) : null;

  // Use resolved query (priority: items > factory > procedure > direct)
  // When directItems is provided, create a synthetic query object
  // When loading with items prop, create a synthetic loading query
  const query = directItems !== undefined
    ? { data: directItems as unknown as TData, isLoading: directIsLoading ?? false }
    : directIsLoading
      ? { data: undefined as unknown as TData, isLoading: true }
      : (factoryQuery || procedureQuery || directQuery);

  // Validate that at least one data source is provided (skip if loading via items prop)
  if (!query && directItems === undefined && !directIsLoading) {
    throw new Error(
      'ListPage requires one of: items, useQuery, procedure, or query prop. ' +
      'Use items for direct data, useQuery for reactive queries.'
    );
  }

  // ---------------------------------------------------------------------------
  // Data Processing
  // ---------------------------------------------------------------------------

  const rows = React.useMemo(() => {
    // When using client-side filtering, use listLogic's sorted/filtered items
    if (useClientSideFiltering && listLogic.sortedItems) {
      return listLogic.sortedItems as TRow[];
    }
    // When using direct items without filtering, return them directly
    if (directItems !== undefined) {
      // Apply client-side sorting if cardSortConfig is provided
      if (cardSortConfig && listLogic.sortBy) {
        const sortedItems = [...directItems].sort(cardSortConfig.compareFn(listLogic.sortBy));
        return sortedItems;
      }
      return directItems;
    }
    if (!query?.data) return [];
    return getRows(query.data);
  }, [useClientSideFiltering, listLogic.sortedItems, listLogic.sortBy, directItems, cardSortConfig, query?.data, getRows]);

  const total = React.useMemo(() => {
    // When using client-side filtering (directItems provided), use filtered count
    if (useClientSideFiltering) {
      return listLogic.filteredCount;
    }
    // Server-side data: use getTotal or extract from data
    if (!query?.data) return 0;
    return getTotal ? getTotal(query.data) : extractTotalFromData(query.data, rows.length);
  }, [useClientSideFiltering, listLogic.filteredCount, query?.data, getTotal, rows.length]);

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  const isLoadingState = directIsLoading ?? query?.isLoading ?? false;

  if (isLoadingState) {
    if (skeleton) return skeleton;

    // Determine if filters should be shown
    const hasFilters = !!(searchable || searchConfig || filters || cardFilters);
    const hasPagination = !!(pagination || offsetPagination);

    return (
      <ListPageSkeleton
        containerVariant={containerVariant as ContainerVariant}
        viewMode={isCardsView ? 'cards' : 'table'}
        showHeader={!!(title || label || description || createAction)}
        showLabel={!!label}
        showDescription={!!description}
        showHeaderAction={!!createAction}
        showFilters={hasFilters}
        showViewToggle={effectiveViewModeToggle}
        showStats={!!statsSection}
        statsCount={statsSection?.cards?.length ?? 4}
        tableColumns={columns?.length ?? 4}
        tableRows={5}
        cardsCount={6}
        gridColumns={3}
        showPagination={hasPagination}
        className={className}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // Container Classes (shared with CardListPage)
  // ---------------------------------------------------------------------------

  const classes = getContainerClasses(containerVariant as ContainerVariant);
  const containerClasses = classes.container;
  const cardContainerClasses = classes.card;
  const headerSectionClasses = classes.header;
  const contentSectionClasses = classes.content;

  // ---------------------------------------------------------------------------
  // Empty State
  // ---------------------------------------------------------------------------

  if (!isLoadingState && rows.length === 0) {
    // Check if filters or search are active
    // Use listLogic.search for client-side filtering, searchQuery for server-side
    const currentSearch = useClientSideFiltering ? listLogic.search : searchQuery;
    const hasActiveFiltersOrSearch = hasActiveFilters || currentSearch.length > 0;

    // If filters/search are active but no results, show emptySearchState
    if (hasActiveFiltersOrSearch) {
      const emptySearchConfig = emptySearchState || {
        title: 'No results found',
        description: 'Try adjusting your search or filters.',
        showClearButton: true,
      };

      return (
        <div className={cn(containerClasses, className)}>
          <div className={cardContainerClasses}>
            {/* Header */}
            <div className={headerSectionClasses}>
              <div className="flex items-center justify-between">
                <div>
                  {label && <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>}
                  <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                  {description && <p className="text-muted-foreground">{resolveDescription(description, query?.data)}</p>}
                </div>
              </div>

              {/* Search/Filter controls - keep visible so users can modify their search */}
              <div className="mt-4 flex items-center gap-4">
                <div className="flex-1">
                  <ListPageFilters
                    searchable={searchConfig
                      ? { placeholder: searchConfig.placeholder ?? resolvedLabels.search.placeholder }
                      : searchable}
                    searchQuery={useClientSideFiltering ? listLogic.search : searchQuery}
                    onSearchChange={syncedSetSearchQuery}
                    filters={normalizedFiltersArray}
                    activeFilters={useClientSideFiltering ? listLogic.filters : activeFilters}
                    onFilterChange={syncedHandleFilterChange}
                    hasActiveFilters={hasActiveFilters}
                    onClearFilters={syncedClearAllFilters}
                    labels={{
                      search: resolvedLabels.search,
                    }}
                  />
                </div>
              </div>
            </div>
            {/* Empty search state */}
            <div className={contentSectionClasses}>
              <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="empty-search-state">
                <p className="text-lg font-medium">{emptySearchConfig.title}</p>
                <p className="text-muted-foreground mt-1">{emptySearchConfig.description}</p>
                {emptySearchConfig.showClearButton && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={syncedClearAllFilters}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // No data at all - show regular empty state
    const emptyConfig = emptyState || {};
    return (
      <div className={cn(containerClasses, className)}>
        <div className={cardContainerClasses}>
          {/* Header */}
          <div className={headerSectionClasses}>
            <div className="flex items-center justify-between">
              <div>
                {label && <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>}
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {description && <p className="text-muted-foreground">{resolveDescription(description, query?.data)}</p>}
              </div>
              {createAction && (() => {
                const CreateIcon = resolveIcon(createAction.icon);
                if (createAction.href) {
                  return (
                    <Button asChild>
                      <Link to={createAction.href}>
                        {CreateIcon && <CreateIcon className="h-4 w-4 mr-2" />}
                        {createAction.label || 'Add New'}
                      </Link>
                    </Button>
                  );
                }
                return (
                  <Button
                    onClick={createAction.onClick}
                    leftIcon={CreateIcon ? <CreateIcon className="h-4 w-4" /> : undefined}
                  >
                    {createAction.label || 'Add New'}
                  </Button>
                );
              })()}
            </div>
          </div>
          {/* Empty state */}
          <div className={contentSectionClasses}>
            <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="empty-state">
              <p className="text-lg font-medium">{emptyConfig.title || resolvedLabels.emptyState.title}</p>
              <p className="text-muted-foreground mt-1">{emptyConfig.description || resolvedLabels.emptyState.description}</p>
              {emptyConfig.action && (
                emptyConfig.action.href ? (
                  <Button className="mt-4" asChild>
                    <Link to={emptyConfig.action.href}>
                      {emptyConfig.action.label}
                    </Link>
                  </Button>
                ) : (
                  <Button className="mt-4" onClick={emptyConfig.action.onClick}>
                    {emptyConfig.action.label}
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className={cn(containerClasses, className)} data-theme={theme}>
      <div className={cardContainerClasses}>
        {/* Header Section */}
        <div className={headerSectionClasses}>
          <div className="flex items-center justify-between">
            <div>
              {label && <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>}
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {description && <p className="text-muted-foreground">{resolveDescription(description, query?.data)}</p>}
            </div>
            <div className="flex items-center gap-2">
              {headerActions?.map((action, i) => {
                const ActionIcon = resolveIcon(action.icon);
                if (action.href) {
                  return (
                    <Button
                      key={i}
                      asChild
                      variant={action.variant || 'outline'}
                      disabled={action.disabled}
                    >
                      <Link to={action.href}>
                        {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                        {action.label}
                      </Link>
                    </Button>
                  );
                }
                return (
                  <Button
                    key={i}
                    variant={action.variant || 'outline'}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    leftIcon={ActionIcon ? <ActionIcon className="h-4 w-4" /> : undefined}
                  >
                    {action.label}
                  </Button>
                );
              })}
              {createAction && (() => {
                const CreateIcon = resolveIcon(createAction.icon);
                if (createAction.href) {
                  return (
                    <Button asChild>
                      <Link to={createAction.href}>
                        {CreateIcon && <CreateIcon className="h-4 w-4 mr-2" />}
                        {createAction.label || 'Add New'}
                      </Link>
                    </Button>
                  );
                }
                return (
                  <Button
                    onClick={createAction.onClick}
                    leftIcon={CreateIcon ? <CreateIcon className="h-4 w-4" /> : undefined}
                  >
                    {createAction.label || 'Add New'}
                  </Button>
                );
              })()}
            </div>
            {resolvedSlots.headerSlot}
          </div>

          {/* Before Filters Slot (card mode) */}
          {isCardsView && resolvedSlots.beforeFilters}

          {/* Filters (inside header section) */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1">
              <ListPageFilters
                searchable={searchConfig
                  ? { placeholder: searchConfig.placeholder ?? resolvedLabels.search.placeholder }
                  : searchable}
                searchQuery={useClientSideFiltering ? listLogic.search : searchQuery}
                onSearchChange={syncedSetSearchQuery}
                filters={normalizedFiltersArray}
                activeFilters={useClientSideFiltering ? listLogic.filters : activeFilters}
                onFilterChange={syncedHandleFilterChange}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={syncedClearAllFilters}
                labels={{
                  search: resolvedLabels.search,
                }}
              />
            </div>
            {/* View Mode Toggle */}
            {isToggleEnabled && (
              <ViewModeToggle
                viewMode={resolvedViewMode}
                onViewModeChange={setViewMode}
                hasColumns={!!columns}
                hasRenderCard={!!effectiveRenderCard}
                hasGraphConfig={!!graphConfig}
              />
            )}
          </div>

          {/* After Filters Slot (card mode) */}
          {isCardsView && resolvedSlots.afterFilters}
        </div>

        {/* Content Section */}
        <div className={contentSectionClasses}>
          {/* Stats (table mode - lookup from data) */}
          {stats && stats.length > 0 && (
            <ListPageStats stats={stats} data={query?.data} />
          )}

          {/* Stats Section (card mode - direct values) */}
          {statsSection && statsSection.cards.length > 0 && (
            <div
              className={cn(
                'grid gap-3 sm:gap-4',
                statsSection.columns === 2 && 'grid-cols-2',
                statsSection.columns === 3 && 'grid-cols-2 lg:grid-cols-3',
                (!statsSection.columns || statsSection.columns === 4) && 'grid-cols-2 lg:grid-cols-4',
                statsSection.className
              )}
            >
              {statsSection.cards.map((card, index) => {
                const CardIcon = card.icon ? resolveIcon(card.icon) : null;
                return (
                  <div
                    key={`stat-${index}`}
                    className="p-3 sm:p-4 rounded-xl border border-border bg-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm text-muted-foreground truncate pr-2">
                        {card.label}
                      </span>
                      {CardIcon && (
                        <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
                          <CardIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <p className="text-lg sm:text-2xl font-bold text-foreground truncate">
                        {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                      </p>
                      {card.trend && (
                        <span
                          className={cn(
                            'flex items-center gap-1 text-xs font-medium shrink-0',
                            card.trend.direction === 'up' && 'text-success',
                            card.trend.direction === 'down' && 'text-destructive',
                            card.trend.direction === 'neutral' && 'text-muted-foreground'
                          )}
                        >
                          {card.trend.direction === 'up' ? '+' : ''}
                          {card.trend.label ?? `${card.trend.value}%`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {resolvedSlots.beforeTableSlot}

          {/* Section Header (between stats and table) */}
          {(sectionTitle) && (
            <div className="flex items-center justify-between">
              <div>
                {sectionTitle && (
                  <h2 className="text-lg font-semibold">{sectionTitle}</h2>
                )}
                {sectionDescription && (
                  <p className="text-sm text-muted-foreground">{sectionDescription}</p>
                )}
              </div>
            </div>
          )}

          {/* View Switcher (ADR-0051) */}
          {isTableView && (
            <>
              {/* Bulk Actions Bar (Table Mode) */}
              {selectable && props.bulkActions && (
                <ListPageBulkActions
                  bulkActions={props.bulkActions}
                  selectedCount={selectedIds.size}
                  selectedRows={rows.filter((row, i) => selectedIds.has(getRowKey(row, rowKey, i)))}
                  onClearSelection={clearSelection}
                  labels={resolvedLabels.selection}
                />
              )}

              {/* Table View */}
              <ListPageTable
                rows={rows}
                columns={columns!}
                rowKey={rowKey}
                rowActions={resolvedRowActions}
                selectable={selectable}
                selectedIds={selectedIds}
                onSelectRow={handleSelectRow}
                onSelectAll={handleSelectAll}
                sortBy={listLogic.sortBy}
                sortOrder={listLogic.sortOrder}
                onSortChange={listLogic.setSortBy}
                onConfirm={confirmDialog.open}
                onRowClick={onRowClick}
              />
            </>
          )}

          {isCardsView && (
            <>
              <CardView
                items={rows}
                renderCard={effectiveRenderCard!}
                cardActions={resolvedCardActions}
                cardHref={cardHref}
                gridClassName={gridClassName}
                sections={sections}
                keyExtractor={keyExtractor as (item: TRow) => string}
                refetch={refetch}
                router={router ? { push: router.push } : undefined}
              />
              {/* Offset Pagination (external state) */}
              {offsetPagination && (
                <OffsetPagination
                  config={offsetPagination}
                  paginationLabels={resolvedLabels.pagination}
                  navigationLabels={resolvedLabels.navigation}
                />
              )}
            </>
          )}

          {isGraphView && graphConfig && (
            <LazyGraphView
              items={rows}
              keyExtractor={keyExtractor as (item: TRow) => string}
              config={graphConfig}
              renderNode={renderGraphNode}
              edges={typeof graphEdges === 'function' ? graphEdges(rows) : graphEdges}
              onNodeClick={onGraphNodeClick}
              isLoading={isLoadingState}
            />
          )}

          {resolvedSlots.afterTableSlot}

          {/* Pagination (internal state) - skip when using offsetPagination */}
          {!offsetPagination && (
            <ListPagePagination
              pagination={pagination}
              total={total}
              listLogic={listLogic}
            />
          )}
        </div>
      </div>

      {/* Confirmation Dialog (outside card container) */}
      <ListPageConfirmDialog
        state={confirmDialog.state}
        onClose={confirmDialog.close}
        onConfirm={confirmDialog.handleConfirm}
      />
    </div>
  );
}

ListPage.displayName = 'ListPage';
