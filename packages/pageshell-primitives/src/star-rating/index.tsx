/**
 * StarRating Primitive
 *
 * Interactive or read-only star rating display.
 *
 * @package @pageshell/primitives
 */

'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { Star } from 'lucide-react';
import { cn, useHandlerMap } from '@pageshell/core';

// =============================================================================
// Types
// =============================================================================

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
} as const;

const labelText: Record<number, string> = {
  1: 'Ruim',
  2: 'Regular',
  3: 'Bom',
  4: 'Muito Bom',
  5: 'Excelente',
};

export interface StarRatingProps {
  /** Current rating value (0-5) */
  value: number;
  /** Callback when rating changes */
  onChange?: (value: number) => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the rating is interactive (clickable) */
  interactive?: boolean;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Show text label for current rating */
  showLabel?: boolean;
  /** Additional class name */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * StarRating Component
 *
 * Interactive or read-only star rating display.
 *
 * @example
 * ```tsx
 * // Read-only
 * <StarRating value={4} />
 *
 * // Interactive
 * <StarRating value={rating} onChange={setRating} interactive />
 * ```
 */
export function StarRating({
  value,
  onChange,
  size = 'md',
  interactive = false,
  disabled = false,
  showLabel = false,
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const displayValue = interactive && !disabled ? hoverValue || value : value;

  const handleClick = useCallback(
    (rating: number) => {
      if (!disabled && interactive && onChange) {
        onChange(rating);
      }
    },
    [disabled, interactive, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, rating: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick(rating);
      }
    },
    [handleClick]
  );

  const handleMouseEnter = useCallback(
    (rating: number) => {
      if (interactive && !disabled) {
        setHoverValue(rating);
      }
    },
    [interactive, disabled]
  );

  const handleMouseLeave = useCallback(() => {
    if (interactive && !disabled) {
      setHoverValue(0);
    }
  }, [interactive, disabled]);

  // Memoized handlers for individual star buttons
  const { getHandler: getClickHandler } = useHandlerMap<number>((rating) => {
    handleClick(rating);
  });

  const { getHandler: getMouseEnterHandler } = useHandlerMap<number>((rating) => {
    handleMouseEnter(rating);
  });

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5" role="group" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((rating) => {
          const isFilled = rating <= displayValue;

          return (
            <button
              key={rating}
              type="button"
              onClick={getClickHandler(rating)}
              onKeyDown={(e) => handleKeyDown(e, rating)}
              onMouseEnter={getMouseEnterHandler(rating)}
              onMouseLeave={handleMouseLeave}
              disabled={!interactive || disabled}
              className={cn(
                'relative flex items-center justify-center transition-all duration-150',
                interactive && !disabled && [
                  'min-h-[44px] min-w-[44px] cursor-pointer hover:scale-110 touch-manipulation',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded',
                ],
                !interactive && 'cursor-default',
                disabled && 'cursor-not-allowed opacity-50'
              )}
              aria-label={`${rating} estrela${rating > 1 ? 's' : ''}`}
              aria-pressed={isFilled}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  'transition-colors duration-150',
                  isFilled
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-transparent text-muted-foreground/30',
                  interactive && !disabled && !isFilled && 'hover:text-yellow-300'
                )}
              />
            </button>
          );
        })}
      </div>

      {showLabel && value > 0 && (
        <span className="ml-2 text-sm text-muted-foreground">
          {labelText[value]}
        </span>
      )}
    </div>
  );
}
