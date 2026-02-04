/**
 * Switch Primitive
 *
 * Toggle switch component built on Radix UI.
 *
 * @module switch
 */

'use client';

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '@pageshell/core';

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {}

const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      // PWA: before pseudo-element expands hit area to 44px minimum
      'peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation',
      "before:absolute before:inset-[-9px] before:content-['']",
      'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input border-2 data-[state=unchecked]:border-border data-[state=checked]:border-primary',
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-md transition-transform duration-200 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5'
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
