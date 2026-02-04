'use client';

/**
 * PageInfiniteList - Infinite Scroll List Primitive
 *
 * High-level list component with IntersectionObserver-based infinite scroll,
 * empty states, loading skeletons, and staggered animations.
 *
 * **Choose the right component:**
 * - Use `PageInfiniteList` when you have items and want automatic rendering,
 *   empty states, skeletons, and animations (recommended for most use cases)
 * - Use `PageInfiniteScroll` when you need low-level control and provide your own children
 *
 * @see PageInfiniteScroll for a lower-level wrapper alternative
 *
 * @module ui/page-shell/PageInfiniteList
 *
 * @example Basic usage
 * ```tsx
 * <PageInfiniteList
 *   items={sessions}
 *   renderItem={(session) => <SessionCard session={session} />}
 *   keyExtractor={(s) => s.id}
 *   hasMore={hasNextPage}
 *   isLoading={isLoading}
 *   onLoadMore={fetchNextPage}
 * />
 * ```
 *
 * @example With empty state and skeleton (using string icon)
 * ```tsx
 * <PageInfiniteList
 *   items={notifications}
 *   renderItem={(n) => <NotificationCard notification={n} />}
 *   keyExtractor={(n) => n.id}
 *   hasMore={hasMore}
 *   isLoading={isLoading}
 *   isFetchingNextPage={isFetchingNextPage}
 *   onLoadMore={loadMore}
 *   emptyState={{
 *     title: "Sem notificacoes",
 *     description: "Voce nao tem notificacoes no momento.",
 *     icon: "bell", // String variant - no Lucide import needed
 *   }}
 *   skeleton={<NotificationSkeleton />}
 *   skeletonCount={3}
 * />
 * ```
 *
 * @example With custom animation delay
 * ```tsx
 * <PageInfiniteList
 *   items={courses}
 *   renderItem={(course, index) => <CourseCard course={course} featured={index === 0} />}
 *   keyExtractor={(c) => c.id}
 *   hasMore={false}
 *   isLoading={false}
 *   onLoadMore={() => {}}
 *   animationDelayMs={150}
 *   itemClassName="portal-course-card"
 * />
 * ```
 */

import { useEffect, useRef, useCallback, type ReactNode } from 'react';
import { cn } from '@pageshell/core';
import {
  Button,
  EmptyState,
  resolveIcon,
  type EmptyStateAction,
  type EmptyStateVariant,
  type IconName,
} from '@pageshell/primitives';
import { Loader2, type LucideIcon } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

/**
 * Empty state configuration for PageInfiniteList
 */
export interface PageInfiniteListEmptyState {
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Icon - string variant (e.g., "calendar", "bell") or LucideIcon or ReactNode */
  icon?: IconName | LucideIcon | ReactNode;
  /** Visual variant */
  variant?: EmptyStateVariant;
  /** Primary action */
  action?: EmptyStateAction;
  /** Secondary action */
  secondaryAction?: EmptyStateAction;
}

/**
 * PageInfiniteList props
 */
export interface PageInfiniteListProps<T> {
  /** Items to render */
  items: T[];

  /** Render function for each item */
  renderItem: (item: T, index: number) => ReactNode;

  /** Extract unique key from item */
  keyExtractor: (item: T) => string;

  /** Whether there are more items to load */
  hasMore: boolean;

  /** Initial loading state (no items yet) */
  isLoading: boolean;

  /** Fetching next page state */
  isFetchingNextPage?: boolean;

  /** Callback to load more items */
  onLoadMore: () => void;

  /** Empty state configuration */
  emptyState?: PageInfiniteListEmptyState;

  /** Custom skeleton element to render during loading */
  skeleton?: ReactNode;

  /** Number of skeleton items to show (default: 3) */
  skeletonCount?: number;

  /** Animation delay between items in ms (default: 100) */
  animationDelayMs?: number;

  /** Class name for the list container */
  className?: string;

  /** Class name for each item wrapper */
  itemClassName?: string;

  /** Gap between items (Tailwind spacing) */
  gap?: 'none' | 'sm' | 'md' | 'lg';

  /** Show load more button as fallback */
  showLoadMoreButton?: boolean;

  /** Custom load more button text */
  loadMoreText?: string;

  /** IntersectionObserver threshold (default: 0.1) */
  observerThreshold?: number;

  /** IntersectionObserver root margin (default: "100px") */
  observerRootMargin?: string;
}

// =============================================================================
// Gap Styles
// =============================================================================

const gapStyles: Record<NonNullable<PageInfiniteListProps<unknown>['gap']>, string> = {
  none: 'space-y-0',
  sm: 'space-y-2',
  md: 'space-y-4',
  lg: 'space-y-6',
};

// =============================================================================
// Default Skeleton
// =============================================================================

function DefaultSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function PageInfiniteList<T>({
  items,
  renderItem,
  keyExtractor,
  hasMore,
  isLoading,
  isFetchingNextPage = false,
  onLoadMore,
  emptyState,
  skeleton,
  skeletonCount = 3,
  animationDelayMs = 100,
  className,
  itemClassName,
  gap = 'md',
  showLoadMoreButton = true,
  loadMoreText = 'Carregar mais',
  observerThreshold = 0.1,
  observerRootMargin = '100px',
}: PageInfiniteListProps<T>) {
  const observerRef = useRef<HTMLDivElement>(null);

  // Infinite scroll with IntersectionObserver
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry?.isIntersecting && hasMore && !isLoading && !isFetchingNextPage) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, isFetchingNextPage, onLoadMore]
  );

  useEffect(() => {
    const element = observerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: observerThreshold,
      rootMargin: observerRootMargin,
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [handleObserver, observerThreshold, observerRootMargin]);

  // Render skeleton during initial loading
  const SkeletonElement = skeleton ?? <DefaultSkeleton />;

  if (isLoading && items.length === 0) {
    return (
      <div className={cn(gapStyles[gap], className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={`skeleton-${i}`}>{SkeletonElement}</div>
        ))}
      </div>
    );
  }

  // Render empty state
  if (!isLoading && items.length === 0 && emptyState) {
    // Resolve string icon to LucideIcon component
    const resolvedIcon = typeof emptyState.icon === 'string'
      ? resolveIcon(emptyState.icon as IconName)
      : emptyState.icon;

    return (
      <EmptyState
        title={emptyState.title}
        description={emptyState.description}
        icon={resolvedIcon as LucideIcon | ReactNode}
        variant={emptyState.variant}
        action={emptyState.action}
        secondaryAction={emptyState.secondaryAction}
      />
    );
  }

  // Render list
  return (
    <div className={cn(gapStyles[gap], className)}>
      {items.map((item, index) => (
        <div
          key={keyExtractor(item)}
          style={{ animationDelay: `${index * animationDelayMs}ms` }}
          className={itemClassName}
        >
          {renderItem(item, index)}
        </div>
      ))}

      {/* Trigger for infinite scroll */}
      <div ref={observerRef} className="h-4" aria-hidden="true" />

      {/* Loading spinner for next page */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {/* Load more button fallback */}
      {showLoadMoreButton && hasMore && !isFetchingNextPage && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={onLoadMore}>
            {loadMoreText}
          </Button>
        </div>
      )}
    </div>
  );
}

PageInfiniteList.displayName = 'PageInfiniteList';
