'use client';

/**
 * PageSessionCardSkeleton - Session Card Skeleton Primitive
 *
 * Displays loading skeleton matching PageSessionCard layout.
 * Uses portal-* CSS classes for consistent design system styling.
 *
 * @example
 * ```tsx
 * <PageInfiniteList
 *   skeleton={<PageSessionCardSkeleton />}
 *   skeletonCount={3}
 *   ...
 * />
 * ```
 */

// =============================================================================
// Types
// =============================================================================

export interface PageSessionCardSkeletonProps {
  /** Show action buttons skeleton (default: true) */
  showActions?: boolean;
  /** Number of action button skeletons (default: 2) */
  actionCount?: number;
}

// =============================================================================
// Component
// =============================================================================

export function PageSessionCardSkeleton({
  showActions = true,
  actionCount = 2,
}: PageSessionCardSkeletonProps = {}) {
  return (
    <div className="portal-session-skeleton">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Session Info Skeleton */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="portal-skeleton portal-skeleton-avatar" />

          {/* Content */}
          <div className="space-y-2 flex-1">
            {/* Title */}
            <div
              className="portal-skeleton portal-skeleton-text-lg"
              style={{ width: '12rem' }}
            />
            {/* Mentor name */}
            <div
              className="portal-skeleton portal-skeleton-text-sm"
              style={{ width: '8rem' }}
            />
            {/* Date and time */}
            <div className="flex gap-4 mt-2">
              <div
                className="portal-skeleton portal-skeleton-text-sm"
                style={{ width: '10rem' }}
              />
              <div
                className="portal-skeleton portal-skeleton-text-sm"
                style={{ width: '6rem' }}
              />
            </div>
          </div>
        </div>

        {/* Actions Skeleton */}
        {showActions && (
          <div className="flex gap-2">
            {Array.from({ length: actionCount }).map((_, i) => (
              <div
                key={i}
                className="portal-skeleton portal-skeleton-button"
                style={{ width: i === 0 ? '5rem' : '6rem' }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

PageSessionCardSkeleton.displayName = 'PageSessionCardSkeleton';
