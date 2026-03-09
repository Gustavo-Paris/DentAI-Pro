/**
 * Semantic Skeleton System
 *
 * Standardized loading placeholders that match real content dimensions.
 * All variants use PageShell's Skeleton primitive for consistent shimmer animation.
 *
 * Usage guidelines:
 * - Use semantic variants (StatCardSkeleton, ListItemSkeleton, etc.) instead of raw <Skeleton>
 * - For Suspense fallbacks wrapping lazy-loaded sections, use ComponentSkeleton
 * - For full-page loading, use PageLoader (in App.tsx)
 * - For async data loading within a page, use the matching semantic skeleton
 */
import { Skeleton } from '@parisgroup-ai/pageshell/primitives';
import { cn } from '@/lib/utils';

// ─── Stat Card ──────────────────────────────────────────────────────────────
// Matches StatsGrid card: icon + label + large number (h-[88px])

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-4', className)}>
      <div className="flex items-center gap-2.5 mb-2.5">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-3 w-20 rounded" />
      </div>
      <Skeleton className="h-8 w-14 rounded" />
    </div>
  );
}

export function StatsGridSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── List Item ──────────────────────────────────────────────────────────────
// Matches SessionCard / evaluation list items (h-[72px])

export function ListItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 rounded-xl border border-border bg-card p-4', className)}>
      <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  );
}

export function ListSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Activity Feed ──────────────────────────────────────────────────────────
// Matches ActivityFeedSection: avatar + text lines

export function ActivityFeedSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      <Skeleton className="h-5 w-36 rounded" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Chart ──────────────────────────────────────────────────────────────────
// Matches InsightsTab chart area

export function ChartSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn('h-52 w-full rounded-xl', className)} />;
}

// ─── Card with Header ───────────────────────────────────────────────────────
// Matches Card + CardHeader + CardContent pattern (CreditUsageHistory, ReferralCard)

export function CardSkeleton({
  rows = 3,
  rowHeight = 'h-12',
  className,
}: {
  rows?: number;
  rowHeight?: string;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-card', className)}>
      <div className="p-6 pb-2 space-y-1">
        <Skeleton className="h-6 w-48 rounded" />
        <Skeleton className="h-4 w-64 rounded" />
      </div>
      <div className="p-6 pt-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className={cn(rowHeight, 'w-full rounded-lg')} />
        ))}
      </div>
    </div>
  );
}

// ─── Image Placeholder ──────────────────────────────────────────────────────
// Matches DSD preview, clinical photo areas

export function ImageSkeleton({ className, aspectRatio = '4/3' }: { className?: string; aspectRatio?: string }) {
  return <Skeleton className={cn('w-full rounded-xl', className)} style={{ aspectRatio }} />;
}

// ─── Inline Text ────────────────────────────────────────────────────────────
// Matches inline loading (e.g. name in greeting)

export function InlineTextSkeleton({ width = 'w-32', className }: { width?: string; className?: string }) {
  return <Skeleton className={cn('inline-block h-7 align-middle rounded-lg', width, className)} />;
}

// ─── Component Suspense Fallback ────────────────────────────────────────────
// Generic fallback for lazy-loaded components (preserves layout height)

interface ComponentSkeletonProps {
  height?: string;
  width?: string;
  className?: string;
}

export function ComponentSkeleton({ height = '200px', width = '100%', className }: ComponentSkeletonProps) {
  return <Skeleton className={cn('rounded-lg', className)} style={{ height, width }} />;
}
