/**
 * PageTimeline Component
 *
 * A vertical timeline for displaying activity feeds, history, or events.
 * Supports date grouping, icons, and load more functionality.
 *
 * @package @pageshell/layouts
 *
 * @example Basic timeline
 * <PageTimeline
 *   items={activities}
 *   renderItem={(activity) => (
 *     <PageTimeline.Item
 *       icon={activity.icon}
 *       title={activity.title}
 *       description={activity.description}
 *       timestamp={activity.createdAt}
 *     />
 *   )}
 * />
 *
 * @example With date grouping
 * <PageTimeline
 *   items={activities}
 *   groupBy="day"
 *   renderItem={(activity) => (
 *     <PageTimeline.Item
 *       icon={Bell}
 *       iconColor="primary"
 *       title={activity.title}
 *       timestamp={activity.createdAt}
 *     />
 *   )}
 * />
 *
 * @example With load more
 * <PageTimeline
 *   items={activities}
 *   hasMore={hasNextPage}
 *   isLoadingMore={isFetchingNextPage}
 *   onLoadMore={fetchNextPage}
 *   renderItem={(activity) => (
 *     <PageTimeline.Item title={activity.title} timestamp={activity.createdAt} />
 *   )}
 * />
 */

'use client';

import { useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@pageshell/core';
import { Button } from '@pageshell/primitives';
import { usePageShellContext } from '@pageshell/theme';
import { variantStyles } from './constants';
import { formatGroupDate, getGroupKey } from './utils';
import { TimelineItem, SkeletonItem, TimelineEmptyState, GroupHeader } from './components';
import type { PageTimelineProps } from './types';

// =============================================================================
// PageTimeline Component
// =============================================================================

function PageTimelineRoot<T>({
  items,
  renderItem,
  keyExtractor,
  dateExtractor,
  // Grouping
  groupBy = 'none',
  // Layout
  variant = 'default',
  animated = true,
  maxAnimationDelay = 8,
  // Load more
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  loadMoreText = 'Carregar mais',
  // States
  isLoading = false,
  skeleton,
  skeletonCount = 3,
  emptyState,
  // Accessibility
  ariaLabel = 'Linha do tempo',
  testId,
  className,
}: PageTimelineProps<T>) {
  const { config } = usePageShellContext();
  const styles = variantStyles[variant];

  // Get item key
  const getItemKey = useCallback(
    (item: T, index: number): string => {
      if (keyExtractor) return keyExtractor(item, index);
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>;
        if ('id' in obj) return String(obj.id);
        if ('_id' in obj) return String(obj._id);
      }
      return String(index);
    },
    [keyExtractor]
  );

  // Get item date
  const getItemDate = useCallback(
    (item: T): Date => {
      if (dateExtractor) return dateExtractor(item);
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>;
        if ('timestamp' in obj) return new Date(obj.timestamp as string);
        if ('createdAt' in obj) return new Date(obj.createdAt as string);
        if ('date' in obj) return new Date(obj.date as string);
      }
      return new Date();
    },
    [dateExtractor]
  );

  // Group items
  const groupedItems =
    groupBy !== 'none'
      ? items.reduce<{ key: string; label: string; items: { item: T; index: number }[] }[]>(
          (groups, item, index) => {
            const date = getItemDate(item);
            const key = getGroupKey(date, groupBy);
            const label = formatGroupDate(date, groupBy);

            const existingGroup = groups.find((g) => g.key === key);
            if (existingGroup) {
              existingGroup.items.push({ item, index });
            } else {
              groups.push({ key, label, items: [{ item, index }] });
            }
            return groups;
          },
          []
        )
      : null;

  // Loading state
  if (isLoading) {
    if (skeleton) return <>{skeleton}</>;

    return (
      <div
        className={cn('relative border-l border-border', styles.container, className)}
        aria-busy="true"
        aria-label={ariaLabel}
      >
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <SkeletonItem key={index} variant={variant} />
        ))}
      </div>
    );
  }

  // Empty state
  if (items.length === 0 && emptyState) {
    return <TimelineEmptyState emptyState={emptyState} />;
  }

  // Empty without state
  if (items.length === 0) {
    return null;
  }

  // Render items (with or without grouping)
  const renderItems = () => {
    if (groupedItems) {
      return groupedItems.map((group) => (
        <div key={group.key}>
          <GroupHeader label={group.label} />
          {group.items.map(({ item, index }) => (
            <div
              key={getItemKey(item, index)}
              className={cn(
                styles.item,
                animated && [
                  config.animate,
                  config.animateDelay(Math.min(index + 1, maxAnimationDelay)),
                ]
              )}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      ));
    }

    return items.map((item, index) => (
      <div
        key={getItemKey(item, index)}
        className={cn(
          styles.item,
          animated && [
            config.animate,
            config.animateDelay(Math.min(index + 1, maxAnimationDelay)),
          ]
        )}
      >
        {renderItem(item, index)}
      </div>
    ));
  };

  return (
    <div
      role="feed"
      aria-label={ariaLabel}
      data-testid={testId}
      className={cn('relative border-l border-border', styles.container, className)}
    >
      {renderItems()}

      {/* Load more */}
      {hasMore && onLoadMore && (
        <div className="pt-4 -ml-8 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="gap-2"
          >
            {isLoadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
            {loadMoreText}
          </Button>
        </div>
      )}
    </div>
  );
}

PageTimelineRoot.displayName = 'PageTimeline';

// =============================================================================
// Compound Component Export
// =============================================================================

export const PageTimeline = Object.assign(PageTimelineRoot, {
  Item: TimelineItem,
});
