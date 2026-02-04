/**
 * FieldTextarea Component
 *
 * Theme-aware textarea that works across all design system themes.
 * Uses CSS custom properties from the token system.
 *
 * @module field/FieldTextarea
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { fieldTextareaVariants } from './variants';
import type { FieldTextareaProps } from './types';

/**
 * FieldTextarea component
 *
 * A theme-aware textarea that adapts to the current design system theme.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Field.Textarea placeholder="Enter description" />
 *
 * // With size
 * <Field.Textarea size="lg" rows={6} />
 *
 * // Error state
 * <Field.Textarea error placeholder="This field has an error" />
 * ```
 */
const FieldTextarea = React.forwardRef<HTMLTextAreaElement, FieldTextareaProps>(
  ({ className, size, variant, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          fieldTextareaVariants({
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

FieldTextarea.displayName = 'Field.Textarea';

export { FieldTextarea };
