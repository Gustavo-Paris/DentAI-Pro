/**
 * SectionFormField Component
 *
 * Renders a single form field within a section.
 *
 * @module sectioned-form/components/SectionFormField
 */

'use client';

import * as React from 'react';
import type { FieldValues, UseFormReturn, Path } from 'react-hook-form';
import { cn } from '@pageshell/core';
import { Input, resolveIcon } from '@pageshell/primitives';
import type { SectionedFormFieldConfig } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface SectionFormFieldProps<TValues extends FieldValues = FieldValues> {
  /** Field configuration */
  field: SectionedFormFieldConfig<TValues>;
  /** Form instance */
  form: UseFormReturn<TValues>;
  /** Current field value */
  value: unknown;
  /** Error message */
  error?: string;
  /** Change handler */
  onChange?: (name: string, value: unknown) => void;
}

// =============================================================================
// Component
// =============================================================================

export function SectionFormField<TValues extends FieldValues = FieldValues>({
  field,
  form,
  value,
  error,
  onChange,
}: SectionFormFieldProps<TValues>) {
  const { register } = form;
  const Icon = field.icon ? resolveIcon(field.icon) : null;

  // Handle change
  const handleChange = React.useCallback(
    (newValue: unknown) => {
      if (onChange) {
        onChange(field.name as string, newValue);
      }
    },
    [onChange, field.name]
  );

  // Custom render
  if (field.render) {
    return (
      <>
        {field.render({
          field,
          value,
          error,
          onChange: handleChange,
        })}
      </>
    );
  }

  // Common label component
  const labelElement = (
    <label className="text-sm font-medium text-muted-foreground">
      {field.label}
      {field.required && <span className="text-destructive ml-1">*</span>}
    </label>
  );

  // Common error component
  const errorElement = error && (
    <p className="text-xs text-destructive mt-1">{error}</p>
  );

  // Common help text
  const helpElement = field.helpText && !error && (
    <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
  );

  // Render based on type
  switch (field.type) {
    case 'text':
    case 'email':
    case 'password':
    case 'number':
      return (
        <div className={cn('space-y-1.5', field.className)}>
          {labelElement}
          <Input
            type={field.type}
            placeholder={field.placeholder}
            disabled={field.disabled}
            error={!!error}
            leftIcon={Icon ? <Icon className="w-4 h-4" /> : undefined}
            {...register(field.name)}
          />
          {errorElement}
          {helpElement}
        </div>
      );

    case 'textarea':
      return (
        <div className={cn('space-y-1.5', field.className)}>
          {labelElement}
          <textarea
            className={cn(
              'flex min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm',
              'ring-offset-background placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error ? 'border-destructive' : 'border-input'
            )}
            placeholder={field.placeholder}
            disabled={field.disabled}
            {...register(field.name)}
          />
          {errorElement}
          {helpElement}
        </div>
      );

    case 'select':
      return (
        <div className={cn('space-y-1.5', field.className)}>
          {labelElement}
          <select
            className={cn(
              'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm',
              'ring-offset-background',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error ? 'border-destructive' : 'border-input'
            )}
            disabled={field.disabled}
            {...register(field.name)}
          >
            {field.placeholder && (
              <option value="">{field.placeholder}</option>
            )}
            {field.options?.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          {errorElement}
          {helpElement}
        </div>
      );

    case 'checkbox':
      return (
        <div className={cn('flex items-start gap-3', field.className)}>
          <input
            type="checkbox"
            className={cn(
              'h-4 w-4 rounded border-input text-primary',
              'focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
            disabled={field.disabled}
            {...register(field.name)}
          />
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              {field.label}
            </label>
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        </div>
      );

    case 'radio':
      return (
        <div className={cn('space-y-2', field.className)}>
          {labelElement}
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="radio"
                  value={option.value}
                  className={cn(
                    'h-4 w-4 border-input text-primary',
                    'focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    'disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                  disabled={field.disabled || option.disabled}
                  {...register(field.name)}
                />
                <span className="text-sm text-foreground">{option.label}</span>
              </label>
            ))}
          </div>
          {errorElement}
          {helpElement}
        </div>
      );

    case 'switch':
      return (
        <div className={cn('flex items-center justify-between', field.className)}>
          <div className="space-y-0.5">
            <label className="text-sm font-medium text-foreground">
              {field.label}
            </label>
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
          <input
            type="checkbox"
            role="switch"
            className={cn(
              'relative h-6 w-11 cursor-pointer rounded-full bg-muted',
              'transition-colors duration-200',
              'checked:bg-primary',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
            disabled={field.disabled}
            {...register(field.name)}
          />
        </div>
      );

    default:
      return null;
  }
}
