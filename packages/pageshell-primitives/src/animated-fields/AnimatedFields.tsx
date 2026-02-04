'use client';

/**
 * AnimatedFields - Staggered Animation Wrapper for Form Fields
 *
 * Wraps form fields and applies staggered entrance animations.
 * Respects prefers-reduced-motion for accessibility.
 *
 * @module animated-fields
 *
 * @example Basic usage
 * ```tsx
 * <AnimatedFields>
 *   <Input name="email" />
 *   <Input name="password" />
 *   <Button type="submit">Submit</Button>
 * </AnimatedFields>
 * ```
 *
 * @example With custom animation
 * ```tsx
 * <AnimatedFields animation="scale" staggerMs={100}>
 *   {fields}
 * </AnimatedFields>
 * ```
 *
 * @example Disabled animation
 * ```tsx
 * <AnimatedFields animation="none">
 *   {fields}
 * </AnimatedFields>
 * ```
 */

import { Children, type ReactNode } from 'react';
import { cn, usePrefersReducedMotion, ANIMATION_DURATION } from '@pageshell/core';

// =============================================================================
// Types
// =============================================================================

/**
 * Animation type variants
 */
export type AnimatedFieldsAnimation = 'fade-up' | 'fade-in' | 'scale' | 'none';

/**
 * AnimatedFields props
 */
export interface AnimatedFieldsProps {
  /** Children (form fields) */
  children: ReactNode;
  /** Delay between each field animation (ms) */
  staggerMs?: number;
  /** Animation type */
  animation?: AnimatedFieldsAnimation;
  /** Additional className for container */
  className?: string;
}

// =============================================================================
// Animation Configuration
// =============================================================================

const animationClasses: Record<AnimatedFieldsAnimation, string> = {
  'fade-up': 'animate-in fade-in-0 slide-in-from-bottom-2',
  'fade-in': 'animate-in fade-in-0',
  'scale': 'animate-in fade-in-0 zoom-in-95',
  'none': '',
} as const;

// =============================================================================
// Component
// =============================================================================

export function AnimatedFields({
  children,
  staggerMs = 50,
  animation = 'fade-up',
  className,
}: AnimatedFieldsProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldAnimate = animation !== 'none' && !prefersReducedMotion;

  const childArray = Children.toArray(children);

  return (
    <div className={cn('space-y-4', className)}>
      {childArray.map((child, index) => (
        <div
          key={index}
          className={cn(shouldAnimate && animationClasses[animation])}
          style={
            shouldAnimate
              ? {
                  animationDelay: `${index * staggerMs}ms`,
                  animationDuration: `${ANIMATION_DURATION.slower}ms`,
                  animationFillMode: 'backwards',
                }
              : undefined
          }
        >
          {child}
        </div>
      ))}
    </div>
  );
}

AnimatedFields.displayName = 'AnimatedFields';
