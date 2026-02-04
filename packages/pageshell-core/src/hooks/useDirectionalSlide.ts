'use client';

import { useMemo } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import { ANIMATION_DURATION, ANIMATION_EASING } from './animation-tokens';

export type SlideDirection = 'forward' | 'backward' | 'up' | 'down';

export interface UseDirectionalSlideOptions {
  /**
   * Direction of the slide animation
   */
  direction: SlideDirection;
  /**
   * Animation duration key
   * @default 'slow'
   */
  duration?: keyof typeof ANIMATION_DURATION;
  /**
   * Distance to slide (in pixels or CSS unit)
   * @default '100%'
   */
  distance?: string | number;
  /**
   * Whether the element is exiting (reverses animation)
   * @default false
   */
  isExiting?: boolean;
}

export interface DirectionalSlideStyles {
  transform: string;
  opacity: number;
  transition: string;
}

export interface UseDirectionalSlideReturn {
  /**
   * Initial styles (before animation)
   */
  initialStyles: DirectionalSlideStyles;
  /**
   * Final styles (after animation)
   */
  animatedStyles: DirectionalSlideStyles;
  /**
   * Whether animations are disabled (reduced motion)
   */
  isDisabled: boolean;
  /**
   * Get transform value for a given progress (0-1)
   */
  getTransformAtProgress: (progress: number) => string;
}

/**
 * Hook for directional slide animations (wizard steps, page transitions).
 *
 * Provides styles for enter/exit animations in any direction.
 * Automatically respects `prefers-reduced-motion` for accessibility.
 *
 * @example
 * ```tsx
 * const { initialStyles, animatedStyles, isDisabled } = useDirectionalSlide({
 *   direction: 'forward',
 *   isExiting: false,
 * });
 *
 * return (
 *   <motion.div
 *     initial={isDisabled ? animatedStyles : initialStyles}
 *     animate={animatedStyles}
 *   >
 *     Step content
 *   </motion.div>
 * );
 * ```
 */
export function useDirectionalSlide(
  options: UseDirectionalSlideOptions
): UseDirectionalSlideReturn {
  const {
    direction,
    duration = 'slow',
    distance = '100%',
    isExiting = false,
  } = options;

  const prefersReducedMotion = usePrefersReducedMotion();
  const durationMs = ANIMATION_DURATION[duration];
  const easing = ANIMATION_EASING.easeOut;

  const distanceValue =
    typeof distance === 'number' ? `${distance}px` : distance;

  const getTranslate = useMemo(() => {
    const directions: Record<SlideDirection, (d: string) => string> = {
      forward: (d) => `translateX(${d})`,
      backward: (d) => `translateX(-${d})`,
      up: (d) => `translateY(-${d})`,
      down: (d) => `translateY(${d})`,
    };
    return directions[direction];
  }, [direction]);

  const { initialStyles, animatedStyles } = useMemo(() => {
    const transition = prefersReducedMotion
      ? 'none'
      : `transform ${durationMs}ms ${easing}, opacity ${durationMs}ms ${easing}`;

    if (prefersReducedMotion) {
      // No animation - immediately visible
      const noAnimStyles: DirectionalSlideStyles = {
        transform: 'translate(0)',
        opacity: 1,
        transition: 'none',
      };
      return { initialStyles: noAnimStyles, animatedStyles: noAnimStyles };
    }

    if (isExiting) {
      // Exit: start visible, end off-screen
      return {
        initialStyles: {
          transform: 'translate(0)',
          opacity: 1,
          transition,
        },
        animatedStyles: {
          transform: getTranslate(distanceValue),
          opacity: 0,
          transition,
        },
      };
    }

    // Enter: start off-screen, end visible
    // Reverse direction for enter (content comes from opposite side)
    const reverseDirection: Record<SlideDirection, SlideDirection> = {
      forward: 'backward',
      backward: 'forward',
      up: 'down',
      down: 'up',
    };
    const enterDirection = reverseDirection[direction];
    const directions: Record<SlideDirection, (d: string) => string> = {
      forward: (d) => `translateX(${d})`,
      backward: (d) => `translateX(-${d})`,
      up: (d) => `translateY(-${d})`,
      down: (d) => `translateY(${d})`,
    };

    return {
      initialStyles: {
        transform: directions[enterDirection](distanceValue),
        opacity: 0,
        transition,
      },
      animatedStyles: {
        transform: 'translate(0)',
        opacity: 1,
        transition,
      },
    };
  }, [
    prefersReducedMotion,
    durationMs,
    easing,
    isExiting,
    direction,
    distanceValue,
    getTranslate,
  ]);

  const getTransformAtProgress = useMemo(() => {
    return (progress: number): string => {
      if (prefersReducedMotion) {
        return 'translate(0)';
      }
      const clampedProgress = Math.max(0, Math.min(1, progress));
      // Linear interpolation of distance
      const currentDistance = `calc(${distanceValue} * ${1 - clampedProgress})`;
      return getTranslate(currentDistance);
    };
  }, [prefersReducedMotion, distanceValue, getTranslate]);

  return {
    initialStyles,
    animatedStyles,
    isDisabled: prefersReducedMotion,
    getTransformAtProgress,
  };
}
