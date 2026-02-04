/**
 * FieldCheckbox Component
 *
 * Checkbox with optional integrated label.
 *
 * @module field/FieldCheckbox
 */

'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '@pageshell/core';
import { fieldCheckboxVariants } from './variants';
import type { VariantProps } from 'class-variance-authority';

export interface FieldCheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof fieldCheckboxVariants> {
  /** Label text to display next to checkbox */
  label?: string;
  /** Description text below the label */
  description?: string;
  /** Error state styling */
  error?: boolean;
  /** Position of the checkbox relative to label */
  labelPosition?: 'left' | 'right';
}

/**
 * FieldCheckbox - Checkbox with optional integrated label
 *
 * @example
 * // Simple checkbox
 * <Field.Checkbox
 *   checked={checked}
 *   onCheckedChange={setChecked}
 * />
 *
 * @example
 * // With label
 * <Field.Checkbox
 *   label="Accept terms and conditions"
 *   checked={accepted}
 *   onCheckedChange={setAccepted}
 * />
 *
 * @example
 * // With label and description
 * <Field.Checkbox
 *   label="Marketing emails"
 *   description="Receive updates about new features and promotions"
 *   checked={marketing}
 *   onCheckedChange={setMarketing}
 * />
 */
const FieldCheckbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  FieldCheckboxProps
>(
  (
    {
      className,
      label,
      description,
      size,
      error,
      labelPosition = 'right',
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const checkboxId = id || generatedId;

    const iconSize = {
      sm: 'h-2.5 w-2.5',
      md: 'h-3 w-3',
      lg: 'h-3.5 w-3.5',
    }[size || 'md'];

    const checkbox = (
      <CheckboxPrimitive.Root
        ref={ref}
        id={checkboxId}
        className={cn(
          fieldCheckboxVariants({ size }),
          error && 'border-[var(--input-error-border)]',
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          className={cn('flex items-center justify-center text-current')}
        >
          <Check className={iconSize} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );

    // If no label, return just the checkbox
    if (!label) {
      return checkbox;
    }

    // With label wrapper
    return (
      <div className="flex items-start gap-2">
        {labelPosition === 'left' && (
          <div className="flex flex-col">
            <label
              htmlFor={checkboxId}
              className={cn(
                'text-sm font-medium leading-none cursor-pointer',
                'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                error && 'text-destructive'
              )}
            >
              {label}
            </label>
            {description && (
              <span className="text-xs text-muted-foreground mt-1">
                {description}
              </span>
            )}
          </div>
        )}

        {checkbox}

        {labelPosition === 'right' && (
          <div className="flex flex-col">
            <label
              htmlFor={checkboxId}
              className={cn(
                'text-sm font-medium leading-none cursor-pointer',
                'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                error && 'text-destructive'
              )}
            >
              {label}
            </label>
            {description && (
              <span className="text-xs text-muted-foreground mt-1">
                {description}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

FieldCheckbox.displayName = 'FieldCheckbox';

export { FieldCheckbox };
