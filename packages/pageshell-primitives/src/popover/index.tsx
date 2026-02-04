/**
 * Popover Primitive
 *
 * Radix-based popover component.
 *
 * @module popover
 */

'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@pageshell/core';

// =============================================================================
// Types
// =============================================================================

export interface PopoverContentProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {}

// =============================================================================
// Components
// =============================================================================

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = PopoverPrimitive.Anchor;

/**
 * PopoverContent component
 *
 * Inline styles are used for:
 * - zIndex: 1020 ensures proper stacking above dialogs
 * - backgroundColor/color: direct CSS vars with hex fallbacks for oklch compatibility
 *
 * @example
 * ```tsx
 * <Popover>
 *   <PopoverTrigger asChild>
 *     <Button>Open Popover</Button>
 *   </PopoverTrigger>
 *   <PopoverContent>
 *     Content goes here
 *   </PopoverContent>
 * </Popover>
 * ```
 */
const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(({ className, align = 'center', sideOffset = 4, style, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      style={{
        zIndex: 1020, // Higher than dialog (1010) so popovers work inside modals
        backgroundColor: 'var(--color-popover, #14141c)',
        color: 'var(--color-popover-foreground, #e4e4eb)',
        ...style,
      }}
      className={cn(
        'themed-popover',
        'w-72 rounded-md border border-border bg-popover text-popover-foreground shadow-md outline-none p-4',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]',
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));

PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
