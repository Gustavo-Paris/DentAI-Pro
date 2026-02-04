/**
 * Sheet Primitive
 *
 * Radix Dialog-based sheet/drawer with portal support.
 *
 * @package @pageshell/primitives
 */

'use client';

import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { Cross2Icon } from '@radix-ui/react-icons';
import { cn } from '@pageshell/core';

// =============================================================================
// Portal Styles (for theme context)
// =============================================================================

const portalStyles = {
  backgroundColor: 'var(--color-popover, hsl(var(--popover)))',
  color: 'var(--color-popover-foreground, hsl(var(--popover-foreground)))',
};

// =============================================================================
// Root & Primitives
// =============================================================================

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

// =============================================================================
// SheetOverlay
// =============================================================================

export interface SheetOverlayProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay> {}

const SheetOverlay = React.forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Overlay>,
  SheetOverlayProps
>(({ className, style, ...props }, ref) => (
  <SheetPrimitive.Overlay
    style={{ zIndex: 1000, ...style }}
    className={cn(
      'fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

// =============================================================================
// SheetContent Variants
// =============================================================================

export const sheetVariants = cva(
  'fixed z-[1010] gap-4 p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b border-border data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom:
          'inset-x-0 bottom-0 border-t border-border data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r border-border data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
        right:
          'inset-y-0 right-0 h-full w-3/4 border-l border-border data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  }
);

export type SheetSide = NonNullable<VariantProps<typeof sheetVariants>['side']>;

// =============================================================================
// SheetContent
// =============================================================================

export interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  /** Hide close button */
  hideCloseButton?: boolean;
}

const SheetContent = React.forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = 'right', className, children, style, hideCloseButton, ...props }, ref) => {
  // PWA safe-area: compute padding based on sheet side for standalone mode
  const safeAreaStyles: React.CSSProperties = {
    paddingTop: side === 'top' || side === 'left' || side === 'right' ? 'env(safe-area-inset-top, 0px)' : undefined,
    paddingBottom: side === 'bottom' || side === 'left' || side === 'right' ? 'env(safe-area-inset-bottom, 0px)' : undefined,
    paddingLeft: side === 'left' ? 'env(safe-area-inset-left, 0px)' : undefined,
    paddingRight: side === 'right' ? 'env(safe-area-inset-right, 0px)' : undefined,
  };

  return (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      style={{ ...portalStyles, ...safeAreaStyles, ...style }}
      className={cn('themed-sheet', sheetVariants({ side }), className)}
      {...props}
    >
      {!hideCloseButton && (
        <SheetPrimitive.Close
          className={cn(
            'absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-md',
            'opacity-70 ring-offset-background transition-all',
            'hover:opacity-100 hover:bg-muted',
            'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
            'disabled:pointer-events-none touch-manipulation'
          )}
        >
          <Cross2Icon className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      )}
      {children}
    </SheetPrimitive.Content>
  </SheetPortal>
  );
});
SheetContent.displayName = SheetPrimitive.Content.displayName;

// =============================================================================
// SheetHeader
// =============================================================================

export interface SheetHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const SheetHeader = ({ className, ...props }: SheetHeaderProps) => (
  <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
);
SheetHeader.displayName = 'SheetHeader';

// =============================================================================
// SheetFooter
// =============================================================================

export interface SheetFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const SheetFooter = ({ className, ...props }: SheetFooterProps) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
);
SheetFooter.displayName = 'SheetFooter';

// =============================================================================
// SheetTitle
// =============================================================================

export interface SheetTitleProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title> {}

const SheetTitle = React.forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Title>,
  SheetTitleProps
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold text-foreground', className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

// =============================================================================
// SheetDescription
// =============================================================================

export interface SheetDescriptionProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description> {}

const SheetDescription = React.forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Description>,
  SheetDescriptionProps
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

// =============================================================================
// Exports
// =============================================================================

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
