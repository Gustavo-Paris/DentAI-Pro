/**
 * Selection Field Renderers
 *
 * Select, radio, checkbox, and switch field renderers.
 *
 * @module wizard/components/field-renderers/SelectionFields
 */

'use client';

import * as React from 'react';
import { Controller } from 'react-hook-form';
import type { FieldValues, UseFormReturn, Path } from 'react-hook-form';
import { cn } from '@pageshell/core';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  RadioGroup,
  RadioGroupItem,
  Checkbox,
  Switch,
  Label,
} from '@pageshell/primitives';
import type {
  WizardFormFieldSelect,
  WizardFormFieldRadio,
  WizardFormFieldCheckbox,
  WizardFormFieldSwitch,
  WizardFormFieldCustom,
} from '../../enhanced-types';
import { FieldWrapper } from '../FieldWrapper';

// =============================================================================
// Select Renderer
// =============================================================================

export function renderSelect<TFieldValues extends FieldValues>(
  field: WizardFormFieldSelect,
  form: UseFormReturn<TFieldValues>,
  name: Path<TFieldValues>
) {
  const { control, formState: { errors } } = form;
  const error = errors[name]?.message as string | undefined;

  const options = field.options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  return (
    <FieldWrapper
      label={field.label}
      name={field.name}
      required={field.required}
      description={field.description}
      error={error}
    >
      <Controller
        name={name}
        control={control}
        rules={{ required: field.required ? `${field.label} is required` : undefined }}
        render={({ field: controllerField }) => (
          <Select
            value={controllerField.value || ''}
            onValueChange={controllerField.onChange}
            disabled={field.disabled}
          >
            <SelectTrigger data-testid={`${field.name}-input`}>
              <SelectValue placeholder={field.placeholder ?? 'Select...'} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </FieldWrapper>
  );
}

// =============================================================================
// Radio Renderer
// =============================================================================

export function renderRadio<TFieldValues extends FieldValues>(
  field: WizardFormFieldRadio,
  form: UseFormReturn<TFieldValues>,
  name: Path<TFieldValues>
) {
  const { control, formState: { errors } } = form;
  const error = errors[name]?.message as string | undefined;

  const options = field.options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const isHorizontal = field.direction === 'horizontal';

  return (
    <FieldWrapper
      label={field.label}
      name={field.name}
      required={field.required}
      description={field.description}
      error={error}
    >
      <Controller
        name={name}
        control={control}
        rules={{ required: field.required ? `${field.label} is required` : undefined }}
        render={({ field: controllerField }) => (
          <RadioGroup
            value={controllerField.value || ''}
            onValueChange={controllerField.onChange}
            disabled={field.disabled}
            className={cn(
              'flex gap-4',
              isHorizontal ? 'flex-row flex-wrap' : 'flex-col'
            )}
            aria-label={field.label}
            data-testid={`${field.name}-input`}
          >
            {options.map((opt) => (
              <div key={opt.value} className="flex items-center gap-2">
                <RadioGroupItem
                  value={opt.value}
                  id={`${field.name}-${opt.value}`}
                  disabled={opt.disabled}
                />
                <Label
                  htmlFor={`${field.name}-${opt.value}`}
                  className="text-sm cursor-pointer"
                >
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}
      />
    </FieldWrapper>
  );
}

// =============================================================================
// Checkbox Renderer
// =============================================================================

export function renderCheckbox<TFieldValues extends FieldValues>(
  field: WizardFormFieldCheckbox,
  form: UseFormReturn<TFieldValues>,
  name: Path<TFieldValues>
) {
  const { register, formState: { errors } } = form;
  const error = errors[name]?.message as string | undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <Checkbox
          disabled={field.disabled}
          data-testid={`${field.name}-input`}
          {...register(name)}
        />
        <div className="space-y-1">
          <Label className="text-sm font-medium cursor-pointer">
            {field.checkboxLabel ?? field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

// =============================================================================
// Switch Renderer
// =============================================================================

export function renderSwitch<TFieldValues extends FieldValues>(
  field: WizardFormFieldSwitch,
  form: UseFormReturn<TFieldValues>,
  name: Path<TFieldValues>
) {
  const { formState: { errors }, watch, setValue } = form;
  const error = errors[name]?.message as string | undefined;
  const value = watch(name) as boolean;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label className="text-sm font-medium">
            {field.switchLabel ?? field.label}
          </Label>
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
        <Switch
          checked={value}
          onCheckedChange={(checked) => setValue(name, checked as FieldValues[Path<TFieldValues>])}
          disabled={field.disabled}
          data-testid={`${field.name}-input`}
        />
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

// =============================================================================
// Custom Field Renderer
// =============================================================================

export function renderCustomField<TFieldValues extends FieldValues>(
  field: WizardFormFieldCustom,
  form: UseFormReturn<TFieldValues>,
  _name: Path<TFieldValues>
) {
  return field.render(field, form as UseFormReturn<FieldValues>);
}
