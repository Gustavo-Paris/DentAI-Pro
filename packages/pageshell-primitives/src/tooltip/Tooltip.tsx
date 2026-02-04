/**
 * Tooltip Primitive
 *
 * Accessible tooltip built on Radix Tooltip.
 *
 * @module tooltip
 */

'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@pageshell/core';

// =============================================================================
// Provider (global)
// =============================================================================

const TooltipProvider = TooltipPrimitive.Provider;

// =============================================================================
// Tooltip Root
// =============================================================================

const Tooltip = TooltipPrimitive.Root;

// =============================================================================
// Tooltip Trigger
// =============================================================================

const TooltipTrigger = TooltipPrimitive.Trigger;

// =============================================================================
// Tooltip Content
// =============================================================================

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'themed-tooltip',
        // z-[1020] to ensure tooltips appear above modals (z-[1010])
        'z-[1020] overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground',
        'animate-in fade-in-0 zoom-in-95',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));

TooltipContent.displayName = 'TooltipContent';

// =============================================================================
// Tooltip Arrow
// =============================================================================

const TooltipArrow = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Arrow>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Arrow>
>(({ className, ...props }, ref) => (
  <TooltipPrimitive.Arrow
    ref={ref}
    className={cn('fill-primary', className)}
    {...props}
  />
));

TooltipArrow.displayName = 'TooltipArrow';

// =============================================================================
// Exports
// =============================================================================

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, TooltipArrow };
