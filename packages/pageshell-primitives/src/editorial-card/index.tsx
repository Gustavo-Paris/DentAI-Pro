/**
 * EditorialCard - Premium card with layered shadow effect
 *
 * Used for CourseCard, MentorCard, PostCard, and other premium editorial layouts.
 * Provides a distinctive offset shadow that animates on hover.
 *
 * @package @pageshell/primitives
 */

'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@pageshell/core';

// =============================================================================
// Variants
// =============================================================================

/**
 * Editorial Card Variants
 *
 * Premium layered shadow effect for editorial cards.
 *
 * - default: Subtle shadow with hover lift
 * - interactive: Enhanced hover with border accent
 * - static: No hover animation (for skeletons/loading states)
 */
export const editorialCardVariants = cva(
  'relative flex flex-col bg-card transition-all duration-500 ease-out',
  {
    variants: {
      variant: {
        default: 'hover:-translate-y-1 sm:hover:-translate-y-2',
        interactive: 'hover:-translate-y-1 sm:hover:-translate-y-2 group',
        static: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export const editorialShadowVariants = cva(
  'absolute inset-0 bg-foreground/[0.06] transition-all duration-500',
  {
    variants: {
      variant: {
        default:
          'translate-x-1.5 translate-y-1.5 sm:translate-x-2 sm:translate-y-2',
        interactive:
          'translate-x-1.5 translate-y-1.5 sm:translate-x-2 sm:translate-y-2 group-hover:translate-x-2 group-hover:translate-y-2 sm:group-hover:translate-x-3 sm:group-hover:translate-y-3',
        static:
          'translate-x-1.5 translate-y-1.5 sm:translate-x-2 sm:translate-y-2',
      },
      intensity: {
        subtle: 'bg-foreground/[0.04]',
        medium: 'bg-foreground/[0.06]',
        strong: 'bg-foreground/[0.08]',
      },
    },
    defaultVariants: {
      variant: 'default',
      intensity: 'medium',
    },
  }
);

export const editorialInnerVariants = cva(
  'relative flex flex-col border border-border bg-card transition-colors duration-300',
  {
    variants: {
      variant: {
        default: '',
        interactive: 'group-hover:border-accent/40',
        static: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// =============================================================================
// Types
// =============================================================================

export type EditorialCardVariant = 'default' | 'interactive' | 'static';
export type ShadowIntensity = 'subtle' | 'medium' | 'strong';

export interface EditorialCardProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof editorialCardVariants> {
  /** Shadow intensity: subtle (0.04), medium (0.06), strong (0.08) */
  shadowIntensity?: ShadowIntensity;
  /** Render as article element (default) or div */
  as?: 'article' | 'div';
  /** Additional class for the inner card container */
  innerClassName?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * EditorialCard - Premium card with layered shadow effect
 *
 * @example
 * <EditorialCard variant="interactive" shadowIntensity="medium">
 *   <div className="p-4">Content</div>
 * </EditorialCard>
 */
function EditorialCard({
  className,
  variant = 'default',
  shadowIntensity = 'medium',
  as = 'article',
  innerClassName,
  children,
  ...props
}: EditorialCardProps) {
  const Component = as;
  return (
    <Component
      className={cn(editorialCardVariants({ variant }), className)}
      {...props}
    >
      {/* Layered shadow */}
      <div
        className={cn(
          editorialShadowVariants({ variant, intensity: shadowIntensity })
        )}
        aria-hidden="true"
      />
      {/* Main card */}
      <div
        className={cn(editorialInnerVariants({ variant }), 'h-full', innerClassName)}
      >
        {children}
      </div>
    </Component>
  );
}
EditorialCard.displayName = 'EditorialCard';

export { EditorialCard };
