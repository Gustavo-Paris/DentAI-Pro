/**
 * Tabs Primitive
 *
 * Accessible tabs built on Radix Tabs.
 *
 * @module tabs
 */

'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@pageshell/core';

// =============================================================================
// Tabs Root
// =============================================================================

const Tabs = TabsPrimitive.Root;

// =============================================================================
// Tabs List
// =============================================================================

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // PWA: min-h ensures adequate space for 44px touch targets
      'inline-flex min-h-[48px] items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
      className
    )}
    {...props}
  />
));

TabsList.displayName = 'TabsList';

// =============================================================================
// Tabs Trigger
// =============================================================================

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // PWA: min-h-[44px] for touch targets, touch-manipulation for responsiveness
      'inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ring-offset-background transition-all',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow',
      'touch-manipulation',
      className
    )}
    {...props}
  />
));

TabsTrigger.displayName = 'TabsTrigger';

// =============================================================================
// Tabs Content
// =============================================================================

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));

TabsContent.displayName = 'TabsContent';

// =============================================================================
// Exports
// =============================================================================

export { Tabs, TabsList, TabsTrigger, TabsContent };
