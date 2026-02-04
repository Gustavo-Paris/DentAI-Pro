/**
 * InfiniteCardList Composite
 *
 * Declarative card list with infinite scroll pagination.
 * Integrates with tRPC useInfiniteQuery or React Query.
 *
 * @example
 * ```tsx
 * // Basic usage with tRPC infinite query
 * const query = api.reviews.list.useInfiniteQuery(
 *   { mentorId, sortBy, limit: 10 },
 *   { getNextPageParam: (lastPage) => lastPage.nextCursor }
 * );
 *
 * <InfiniteCardList
 *   query={query}
 *   getItems={(page) => page.reviews}
 *   keyExtractor={(review) => review.id}
 *   renderCard={(review) => <ReviewCard review={review} />}
 *   sortConfig={{
 *     options: [
 *       { value: 'newest', label: 'Most recent' },
 *       { value: 'helpful', label: 'Most helpful' },
 *     ],
 *     default: 'newest',
 *   }}
 *   sortValue={sortBy}
 *   onSortChange={setSortBy}
 *   emptyState={{
 *     variant: 'data',
 *     title: 'No reviews',
 *     description: 'No reviews yet',
 *   }}
 * />
 * ```
 *
 * @module infinite-card-list/InfiniteCardList
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { defaultKeyExtractor } from '../shared/utils';
import { INFINITE_CARD_LIST_DEFAULTS } from '../shared/defaults';
import { PageShellProvider } from '@pageshell/theme';
import {
  Button,
  EmptyState,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@pageshell/primitives';
import { ChevronDown } from 'lucide-react';

import type { InfiniteCardListProps, InfinitePage } from './types';
import { CardListSkeleton } from './components';

// Use shared defaults
const DEFAULTS = INFINITE_CARD_LIST_DEFAULTS;

// =============================================================================
// Default Extractors
// =============================================================================

function defaultGetItems<TItem>(page: InfinitePage<TItem>): TItem[] {
  return page.items ?? [];
}

function defaultCountLabel(count: number): string {
  return `${count} item${count !== 1 ? 's' : ''}`;
}

// =============================================================================
// InfiniteCardList Component
// =============================================================================

function InfiniteCardListInner<
  TItem = Record<string, unknown>,
  TPage = InfinitePage<TItem>,
>(
  props: InfiniteCardListProps<TItem, TPage>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {
    // Base
    theme = 'default',
    title,
    className,
    // Data
    query,
    getItems = defaultGetItems as (page: TPage) => TItem[],
    keyExtractor = defaultKeyExtractor,
    // Sort
    sortConfig,
    sortValue,
    onSortChange,
    // Filters
    filters,
    filterValues,
    onFilterChange,
    // Rendering
    renderCard,
    // Layout
    containerClassName,
    cardsClassName = DEFAULTS.cardsClassName,
    showCount = DEFAULTS.showCount,
    countLabel = defaultCountLabel,
    // Load More
    loadMoreText = DEFAULTS.loadMoreText,
    loadingText = DEFAULTS.loadingText,
    showLoadMoreIcon = DEFAULTS.showLoadMoreIcon,
    // Empty States
    emptyState,
    emptyFilterState,
    getEmptyState,
    // Skeleton
    skeletonConfig,
    skeleton,
    // Slots
    slots,
  } = props;

  // ---------------------------------------------------------------------------
  // Extract Items from Pages
  // ---------------------------------------------------------------------------

  const items = React.useMemo(() => {
    if (!query.data?.pages) return [];
    return query.data.pages.flatMap((page) => getItems(page));
  }, [query.data?.pages, getItems]);

  // ---------------------------------------------------------------------------
  // Check if filters are active
  // ---------------------------------------------------------------------------

  const hasActiveFilters = React.useMemo(() => {
    if (!filterValues || !filters) return false;
    return Object.entries(filterValues).some(([key, value]) => {
      const filterConfig = filters[key];
      if (!filterConfig) return false;
      return value !== null && value !== filterConfig.default;
    });
  }, [filterValues, filters]);

  // ---------------------------------------------------------------------------
  // Clear Filters
  // ---------------------------------------------------------------------------

  const handleClearFilters = React.useCallback(() => {
    if (!filters || !onFilterChange) return;
    Object.entries(filters).forEach(([key, config]) => {
      onFilterChange(key, config.default ?? null);
    });
  }, [filters, onFilterChange]);

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (query.isLoading) {
    if (skeleton) return <PageShellProvider theme={theme}>{skeleton}</PageShellProvider>;

    const config = { count: DEFAULTS.skeletonCount, ...skeletonConfig };
    return (
      <PageShellProvider theme={theme}>
        <div ref={ref} className={cn('space-y-6', containerClassName, className)}>
          {slots?.beforeCards}
          <CardListSkeleton
            count={config.count ?? DEFAULTS.skeletonCount}
            cardSkeleton={config.cardSkeleton}
            showHeader={config.showHeader}
          />
        </div>
      </PageShellProvider>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty State (No Data)
  // ---------------------------------------------------------------------------

  if (items.length === 0 && !hasActiveFilters) {
    const empty = { ...DEFAULTS.emptyState, ...emptyState };
    // Map 'filter' variant to 'search' for EmptyState compatibility
    const mappedVariant = emptyState?.variant === 'filter' ? 'search' : (emptyState?.variant ?? 'data');
    return (
      <PageShellProvider theme={theme}>
        <div ref={ref} className={cn('space-y-6', containerClassName, className)}>
          {slots?.beforeCards}
          <EmptyState
            variant={mappedVariant}
            withCard
            title={empty.title ?? DEFAULTS.emptyState.title}
            description={empty.description}
            action={empty.action ? {
              label: empty.action.label,
              onClick: empty.action.onClick,
              href: empty.action.href,
              // Map variants not supported by EmptyStateAction
              variant: (['default', 'primary', 'outline', 'ghost'] as const).includes(empty.action.variant as 'default' | 'primary' | 'outline' | 'ghost')
                ? (empty.action.variant as 'default' | 'primary' | 'outline' | 'ghost')
                : 'default',
            } : undefined}
          />
        </div>
      </PageShellProvider>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty Filter State (No Results After Filters)
  // ---------------------------------------------------------------------------

  if (items.length === 0 && hasActiveFilters) {
    const dynamicEmpty = getEmptyState?.(filterValues);
    const empty = dynamicEmpty || { ...DEFAULTS.emptyFilterState, ...emptyFilterState };

    return (
      <PageShellProvider theme={theme}>
        <div ref={ref} className={cn('space-y-6', containerClassName, className)}>
          {slots?.beforeCards}

          {/* Sort Controls (keep visible for UX) */}
          {sortConfig && sortValue && onSortChange && (
            <div className="flex items-center justify-end">
              <Select value={sortValue} onValueChange={onSortChange}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder={sortConfig.label ?? 'Ordenar por'} />
                </SelectTrigger>
                <SelectContent>
                  {sortConfig.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <EmptyState
            variant="search"
            withCard
            title={empty.title}
            description={empty.description}
            action={
              (emptyFilterState?.showClearButton ?? true)
                ? { label: 'Clear filters', onClick: handleClearFilters }
                : undefined
            }
          />
        </div>
      </PageShellProvider>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <PageShellProvider theme={theme}>
      <div ref={ref} className={cn('space-y-6', containerClassName, className)}>
        {/* Header Slot */}
        {slots?.header}

        {/* Before Cards Slot (e.g., Rating Distribution) */}
        {slots?.beforeCards}

        {/* Sort Controls */}
        {(sortConfig || showCount) && items.length > 0 && (
          <div className="flex items-center justify-between">
            {showCount && (
              <span className="text-sm text-muted-foreground">
                {countLabel(items.length, filterValues)}
              </span>
            )}
            {sortConfig && sortValue && onSortChange && (
              <Select value={sortValue} onValueChange={onSortChange}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder={sortConfig.label ?? 'Ordenar por'} />
                </SelectTrigger>
                <SelectContent>
                  {sortConfig.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* After Controls Slot */}
        {slots?.afterControls}

        {/* Cards List */}
        <div className={cardsClassName}>
          {items.map((item, index) => (
            <div key={keyExtractor(item)}>
              {renderCard(item, index)}
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {query.hasNextPage && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
            >
              {query.isFetchingNextPage ? (
                loadingText
              ) : (
                <>
                  {showLoadMoreIcon && <ChevronDown className="h-4 w-4 mr-2" />}
                  {loadMoreText}
                </>
              )}
            </Button>
          </div>
        )}

        {/* After Cards Slot */}
        {slots?.afterCards}
      </div>
    </PageShellProvider>
  );
}

export const InfiniteCardList = React.forwardRef(InfiniteCardListInner) as <
  TItem = Record<string, unknown>,
  TPage = InfinitePage<TItem>,
>(
  props: InfiniteCardListProps<TItem, TPage> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement;

(InfiniteCardList as React.FC).displayName = 'InfiniteCardList';
