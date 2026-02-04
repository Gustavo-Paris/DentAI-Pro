/**
 * Alert Primitive
 *
 * Alert component with variants for different states.
 *
 * @module alert
 */

'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@pageshell/core';

// =============================================================================
// Variants
// =============================================================================

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default:
          'bg-background text-foreground border-border [&>svg]:text-foreground',
        destructive:
          'border-destructive/50 bg-destructive/10 text-destructive dark:border-destructive [&>svg]:text-destructive',
        success:
          'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 dark:border-emerald-500/50 [&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-400',
        warning:
          'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 dark:border-amber-500/50 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400',
        info: 'border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400 dark:border-blue-500/50 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400',
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

export type AlertVariant = VariantProps<typeof alertVariants>['variant'];

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

export interface AlertTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {}

export interface AlertDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

// =============================================================================
// Components
// =============================================================================

/**
 * Alert component
 *
 * @example
 * ```tsx
 * <Alert variant="success">
 *   <CheckCircle className="h-4 w-4" />
 *   <AlertTitle>Success!</AlertTitle>
 *   <AlertDescription>Your changes have been saved.</AlertDescription>
 * </Alert>
 * ```
 */
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
);

Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLParagraphElement, AlertTitleProps>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    />
  )
);

AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  AlertDescriptionProps
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));

AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription, alertVariants };
