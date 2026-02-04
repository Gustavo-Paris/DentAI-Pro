'use client';

import { useMemo } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import {
  ANIMATION_DURATION,
  ANIMATION_STAGGER,
  type AnimationStagger,
} from './animation-tokens';

export interface UseStaggeredAnimationOptions {
  /**
   * Base delay before any items animate (in ms)
   * @default 0
   */
  baseDelay?: number;
  /**
   * Stagger timing between items
   * @default 'normal'
   */
  stagger?: AnimationStagger;
  /**
   * Animation duration key
   * @default 'normal'
   */
  duration?: keyof typeof ANIMATION_DURATION;
  /**
   * Maximum number of items to stagger (items beyond this use max delay)
   * @default 10
   */
  maxItems?: number;
}

export interface StaggeredAnimationStyle {
  animationDelay: string;
  animationDuration: string;
  opacity: number;
}

export interface UseStaggeredAnimationReturn {
  /**
   * Get animation styles for an item at a specific index
   */
  getItemStyle: (index: number) => StaggeredAnimationStyle;
  /**
   * Get CSS class for staggered animation
   */
  getItemClassName: (index: number) => string;
  /**
   * Whether animations are disabled (reduced motion)
   */
  isDisabled: boolean;
}

/**
 * Hook for staggered list/grid animations.
 *
 * Provides animation styles and classes for sequential item animations.
 * Automatically respects `prefers-reduced-motion` for accessibility.
 *
 * @example
 * ```tsx
 * const { getItemStyle, isDisabled } = useStaggeredAnimation({ stagger: 'fast' });
 *
 * return (
 *   <ul>
 *     {items.map((item, i) => (
 *       <li
 *         key={item.id}
 *         style={isDisabled ? undefined : getItemStyle(i)}
 *         className="animate-fade-in"
 *       >
 *         {item.name}
 *       </li>
 *     ))}
 *   </ul>
 * );
 * ```
 */
export function useStaggeredAnimation(
  options: UseStaggeredAnimationOptions = {}
): UseStaggeredAnimationReturn {
  const {
    baseDelay = 0,
    stagger = 'normal',
    duration = 'normal',
    maxItems = 10,
  } = options;

  const prefersReducedMotion = usePrefersReducedMotion();

  const staggerMs = ANIMATION_STAGGER[stagger];
  const durationMs = ANIMATION_DURATION[duration];

  const getItemStyle = useMemo(() => {
    return (index: number): StaggeredAnimationStyle => {
      if (prefersReducedMotion) {
        return {
          animationDelay: '0ms',
          animationDuration: '0ms',
          opacity: 1,
        };
      }

      const clampedIndex = Math.min(index, maxItems);
      const delay = baseDelay + clampedIndex * staggerMs;

      return {
        animationDelay: `${delay}ms`,
        animationDuration: `${durationMs}ms`,
        opacity: 0, // Initial opacity, animation will reveal
      };
    };
  }, [prefersReducedMotion, baseDelay, staggerMs, durationMs, maxItems]);

  const getItemClassName = useMemo(() => {
    return (index: number): string => {
      if (prefersReducedMotion) {
        return '';
      }

      const clampedIndex = Math.min(index, maxItems);
      // Use CSS custom property for delay
      return `portal-animate-in portal-stagger-${clampedIndex}`;
    };
  }, [prefersReducedMotion, maxItems]);

  return {
    getItemStyle,
    getItemClassName,
    isDisabled: prefersReducedMotion,
  };
}
