/**
 * Input Primitive
 *
 * Theme-aware input component.
 *
 * @module input
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';

// =============================================================================
// Types
// =============================================================================

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Icon to show at the start of the input */
  startIcon?: React.ReactNode;
  /** @deprecated Use startIcon instead */
  leftIcon?: React.ReactNode;
  /** Icon to show at the end of the input */
  endIcon?: React.ReactNode;
  /** @deprecated Use endIcon instead */
  rightIcon?: React.ReactNode;
  /** Whether the input has an error state */
  error?: boolean;
  /** Test ID for automated testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Input component
 *
 * @example
 * ```tsx
 * <Input placeholder="Search..." />
 *
 * <Input
 *   startIcon={<SearchIcon className="h-4 w-4" />}
 *   placeholder="Search..."
 * />
 * ```
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', startIcon, leftIcon, endIcon, rightIcon, error, testId, ...props }, ref) => {
    // Support deprecated aliases
    const resolvedStartIcon = startIcon ?? leftIcon;
    const resolvedEndIcon = endIcon ?? rightIcon;
    const hasIcon = resolvedStartIcon || resolvedEndIcon;

    const baseClasses = cn(
      // Use text-base (16px) to prevent iOS Safari zoom on focus
      'flex h-10 w-full rounded-lg border bg-muted px-3 py-2 text-base',
      'file:border-0 file:bg-transparent file:text-base file:font-medium',
      'text-foreground placeholder:text-muted-foreground',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'transition-colors',
      error
        ? 'border-destructive/60 focus-visible:ring-2 focus-visible:ring-destructive/30 focus-visible:border-destructive'
        : 'border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary'
    );

    if (hasIcon) {
      return (
        <div className="relative">
          {resolvedStartIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {resolvedStartIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              baseClasses,
              resolvedStartIcon && 'pl-10',
              resolvedEndIcon && 'pr-10',
              className
            )}
            ref={ref}
            data-testid={testId}
            {...props}
          />
          {resolvedEndIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {resolvedEndIcon}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(baseClasses, className)}
        ref={ref}
        data-testid={testId}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
