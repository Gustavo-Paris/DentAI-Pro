/**
 * FieldSelect Component
 *
 * Theme-aware select with simplified options API.
 *
 * @module field/FieldSelect
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '../select';
import type { VariantProps } from 'class-variance-authority';
import { fieldSelectVariants } from './variants';

export interface FieldSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FieldSelectGroup {
  label: string;
  options: FieldSelectOption[];
}

export interface FieldSelectProps
  extends Omit<React.ComponentProps<typeof Select>, 'children'>,
    VariantProps<typeof fieldSelectVariants> {
  /** Simple array of options */
  options?: FieldSelectOption[];
  /** Grouped options with labels */
  groups?: FieldSelectGroup[];
  /** Placeholder text when no value selected */
  placeholder?: string;
  /** Additional className for the trigger */
  className?: string;
  /** Error state styling */
  error?: boolean;
  /** Full width (default: true) */
  fullWidth?: boolean;
}

/**
 * FieldSelect - Simplified declarative select component
 *
 * @example
 * // Simple options
 * <Field.Select
 *   options={[
 *     { value: 'opt1', label: 'Option 1' },
 *     { value: 'opt2', label: 'Option 2' },
 *   ]}
 *   placeholder="Choose..."
 *   value={value}
 *   onValueChange={setValue}
 * />
 *
 * @example
 * // Grouped options
 * <Field.Select
 *   groups={[
 *     { label: 'Fruits', options: [{ value: 'apple', label: 'Apple' }] },
 *     { label: 'Vegetables', options: [{ value: 'carrot', label: 'Carrot' }] },
 *   ]}
 *   placeholder="Choose..."
 * />
 */
const FieldSelect = React.forwardRef<HTMLButtonElement, FieldSelectProps>(
  (
    {
      options,
      groups,
      placeholder,
      className,
      size,
      error,
      fullWidth = true,
      ...props
    },
    ref
  ) => {
    return (
      <Select {...props}>
        <SelectTrigger
          ref={ref}
          className={cn(
            fieldSelectVariants({ size }),
            fullWidth && 'w-full',
            error && 'border-[var(--input-error-border)] focus:ring-[var(--color-destructive-muted)]',
            className
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {/* Simple options */}
          {options?.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}

          {/* Grouped options */}
          {groups?.map((group, groupIndex) => (
            <React.Fragment key={group.label}>
              {groupIndex > 0 && <SelectSeparator />}
              <SelectGroup>
                <SelectLabel>{group.label}</SelectLabel>
                {group.options.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </React.Fragment>
          ))}
        </SelectContent>
      </Select>
    );
  }
);

FieldSelect.displayName = 'FieldSelect';

export { FieldSelect };
