/**
 * Skeleton Primitive
 *
 * Loading placeholder that adapts to content dimensions.
 * Supports differentiated loading animations for better UX.
 *
 * @module skeleton
 */

import * as React from 'react';
import { cn } from '@pageshell/core';

// =============================================================================
// Types
// =============================================================================

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width of the skeleton */
  width?: string | number;
  /** Height of the skeleton */
  height?: string | number;
  /** Make skeleton circular */
  circle?: boolean;
  /**
   * Loading animation style:
   * - 'shimmer': For rich content (tables, cards, grids) - gradient sweep effect suggesting data is being fetched
   * - 'pulse': For simple elements (text, buttons, inputs) - simpler opacity-based loading state
   * - 'none': Disable animation (useful for static placeholders or when prefers-reduced-motion is respected via CSS)
   *
   * Note: Animations automatically respect `prefers-reduced-motion` via `motion-reduce:` Tailwind modifier.
   */
  animation?: 'pulse' | 'shimmer' | 'none';
  /** Test ID for automated testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Skeleton component for loading states
 *
 * Uses differentiated animations:
 * - **shimmer**: Gradient sweep for rich content (tables, cards, stats) - suggests data fetching
 * - **pulse**: Simple opacity for text/buttons - lightweight loading indicator
 *
 * Accessibility: Respects `prefers-reduced-motion` automatically.
 *
 * @example
 * ```tsx
 * // Text line skeleton (pulse is default, good for simple elements)
 * <Skeleton className="h-4 w-[200px]" />
 *
 * // Table row skeleton (shimmer for rich content)
 * <Skeleton animation="shimmer" className="h-12 w-full" />
 *
 * // Avatar skeleton
 * <Skeleton circle width={40} height={40} />
 *
 * // Card skeleton (shimmer for content-heavy areas)
 * <Skeleton animation="shimmer" className="h-[200px] w-full rounded-lg" />
 * ```
 */
const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className,
      width,
      height,
      circle = false,
      animation = 'pulse',
      style,
      testId,
      ...props
    },
    ref
  ) => {
    // For shimmer, we use inline styles for the gradient effect
    // For pulse, we use Tailwind's animate-pulse class
    const isShimmer = animation === 'shimmer';

    const shimmerStyles: React.CSSProperties = isShimmer
      ? {
          background: `linear-gradient(
            90deg,
            var(--color-muted, hsl(240 3.7% 15.9%)) 0%,
            var(--color-muted-foreground, hsl(240 5% 64.9%)) 50%,
            var(--color-muted, hsl(240 3.7% 15.9%)) 100%
          )`,
          backgroundSize: '200% 100%',
          animation: 'skeleton-shimmer 1.5s infinite linear',
        }
      : {};

    return (
      <div
        ref={ref}
        className={cn(
          // Base background (only for non-shimmer, shimmer uses inline gradient)
          !isShimmer && 'bg-muted',
          // Pulse animation with reduced-motion support
          animation === 'pulse' && 'animate-pulse motion-reduce:animate-none',
          // Shimmer gets reduced-motion support via inline style override
          isShimmer && 'motion-reduce:[animation:none]',
          circle ? 'rounded-full' : 'rounded-md',
          className
        )}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          ...shimmerStyles,
          ...style,
        }}
        role="status"
        aria-busy="true"
        aria-label="Loading"
        data-testid={testId}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// =============================================================================
// Preset Components
// =============================================================================

/**
 * Skeleton for text content
 */
const SkeletonText = React.forwardRef<HTMLDivElement, Omit<SkeletonProps, 'height'>>(
  ({ className, ...props }, ref) => (
    <Skeleton ref={ref} className={cn('h-4', className)} {...props} />
  )
);

SkeletonText.displayName = 'SkeletonText';

/**
 * Skeleton for headings
 */
const SkeletonHeading = React.forwardRef<HTMLDivElement, Omit<SkeletonProps, 'height'>>(
  ({ className, ...props }, ref) => (
    <Skeleton ref={ref} className={cn('h-6', className)} {...props} />
  )
);

SkeletonHeading.displayName = 'SkeletonHeading';

/**
 * Skeleton for avatars
 */
const SkeletonAvatar = React.forwardRef<
  HTMLDivElement,
  Omit<SkeletonProps, 'circle' | 'width' | 'height'> & { size?: number }
>(({ size = 40, ...props }, ref) => (
  <Skeleton ref={ref} circle width={size} height={size} {...props} />
));

SkeletonAvatar.displayName = 'SkeletonAvatar';

export { Skeleton, SkeletonText, SkeletonHeading, SkeletonAvatar };
