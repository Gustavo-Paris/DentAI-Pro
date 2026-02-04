'use client';

import { useMemo, useCallback, type CSSProperties } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import { ANIMATION_DURATION, ANIMATION_EASING } from './animation-tokens';

export type AnimationType = 'fade' | 'scale' | 'slide-up' | 'slide-down';

export interface UseAccessibleAnimationOptions {
  /**
   * Type of animation
   * @default 'fade'
   */
  type?: AnimationType;
  /**
   * Animation duration key
   * @default 'normal'
   */
  duration?: keyof typeof ANIMATION_DURATION;
  /**
   * Custom animation class prefix
   * @default 'portal-animate'
   */
  classPrefix?: string;
}

export interface AnimationProps {
  className: string;
  style: CSSProperties;
}

export interface UseAccessibleAnimationReturn {
  /**
   * Whether animations are disabled (reduced motion)
   */
  isDisabled: boolean;
  /**
   * Animation duration in milliseconds (0 if disabled)
   */
  durationMs: number;
  /**
   * Get animation props for enter/exit states
   */
  getAnimationProps: (isExiting?: boolean) => AnimationProps;
  /**
   * CSS transition string
   */
  transition: string;
  /**
   * Conditionally return value based on motion preference
   */
  withMotion: <T>(animatedValue: T, staticValue: T) => T;
}

/**
 * Hook for accessible animations.
 *
 * Combines motion preference detection with animation classes and styles.
 * Provides utilities for conditional animation application.
 *
 * @example
 * ```tsx
 * function AnimatedCard({ isOpen }: { isOpen: boolean }) {
 *   const { getAnimationProps, withMotion } = useAccessibleAnimation({
 *     type: 'fade',
 *     duration: 'normal',
 *   });
 *
 *   const props = getAnimationProps(!isOpen);
 *
 *   return (
 *     <div
 *       className={cn('card', props.className)}
 *       style={props.style}
 *       data-state={withMotion(isOpen ? 'open' : 'closed', 'static')}
 *     >
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
export function useAccessibleAnimation(
  options: UseAccessibleAnimationOptions = {}
): UseAccessibleAnimationReturn {
  const {
    type = 'fade',
    duration = 'normal',
    classPrefix = 'portal-animate',
  } = options;

  const prefersReducedMotion = usePrefersReducedMotion();
  const durationMs = prefersReducedMotion ? 0 : ANIMATION_DURATION[duration];
  const easing = ANIMATION_EASING.easeOut;

  const transition = useMemo(() => {
    if (prefersReducedMotion) {
      return 'none';
    }
    return `opacity ${durationMs}ms ${easing}, transform ${durationMs}ms ${easing}`;
  }, [prefersReducedMotion, durationMs, easing]);

  const getAnimationProps = useCallback(
    (isExiting = false): AnimationProps => {
      if (prefersReducedMotion) {
        return {
          className: '',
          style: {
            opacity: 1,
            transform: 'none',
          },
        };
      }

      const typeClasses: Record<AnimationType, string> = {
        fade: `${classPrefix}-fade`,
        scale: `${classPrefix}-scale`,
        'slide-up': `${classPrefix}-slide-up`,
        'slide-down': `${classPrefix}-slide-down`,
      };

      const baseStyles: Record<AnimationType, CSSProperties> = {
        fade: { opacity: isExiting ? 0 : 1 },
        scale: {
          opacity: isExiting ? 0 : 1,
          transform: isExiting ? 'scale(0.95)' : 'scale(1)',
        },
        'slide-up': {
          opacity: isExiting ? 0 : 1,
          transform: isExiting ? 'translateY(-10px)' : 'translateY(0)',
        },
        'slide-down': {
          opacity: isExiting ? 0 : 1,
          transform: isExiting ? 'translateY(10px)' : 'translateY(0)',
        },
      };

      return {
        className: `${typeClasses[type]} ${isExiting ? `${classPrefix}-exit` : `${classPrefix}-enter`}`,
        style: {
          ...baseStyles[type],
          transition,
        },
      };
    },
    [prefersReducedMotion, type, classPrefix, transition]
  );

  const withMotion = useCallback(
    <T,>(animatedValue: T, staticValue: T): T => {
      return prefersReducedMotion ? staticValue : animatedValue;
    },
    [prefersReducedMotion]
  );

  return {
    isDisabled: prefersReducedMotion,
    durationMs,
    getAnimationProps,
    transition,
    withMotion,
  };
}
