'use client';

/**
 * PageInfiniteScroll Component
 *
 * Low-level wrapper that detects when the user scrolls near the end of content
 * and triggers a load more callback using Intersection Observer.
 *
 * **Choose the right component:**
 * - Use `PageInfiniteScroll` when you need low-level control and provide your own children
 * - Use `PageInfiniteList` when you need a complete solution with items, renderItem,
 *   empty states, loading skeletons, and staggered animations
 *
 * @see PageInfiniteList for a higher-level alternative with built-in rendering
 *
 * @example Basic infinite scroll
 * <PageInfiniteScroll
 *   hasMore={hasNextPage}
 *   isLoading={isFetchingNextPage}
 *   onLoadMore={fetchNextPage}
 * >
 *   <ItemsList items={items} />
 * </PageInfiniteScroll>
 *
 * @example With custom loader and end message
 * <PageInfiniteScroll
 *   hasMore={hasNextPage}
 *   isLoading={isFetchingNextPage}
 *   onLoadMore={fetchNextPage}
 *   loader={<CustomSpinner />}
 *   endMessage={<p className="text-center py-4">Fim da lista</p>}
 * >
 *   <ItemsList items={items} />
 * </PageInfiniteScroll>
 *
 * @example With threshold
 * <PageInfiniteScroll
 *   hasMore={hasNextPage}
 *   isLoading={isFetchingNextPage}
 *   onLoadMore={fetchNextPage}
 *   threshold={400}
 * >
 *   <ItemsList items={items} />
 * </PageInfiniteScroll>
 *
 * @example In scrollable container
 * <div ref={scrollRef} className="h-[500px] overflow-y-auto">
 *   <PageInfiniteScroll
 *     hasMore={hasNextPage}
 *     isLoading={isFetchingNextPage}
 *     onLoadMore={fetchNextPage}
 *     scrollableTarget={scrollRef.current}
 *   >
 *     <ItemsList items={items} />
 *   </PageInfiniteScroll>
 * </div>
 */

import { useRef, useEffect, useCallback, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@pageshell/core';

// =============================================================================
// Types
// =============================================================================

/**
 * PageInfiniteScroll component props
 */
export interface PageInfiniteScrollProps {
  /** Content to render */
  children: ReactNode;

  // Loading state
  /** Has more items to load */
  hasMore: boolean;
  /** Currently loading */
  isLoading: boolean;
  /** Load more handler */
  onLoadMore: () => void;

  // UI
  /** Custom loader element */
  loader?: ReactNode;
  /** Message when no more items */
  endMessage?: ReactNode;

  // Behavior
  /** Threshold in pixels before end to trigger load */
  threshold?: number;
  /** Load on initial render if viewport not filled */
  initialLoad?: boolean;
  /** Root margin for intersection observer */
  rootMargin?: string;

  // Container
  /** Scrollable container element or ID */
  scrollableTarget?: HTMLElement | string | null;

  // Accessibility
  /** Accessible label for loading indicator */
  loadingLabel?: string;
  /** Test ID */
  testId?: string;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Default Loader
// =============================================================================

function DefaultLoader() {
  return (
    <div className="flex items-center justify-center py-6" role="status">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <span className="sr-only">Loading more items...</span>
    </div>
  );
}

// =============================================================================
// PageInfiniteScroll Component
// =============================================================================

export function PageInfiniteScroll({
  children,
  // Loading state
  hasMore,
  isLoading,
  onLoadMore,
  // UI
  loader,
  endMessage,
  // Behavior
  threshold = 200,
  initialLoad = false,
  rootMargin,
  // Container
  scrollableTarget,
  // Accessibility
  loadingLabel = 'Loading more items',
  testId,
  className,
}: PageInfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(isLoading);
  const hasMoreRef = useRef(hasMore);

  // Keep refs in sync
  useEffect(() => {
    isLoadingRef.current = isLoading;
    hasMoreRef.current = hasMore;
  }, [isLoading, hasMore]);

  // Handle intersection
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry?.isIntersecting && hasMoreRef.current && !isLoadingRef.current) {
        onLoadMore();
      }
    },
    [onLoadMore]
  );

  // Setup intersection observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    // Determine root element
    let root: HTMLElement | null = null;
    if (scrollableTarget) {
      if (typeof scrollableTarget === 'string') {
        root = document.getElementById(scrollableTarget);
      } else {
        root = scrollableTarget;
      }
    }

    // Calculate root margin from threshold
    const margin = rootMargin ?? `0px 0px ${threshold}px 0px`;

    const observer = new IntersectionObserver(handleIntersect, {
      root,
      rootMargin: margin,
      threshold: 0,
    });

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [handleIntersect, scrollableTarget, threshold, rootMargin]);

  // Initial load check
  useEffect(() => {
    if (!initialLoad || isLoading || !hasMore) return;

    // Check if sentinel is already visible
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const rect = sentinel.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    if (rect.top < viewportHeight + threshold) {
      onLoadMore();
    }
  }, [initialLoad, isLoading, hasMore, onLoadMore, threshold]);

  return (
    <div className={className} data-testid={testId}>
      {/* Content */}
      {children}

      {/* Loading indicator */}
      {isLoading && (
        <div role="status" aria-label={loadingLabel}>
          {loader ?? <DefaultLoader />}
        </div>
      )}

      {/* End message */}
      {!hasMore && !isLoading && endMessage && (
        <div role="status" aria-live="polite">
          {endMessage}
        </div>
      )}

      {/* Sentinel element for intersection detection */}
      {hasMore && (
        <div
          ref={sentinelRef}
          className="h-px w-full"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
