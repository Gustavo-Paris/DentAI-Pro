'use client';

import { useMemo } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import {
  ANIMATION_STAGGER,
  PORTAL_MAX_DELAY_INDEX,
  type AnimationStagger,
} from './animation-tokens';

export interface UsePortalAnimationDelayOptions {
  /**
   * Index of the item (0-based)
   */
  index: number;
  /**
   * Stagger timing
   * @default 'normal'
   */
  stagger?: AnimationStagger;
  /**
   * Maximum index for delay (items beyond use max delay)
   * @default PORTAL_MAX_DELAY_INDEX (8)
   */
  maxIndex?: number;
}

export interface UsePortalAnimationDelayReturn {
  /**
   * CSS class for portal delay (e.g., 'portal-animate-in-delay-3')
   */
  delayClassName: string;
  /**
   * Delay value in milliseconds
   */
  delayMs: number;
  /**
   * CSS style object with animation-delay
   */
  delayStyle: { animationDelay: string };
  /**
   * Whether animations are disabled (reduced motion)
   */
  isDisabled: boolean;
}

/**
 * Hook for portal animation delays.
 *
 * Returns the appropriate CSS class and delay for staggered portal animations.
 * Caps delay at maxIndex to prevent excessive staggering.
 *
 * @example
 * ```tsx
 * function PortalItem({ index }: { index: number }) {
 *   const { delayClassName, isDisabled } = usePortalAnimationDelay({ index });
 *
 *   return (
 *     <div className={cn('portal-animate-in', !isDisabled && delayClassName)}>
 *       Item {index}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePortalAnimationDelay(
  options: UsePortalAnimationDelayOptions
): UsePortalAnimationDelayReturn {
  const {
    index,
    stagger = 'normal',
    maxIndex = PORTAL_MAX_DELAY_INDEX,
  } = options;

  const prefersReducedMotion = usePrefersReducedMotion();
  const staggerMs = ANIMATION_STAGGER[stagger];

  return useMemo(() => {
    if (prefersReducedMotion) {
      return {
        delayClassName: '',
        delayMs: 0,
        delayStyle: { animationDelay: '0ms' },
        isDisabled: true,
      };
    }

    // Cap at maxIndex to prevent excessive delays
    const clampedIndex = Math.min(index, maxIndex);
    const delayMs = clampedIndex * staggerMs;

    return {
      delayClassName: `portal-animate-in-delay-${clampedIndex}`,
      delayMs,
      delayStyle: { animationDelay: `${delayMs}ms` },
      isDisabled: false,
    };
  }, [prefersReducedMotion, index, maxIndex, staggerMs]);
}
