/**
 * Card Primitive
 *
 * Container component with variants for different use cases.
 *
 * @module card
 */

'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@pageshell/core';

// =============================================================================
// Variants
// =============================================================================

/**
 * Card Variants
 *
 * - default: Standard card with subtle hover
 * - interactive: Clickable card with lift effect
 * - glow: Featured card with accent glow on hover
 * - stat: Compact card for metrics/KPIs
 * - outline: Dashed border for secondary containers
 */
export const cardVariants = cva(
  'rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'hover:shadow-md',
        interactive:
          'cursor-pointer hover:shadow-lg hover:border-border/80 hover:-translate-y-1 active:translate-y-0',
        glow: 'relative hover:shadow-lg hover:border-primary/30 hover:-translate-y-1',
        stat: 'hover:shadow-md',
        outline:
          'border-dashed bg-transparent shadow-none hover:bg-muted/50 hover:border-border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type CardVariant = VariantProps<typeof cardVariants>['variant'];

// =============================================================================
// Card
// =============================================================================

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

// =============================================================================
// CardHeader
// =============================================================================

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

// =============================================================================
// CardTitle
// =============================================================================

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

// =============================================================================
// CardDescription
// =============================================================================

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

// =============================================================================
// CardContent
// =============================================================================

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

// =============================================================================
// CardFooter
// =============================================================================

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
