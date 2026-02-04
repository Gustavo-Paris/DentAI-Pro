/**
 * Slider Primitive
 *
 * Radix-based slider component.
 *
 * @module slider
 */

'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@pageshell/core';

// =============================================================================
// Types
// =============================================================================

export interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {}

// =============================================================================
// Component
// =============================================================================

/**
 * Slider component
 *
 * @example
 * ```tsx
 * <Slider defaultValue={[50]} max={100} step={1} />
 * ```
 */
const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex w-full touch-none select-none items-center',
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="relative block h-4 w-4 rounded-full border border-border bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 touch-manipulation before:absolute before:inset-[-14px] before:content-['']" />
  </SliderPrimitive.Root>
));

Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
