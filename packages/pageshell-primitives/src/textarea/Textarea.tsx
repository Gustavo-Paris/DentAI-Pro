/**
 * Textarea Primitive
 *
 * Multi-line text input component.
 *
 * @module textarea
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          // Base: 16px font prevents iOS zoom, proper padding for touch
          'flex min-h-[80px] w-full rounded-lg border border-border bg-muted px-3 py-3 text-base',
          'text-foreground placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // PWA: touch optimization
          'touch-manipulation',
          'transition-colors',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
