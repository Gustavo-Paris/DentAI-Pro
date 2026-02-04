/**
 * FormFieldsRenderer - Declarative Form Fields for Wizard Steps
 *
 * Renders form fields based on declarative configuration.
 * Integrates with react-hook-form for validation and state management.
 *
 * @module wizard/FormFieldsRenderer
 */

'use client';

import * as React from 'react';
import type { FieldValues, UseFormReturn, Path } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { cn } from '@pageshell/core';
import type {
  WizardFormField,
  WizardFormFieldLayout,
  WizardFormFieldText,
  WizardFormFieldNumber,
  WizardFormFieldCurrency,
  WizardFormFieldTextarea,
  WizardFormFieldSelect,
  WizardFormFieldRadio,
  WizardFormFieldCheckbox,
  WizardFormFieldSwitch,
  WizardFormFieldCustom,
  WizardFormFieldBase,
} from './enhanced-types';
import {
  renderTextInput,
  renderNumberInput,
  renderCurrencyInput,
  renderTextarea,
  renderSelect,
  renderRadio,
  renderCheckbox,
  renderSwitch,
  renderCustomField,
} from './components';

/**
 * Base form field input type for the renderer.
 * Requires only the essential properties for rendering.
 * Made generic to accept various form field type definitions.
 */
export interface FormFieldInputBase {
  /** Field type */
  type: string;
  /** Field name (path in form values) */
  name: string;
  /** Display label */
  label: string;
  /** Placeholder text */
  placeholder?: string;
  /** Help text / description */
  description?: string;
  /** Is required? */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Conditional visibility */
  when?: (values: Record<string, unknown>) => boolean;
}

/**
 * Generic form field input type that accepts both WizardFormField and FormField types.
 * Uses a broad intersection type to be compatible with various form field implementations.
 */
export type FormFieldInput = FormFieldInputBase;

// =============================================================================
// Single Field Renderer
// =============================================================================

interface FormFieldRendererSingleProps<TFieldValues extends FieldValues> {
  field: FormFieldInput;
  form: UseFormReturn<TFieldValues>;
}

export function FormFieldRendererSingle<TFieldValues extends FieldValues>({
  field,
  form,
}: FormFieldRendererSingleProps<TFieldValues>) {
  const name = field.name as Path<TFieldValues>;

  // Handle conditional visibility
  const values = useWatch({ control: form.control });
  if (field.when && !field.when(values as Record<string, unknown>)) {
    return null;
  }

  switch (field.type) {
    case 'text':
    case 'email':
    case 'password':
    case 'password-strength':
    case 'url':
    case 'tel':
    case 'search':
    case 'date':
    case 'datetime':
    case 'time':
      return renderTextInput(field as WizardFormFieldText, form, name);

    case 'number':
      return renderNumberInput(field as WizardFormFieldNumber, form, name);

    case 'currency':
      return renderCurrencyInput(field as WizardFormFieldCurrency, form, name);

    case 'textarea':
      return renderTextarea(field as WizardFormFieldTextarea, form, name);

    case 'select':
      return renderSelect(field as WizardFormFieldSelect, form, name);

    case 'radio':
      return renderRadio(field as WizardFormFieldRadio, form, name);

    case 'checkbox':
      return renderCheckbox(field as WizardFormFieldCheckbox, form, name);

    case 'switch':
      return renderSwitch(field as WizardFormFieldSwitch, form, name);

    case 'custom':
      return renderCustomField(field as WizardFormFieldCustom, form, name);

    default:
      return null;
  }
}

// =============================================================================
// Main Renderer
// =============================================================================

/**
 * Section configuration for grouping fields visually
 */
export interface FormFieldSection {
  /** Unique section identifier */
  id: string;
  /** Section title (displayed as header) */
  title: string;
  /** Optional section description */
  description?: string;
  /** Field names in this section */
  fields: string[];
  /** Make section collapsible */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
}

interface FormFieldsRendererProps<TFieldValues extends FieldValues> {
  fields: FormFieldInput[];
  form: UseFormReturn<TFieldValues>;
  layout?: WizardFormFieldLayout;
  /** Optional sections for grouping fields */
  sections?: FormFieldSection[];
  gap?: number;
  columnGap?: number;
}

export function FormFieldsRenderer<TFieldValues extends FieldValues>({
  fields,
  form,
  layout,
  gap = 4,
  columnGap = 4,
}: FormFieldsRendererProps<TFieldValues>) {
  // Create a map of field names to field configs
  const fieldMap = React.useMemo(() => {
    return new Map(fields.map((f) => [f.name, f]));
  }, [fields]);

  // No layout - render fields in order (single column)
  if (!layout) {
    return (
      <div className={`space-y-${gap}`}>
        {fields.map((field) => (
          <FormFieldRendererSingle
            key={field.name}
            field={field}
            form={form}
          />
        ))}
      </div>
    );
  }

  // Render with layout grid
  return (
    <div className={`space-y-${gap}`}>
      {layout.map((row, rowIndex) => {
        // Normalize row to array
        const fieldNames = Array.isArray(row) ? row : [row];

        // Single field = full width
        if (fieldNames.length === 1) {
          const fieldName = fieldNames[0];
          if (!fieldName) return null;
          const field = fieldMap.get(fieldName);
          if (!field) return null;
          return (
            <FormFieldRendererSingle
              key={field.name}
              field={field}
              form={form}
            />
          );
        }

        // Multiple fields = grid
        return (
          <div
            key={`row-${rowIndex}`}
            className={cn(
              'grid gap-4',
              fieldNames.length === 2 && 'grid-cols-1 sm:grid-cols-2',
              fieldNames.length === 3 && 'grid-cols-1 sm:grid-cols-3',
              fieldNames.length === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            )}
            style={{ gap: `${columnGap * 0.25}rem` }}
          >
            {fieldNames.map((fieldName) => {
              const field = fieldMap.get(fieldName);
              if (!field) return null;
              return (
                <FormFieldRendererSingle
                  key={field.name}
                  field={field}
                  form={form}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
