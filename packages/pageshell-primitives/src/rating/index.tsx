/**
 * Rating Components
 *
 * Rating distribution and badge components.
 *
 * @package @pageshell/primitives
 */

'use client';

import * as React from 'react';
import { useCallback } from 'react';
import { Star } from 'lucide-react';
import { cn, useHandlerMap } from '@pageshell/core';

// =============================================================================
// Types
// =============================================================================

export interface RatingDistributionItem {
  rating: number;
  count: number;
  percentage: number;
}

export interface RatingDistributionProps {
  /** Average rating (null for new entities) */
  rating: number | null;
  /** Total number of reviews */
  reviewCount: number;
  /** Distribution data for each star level */
  distribution: RatingDistributionItem[];
  /** Whether this is a new entity (shows "Novo" badge) */
  isNew?: boolean;
  /** Minimum reviews required to show rating */
  minReviewsRequired?: number;
  /** Callback when a rating bar is clicked for filtering */
  onFilterByRating?: (rating: number | null) => void;
  /** Currently selected rating filter */
  selectedRating?: number | null;
  /** Layout variant */
  variant?: 'full' | 'compact';
  /** Additional class name */
  className?: string;
}

// =============================================================================
// RatingDistribution
// =============================================================================

/**
 * RatingDistribution Component
 *
 * Displays rating summary with distribution bars.
 *
 * @example
 * ```tsx
 * <RatingDistribution
 *   rating={4.5}
 *   reviewCount={42}
 *   distribution={[
 *     { rating: 5, count: 25, percentage: 60 },
 *     { rating: 4, count: 10, percentage: 24 },
 *     // ...
 *   ]}
 * />
 * ```
 */
export function RatingDistribution({
  rating,
  reviewCount,
  distribution,
  isNew = false,
  minReviewsRequired = 3,
  onFilterByRating,
  selectedRating,
  variant = 'full',
  className,
}: RatingDistributionProps) {
  const handleRatingClick = useCallback((starRating: number) => {
    if (!onFilterByRating) return;
    // Toggle filter off if clicking the same rating
    if (selectedRating === starRating) {
      onFilterByRating(null);
    } else {
      onFilterByRating(starRating);
    }
  }, [onFilterByRating, selectedRating]);

  // Memoized handlers for distribution bar clicks
  const { getHandler: getRatingClickHandler } = useHandlerMap<number>((r) => {
    handleRatingClick(r);
  });

  // Memoized handler for clearing the filter
  const handleClearFilter = useCallback(() => {
    onFilterByRating?.(null);
  }, [onFilterByRating]);

  const showNewBadge = isNew || reviewCount < minReviewsRequired;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Rating Display */}
      <div className="flex items-center gap-4">
        {showNewBadge ? (
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-muted-foreground">--</span>
            <span className="text-xs text-muted-foreground">
              {reviewCount} de {minReviewsRequired} avaliações
            </span>
            <span className="mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
              Novo
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-foreground">
              {rating?.toFixed(1)}
            </span>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'h-4 w-4',
                    star <= Math.round(rating || 0)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-transparent text-muted-foreground/30'
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground mt-1">
              {reviewCount} avaliação{reviewCount !== 1 ? 'ões' : ''}
            </span>
          </div>
        )}

        {/* Distribution Bars */}
        {variant === 'full' && (
          <div className="flex-1 space-y-1.5">
            {distribution.map((item) => (
              <button
                key={item.rating}
                onClick={getRatingClickHandler(item.rating)}
                disabled={!onFilterByRating || item.count === 0}
                className={cn(
                  'flex items-center gap-2 w-full group',
                  onFilterByRating && item.count > 0 && 'cursor-pointer',
                  (!onFilterByRating || item.count === 0) && 'cursor-default'
                )}
                aria-label={`Filtrar por ${item.rating} estrelas (${item.count} avaliações)`}
              >
                <span
                  className={cn(
                    'text-sm font-medium w-3 text-right',
                    selectedRating === item.rating
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  {item.rating}
                </span>
                <Star
                  className={cn(
                    'h-3 w-3 flex-shrink-0',
                    selectedRating === item.rating
                      ? 'fill-primary text-primary'
                      : 'fill-yellow-400 text-yellow-400'
                  )}
                />
                <div className="flex-1 h-2 relative bg-border rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      'bg-primary',
                      onFilterByRating && item.count > 0 && 'group-hover:opacity-80',
                      selectedRating === item.rating && 'ring-2 ring-primary/50'
                    )}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span
                  className={cn(
                    'text-xs w-10 text-right',
                    selectedRating === item.rating
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground'
                  )}
                >
                  {item.percentage}%
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter indicator */}
      {selectedRating && (
        <div className="flex items-center justify-between text-sm bg-card/50 rounded-md px-3 py-2">
          <span className="text-muted-foreground">
            Mostrando avaliações de {selectedRating} estrela{selectedRating !== 1 ? 's' : ''}
          </span>
          <button
            onClick={handleClearFilter}
            className="text-primary hover:underline text-xs"
          >
            Limpar filtro
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// RatingBadge
// =============================================================================

export interface RatingBadgeProps {
  rating: number | null;
  reviewCount: number;
  isNew?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Compact rating badge for cards
 *
 * @example
 * ```tsx
 * <RatingBadge rating={4.5} reviewCount={42} />
 * ```
 */
export function RatingBadge({
  rating,
  reviewCount,
  isNew = false,
  size = 'md',
  className,
}: RatingBadgeProps) {
  if (isNew) {
    return (
      <span className={cn(
        'px-2 py-0.5 text-xs font-medium rounded-full',
        'bg-primary/10 text-primary',
        className
      )}>
        Novo
      </span>
    );
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Star
        className={cn(
          'fill-yellow-400 text-yellow-400',
          size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
        )}
      />
      <span className={cn('font-semibold', size === 'sm' ? 'text-sm' : 'text-base')}>
        {rating?.toFixed(1)}
      </span>
      <span className={cn('text-muted-foreground', size === 'sm' ? 'text-xs' : 'text-sm')}>
        ({reviewCount})
      </span>
    </div>
  );
}
