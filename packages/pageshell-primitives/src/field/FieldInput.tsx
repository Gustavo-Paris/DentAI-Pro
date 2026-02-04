/**
 * FieldInput Component
 *
 * Theme-aware input that works across all design system themes.
 * Uses CSS custom properties from the token system.
 *
 * @module field/FieldInput
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { fieldInputVariants } from './variants';
import type { FieldInputProps } from './types';

/**
 * FieldInput component
 *
 * A theme-aware input that adapts to the current design system theme.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Field.Input placeholder="Enter your name" />
 *
 * // With size
 * <Field.Input size="sm" placeholder="Small input" />
 *
 * // Error state
 * <Field.Input error placeholder="This field has an error" />
 *
 * // With icons
 * <Field.Input leftIcon={<SearchIcon />} placeholder="Search..." />
 * ```
 */
const FieldInput = React.forwardRef<HTMLInputElement, FieldInputProps>(
  (
    { className, size, variant, error, leftIcon, rightIcon, type = 'text', ...props },
    ref
  ) => {
    if (leftIcon || rightIcon) {
      return (
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            type={type}
            className={cn(
              fieldInputVariants({
                size,
                variant: error ? 'error' : variant,
                className,
              }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10'
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none">
              {rightIcon}
            </span>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(
          fieldInputVariants({
            size,
            variant: error ? 'error' : variant,
            className,
          })
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

FieldInput.displayName = 'Field.Input';

export { FieldInput };
