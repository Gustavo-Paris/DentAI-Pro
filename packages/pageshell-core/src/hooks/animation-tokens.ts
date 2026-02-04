/**
 * Animation Tokens for PageShell Components
 *
 * Centralized animation constants for consistent timing across all components.
 * These tokens ensure predictable, accessible animations throughout the UI.
 *
 * @example
 * ```tsx
 * import { ANIMATION_DURATION, ANIMATION_EASING } from '@pageshell/core';
 *
 * const style = {
 *   transition: `opacity ${ANIMATION_DURATION.normal}ms ${ANIMATION_EASING.easeOut}`,
 * };
 * ```
 */

/**
 * Animation durations in milliseconds.
 *
 * | Token   | Value | Use Case |
 * |---------|-------|----------|
 * | instant | 0ms   | Disabled animations, reduced motion |
 * | fast    | 150ms | Micro-interactions, hover states |
 * | normal  | 200ms | Standard transitions, most UI feedback |
 * | slow    | 300ms | Modal/drawer transitions, emphasis |
 * | slower  | 400ms | Complex animations, page transitions |
 */
export const ANIMATION_DURATION = {
  /** No animation - for reduced motion or instant feedback */
  instant: 0,
  /** Quick micro-interactions (hover, focus) */
  fast: 150,
  /** Standard UI transitions */
  normal: 200,
  /** Emphasis transitions (modals, drawers) */
  slow: 300,
  /** Complex/page-level animations */
  slower: 400,
} as const;

/**
 * Animation easing functions.
 *
 * | Token     | Value | Use Case |
 * |-----------|-------|----------|
 * | easeOut   | ease-out | Most transitions (feels responsive) |
 * | easeInOut | ease-in-out | Symmetric animations |
 * | spring    | cubic-bezier | Playful/bouncy interactions |
 */
export const ANIMATION_EASING = {
  /** Standard deceleration - use for most transitions */
  easeOut: 'ease-out',
  /** Symmetric acceleration/deceleration */
  easeInOut: 'ease-in-out',
  /** Bouncy spring effect for playful interactions */
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

/**
 * Stagger delays for list/grid animations in milliseconds.
 *
 * | Token  | Value | Use Case |
 * |--------|-------|----------|
 * | fast   | 30ms  | Dense lists, cards |
 * | normal | 50ms  | Standard lists |
 * | slow   | 80ms  | Emphasized sequential reveal |
 */
export const ANIMATION_STAGGER = {
  /** Quick stagger for dense content */
  fast: 30,
  /** Standard stagger delay */
  normal: 50,
  /** Slower stagger for emphasis */
  slow: 80,
} as const;

/**
 * Maximum index for portal animation delays.
 * Items beyond this index use the max delay to prevent excessive staggering.
 */
export const PORTAL_MAX_DELAY_INDEX = 8;

// Type exports for TypeScript consumers
export type AnimationDuration = keyof typeof ANIMATION_DURATION;
export type AnimationEasing = keyof typeof ANIMATION_EASING;
export type AnimationStagger = keyof typeof ANIMATION_STAGGER;
