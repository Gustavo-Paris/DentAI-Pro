/**
 * Text Field Renderers
 *
 * Text, number, currency, and textarea field renderers.
 *
 * @module wizard/components/field-renderers/TextFields
 */

'use client';

import * as React from 'react';
import type { FieldValues, UseFormReturn, Path } from 'react-hook-form';
import { Input, Textarea } from '@pageshell/primitives';
import type {
  WizardFormFieldText,
  WizardFormFieldNumber,
  WizardFormFieldCurrency,
  WizardFormFieldTextarea,
} from '../../enhanced-types';
import { FieldWrapper } from '../FieldWrapper';

// =============================================================================
// Text Input Renderer
// =============================================================================

export function renderTextInput<TFieldValues extends FieldValues>(
  field: WizardFormFieldText,
  form: UseFormReturn<TFieldValues>,
  name: Path<TFieldValues>
) {
  const { register, formState: { errors } } = form;
  const error = errors[name]?.message as string | undefined;

  const inputType = field.type === 'datetime' ? 'datetime-local' : field.type;

  return (
    <FieldWrapper
      label={field.label}
      name={field.name}
      required={field.required}
      description={field.description}
      error={error}
    >
      <Input
        type={inputType}
        placeholder={field.placeholder}
        disabled={field.disabled}
        data-testid={`${field.name}-input`}
        {...register(name, {
          required: field.required ? `${field.label} is required` : undefined,
          minLength: field.minLength ? {
            value: field.minLength,
            message: `Minimum ${field.minLength} characters`,
          } : undefined,
          maxLength: field.maxLength ? {
            value: field.maxLength,
            message: `Maximum ${field.maxLength} characters`,
          } : undefined,
        })}
      />
    </FieldWrapper>
  );
}

// =============================================================================
// Number Input Renderer
// =============================================================================

export function renderNumberInput<TFieldValues extends FieldValues>(
  field: WizardFormFieldNumber,
  form: UseFormReturn<TFieldValues>,
  name: Path<TFieldValues>
) {
  const { register, formState: { errors } } = form;
  const error = errors[name]?.message as string | undefined;

  return (
    <FieldWrapper
      label={field.label}
      name={field.name}
      required={field.required}
      description={field.description}
      error={error}
    >
      <div className="relative">
        <Input
          type="number"
          placeholder={field.placeholder}
          disabled={field.disabled}
          step={field.step}
          min={field.min}
          max={field.max}
          data-testid={`${field.name}-input`}
          {...register(name, {
            required: field.required ? `${field.label} is required` : undefined,
            valueAsNumber: true,
            min: field.min !== undefined ? {
              value: field.min,
              message: `Minimum value is ${field.min}`,
            } : undefined,
            max: field.max !== undefined ? {
              value: field.max,
              message: `Maximum value is ${field.max}`,
            } : undefined,
          })}
        />
        {field.suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {field.suffix}
          </span>
        )}
      </div>
    </FieldWrapper>
  );
}

// =============================================================================
// Currency Input Renderer
// =============================================================================

export function renderCurrencyInput<TFieldValues extends FieldValues>(
  field: WizardFormFieldCurrency,
  form: UseFormReturn<TFieldValues>,
  name: Path<TFieldValues>
) {
  const { register, formState: { errors } } = form;
  const error = errors[name]?.message as string | undefined;
  const currency = field.currency ?? 'BRL';
  const currencySymbol = currency === 'BRL' ? 'R$' : currency === 'USD' ? '$' : currency;

  return (
    <FieldWrapper
      label={field.label}
      name={field.name}
      required={field.required}
      description={field.description}
      error={error}
    >
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          {currencySymbol}
        </span>
        <Input
          type="number"
          placeholder={field.placeholder}
          disabled={field.disabled}
          step="0.01"
          min={field.min}
          max={field.max}
          className="pl-10"
          data-testid={`${field.name}-input`}
          {...register(name, {
            required: field.required ? `${field.label} is required` : undefined,
            valueAsNumber: true,
          })}
        />
      </div>
    </FieldWrapper>
  );
}

// =============================================================================
// Textarea Renderer
// =============================================================================

export function renderTextarea<TFieldValues extends FieldValues>(
  field: WizardFormFieldTextarea,
  form: UseFormReturn<TFieldValues>,
  name: Path<TFieldValues>
) {
  const { register, formState: { errors }, watch } = form;
  const error = errors[name]?.message as string | undefined;
  const value = watch(name) as string | undefined;
  const charCount = value?.length ?? 0;

  return (
    <FieldWrapper
      label={field.label}
      name={field.name}
      required={field.required}
      description={field.description}
      error={error}
    >
      <div className="relative">
        <Textarea
          placeholder={field.placeholder}
          disabled={field.disabled}
          rows={field.rows ?? 4}
          data-testid={`${field.name}-input`}
          {...register(name, {
            required: field.required ? `${field.label} is required` : undefined,
            minLength: field.minLength ? {
              value: field.minLength,
              message: `Minimum ${field.minLength} characters`,
            } : undefined,
            maxLength: field.maxLength ? {
              value: field.maxLength,
              message: `Maximum ${field.maxLength} characters`,
            } : undefined,
          })}
        />
        {field.showCount && field.maxLength && (
          <span className="absolute right-2 bottom-2 text-xs text-muted-foreground">
            {charCount}/{field.maxLength}
          </span>
        )}
      </div>
    </FieldWrapper>
  );
}
