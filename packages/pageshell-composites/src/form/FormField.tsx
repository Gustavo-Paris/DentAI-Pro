/**
 * FormField Component
 *
 * Accessible form field renderer with full ARIA support.
 *
 * @module form/FormField
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import {
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  RadioGroup,
  RadioGroupItem,
  PageIcon,
  Label,
  Switch,
  Checkbox,
} from '@pageshell/primitives';
import type { FormFieldConfig, FormFieldOption } from '../shared/types';
import { FieldError } from './components/FieldError';

// =============================================================================
// Types
// =============================================================================

export interface FormFieldProps<TValues extends Record<string, unknown>> {
  /** Field configuration */
  field: FormFieldConfig<TValues>;
  /** Current field value */
  value: unknown;
  /** Validation error message */
  error?: string;
  /** All form values (for conditional logic) */
  values: TValues;
  /** Change handler */
  onChange: (name: string, value: unknown) => void;
}

// =============================================================================
// Helper to generate aria-describedby
// =============================================================================

function getDescribedBy(fieldName: string, hasDescription: boolean, hasError: boolean): string | undefined {
  const ids: string[] = [];
  if (hasDescription) ids.push(`${fieldName}-description`);
  if (hasError) ids.push(`${fieldName}-error`);
  return ids.length > 0 ? ids.join(' ') : undefined;
}

/**
 * Normalize option to FormFieldOption
 */
function normalizeOption(opt: string | FormFieldOption): FormFieldOption {
  if (typeof opt === 'string') {
    return { value: opt, label: opt };
  }
  return opt;
}

/**
 * Check if any option has rich content (icon or description)
 */
function hasRichOptions(options: (string | FormFieldOption)[]): boolean {
  return options.some((opt) => {
    if (typeof opt === 'string') return false;
    return Boolean(opt.description || opt.icon);
  });
}

// =============================================================================
// FormField Component
// =============================================================================

function FormFieldInner<TValues extends Record<string, unknown>>({
  field,
  value,
  error,
  values,
  onChange,
}: FormFieldProps<TValues>) {
  const fieldName = field.name as string;
  const isDisabled = typeof field.disabled === 'function' ? field.disabled(values) : field.disabled;

  // Track if we should animate the error (only on first appearance)
  const [shouldAnimate, setShouldAnimate] = React.useState(false);
  const prevError = React.useRef<string | undefined>(undefined);

  // Effect to detect new errors and trigger animation
  React.useEffect(() => {
    if (error && !prevError.current) {
      setShouldAnimate(true);
      const timer = setTimeout(() => setShouldAnimate(false), 500);
      return () => clearTimeout(timer);
    }
    prevError.current = error;
  }, [error]);

  // Handle both hidden and showWhen (showWhen is inverted hidden)
  const hiddenByHidden = typeof field.hidden === 'function' ? field.hidden(values) : field.hidden;
  const hiddenByShowWhen = field.showWhen ? !field.showWhen(values) : false;
  const isHidden = hiddenByHidden || hiddenByShowWhen;

  if (isHidden) return null;

  const hasDescription = Boolean(field.description);
  const hasError = Boolean(error);
  const describedBy = getDescribedBy(fieldName, hasDescription, hasError);

  // Common ARIA props for all inputs
  const ariaProps = {
    'aria-required': field.required || undefined,
    'aria-invalid': hasError || undefined,
    'aria-describedby': describedBy,
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor={fieldName}>
        {field.label}
        {field.required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
      </label>

      {field.type === 'textarea' ? (
        <Textarea
          id={fieldName}
          value={String(value || '')}
          onChange={(e) => onChange(fieldName, e.target.value)}
          placeholder={field.placeholder}
          disabled={isDisabled}
          className={cn(hasError && 'border-destructive')}
          {...ariaProps}
        />
      ) : field.type === 'select' ? (
        <Select
          value={String(value || '')}
          onValueChange={(v) => onChange(fieldName, v)}
          disabled={isDisabled}
        >
          <SelectTrigger
            id={fieldName}
            className={cn(hasError && 'border-destructive')}
            aria-label={!value ? field.placeholder || 'Select an option' : undefined}
            {...ariaProps}
          >
            <SelectValue placeholder={field.placeholder || 'Select...'} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => {
              const optValue = typeof opt === 'string' ? opt : opt.value;
              const optLabel = typeof opt === 'string' ? opt : opt.label;
              return (
                <SelectItem key={optValue} value={optValue || ''}>
                  {optLabel}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      ) : field.type === 'radio' && field.options ? (
        <RadioGroup
          value={String(value || '')}
          onValueChange={(v) => onChange(fieldName, v)}
          disabled={isDisabled}
          className={cn(
            'gap-3',
            hasRichOptions(field.options) && 'gap-4'
          )}
          aria-labelledby={`${fieldName}-label`}
          {...ariaProps}
        >
          {field.options.map((opt) => {
            const option = normalizeOption(opt);
            const optionId = `${fieldName}-${option.value}`;
            const isRich = Boolean(option.description || option.icon);

            return (
              <div
                key={option.value}
                className={cn(
                  'flex items-start space-x-3',
                  isRich && 'p-3 rounded-lg border border-input hover:border-primary/50 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5'
                )}
              >
                <RadioGroupItem
                  value={option.value}
                  id={optionId}
                  disabled={option.disabled}
                  className={cn(isRich && 'mt-0.5')}
                />
                <div className="flex-1">
                  <Label
                    htmlFor={optionId}
                    className={cn(
                      'flex items-center gap-2 cursor-pointer',
                      option.disabled && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    {option.icon && (
                      typeof option.icon === 'string' ? (
                        <PageIcon
                          name={option.icon}
                          className="h-4 w-4 text-muted-foreground"
                        />
                      ) : (
                        <option.icon className="h-4 w-4 text-muted-foreground" />
                      )
                    )}
                    <span>{option.label}</span>
                  </Label>
                  {option.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </RadioGroup>
      ) : field.type === 'switch' ? (
        // Switch field - renders as toggle with label on left
        <div className="flex items-center justify-between">
          <Switch
            id={fieldName}
            checked={Boolean(value)}
            onCheckedChange={(checked) => onChange(fieldName, checked)}
            disabled={isDisabled}
            aria-describedby={describedBy}
          />
        </div>
      ) : field.type === 'checkbox' ? (
        // Checkbox field - renders as checkbox with label
        <div className="flex items-start space-x-3">
          <Checkbox
            id={fieldName}
            checked={Boolean(value)}
            onCheckedChange={(checked) => onChange(fieldName, checked)}
            disabled={isDisabled}
            className={cn(hasError && 'border-destructive')}
            aria-describedby={describedBy}
          />
          {field.checkboxLabel && (
            <Label
              htmlFor={fieldName}
              className={cn(
                'text-sm cursor-pointer leading-tight',
                isDisabled && 'cursor-not-allowed opacity-50'
              )}
            >
              {field.checkboxLabel}
            </Label>
          )}
        </div>
      ) : field.type === 'currency' ? (
        // Currency field - input with currency symbol prefix
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
            {field.currencySymbol ?? 'R$'}
          </span>
          <Input
            id={fieldName}
            type="number"
            step="0.01"
            value={value !== undefined && value !== null ? String(value) : ''}
            onChange={(e) => onChange(fieldName, e.target.value ? Number(e.target.value) : undefined)}
            placeholder={field.placeholder ?? '0,00'}
            disabled={isDisabled}
            className={cn('pl-10', hasError && 'border-destructive')}
            {...ariaProps}
          />
        </div>
      ) : (
        <Input
          id={fieldName}
          type={field.type === 'password' ? 'password' : field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text'}
          value={String(value || '')}
          onChange={(e) => onChange(fieldName, field.type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={field.placeholder}
          disabled={isDisabled}
          className={cn(hasError && 'border-destructive')}
          {...ariaProps}
        />
      )}

      {field.description && (
        <p id={`${fieldName}-description`} className="text-xs text-muted-foreground">
          {field.description}
        </p>
      )}

      {error && (
        <FieldError
          id={`${fieldName}-error`}
          message={error}
          animate={shouldAnimate}
        />
      )}
    </div>
  );
}

export const FormField = React.memo(FormFieldInner) as <TValues extends Record<string, unknown>>(
  props: FormFieldProps<TValues>
) => React.ReactElement | null;

(FormField as React.FC).displayName = 'FormField';
