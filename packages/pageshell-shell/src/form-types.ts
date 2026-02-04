/**
 * FormModal Field Types
 *
 * Declarative API for defining form fields in PageShell.FormModal.
 * Integrates with react-hook-form for validation and state management.
 *
 * @module form-types
 */

import type { ReactNode } from 'react';
import type { RegisterOptions } from 'react-hook-form';
import type { IconProp } from '@pageshell/primitives';

// =============================================================================
// Base Types
// =============================================================================

/**
 * Option for select, radio, combobox fields
 */
export interface FormFieldOption {
  /** Option value */
  value: string;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
  /** Disable this option */
  disabled?: boolean;
  /** Icon (string name or ComponentType) */
  icon?: IconProp;
}

/**
 * Validation rules (react-hook-form compatible)
 */
export interface FormFieldValidation {
  // HTML5 Standard Validation
  required?: boolean | string;
  min?: number | { value: number; message: string };
  max?: number | { value: number; message: string };
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  pattern?: RegExp | { value: RegExp; message: string };
  step?: number | { value: number; message: string };

  // Custom Validation
  validate?: RegisterOptions['validate'];

  // Advanced Validation
  matches?: string | { value: string; message: string };
  oneOf?: unknown[] | { options: unknown[]; message: string };
  notOneOf?: unknown[] | { options: unknown[]; message: string };
  positive?: boolean | string;
  negative?: boolean | string;
  integer?: boolean | string;
  url?: boolean | string;
  email?: boolean | string;
  uuid?: boolean | string;
  json?: boolean | string;
}

/**
 * Section configuration for grouping fields visually
 */
export interface FormSection {
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
  /** Optional icon for section header */
  icon?: ReactNode;
  /** Optional badge */
  badge?: ReactNode | FormSectionBadge;
}

/**
 * Declarative badge configuration for form sections
 */
export interface FormSectionBadge {
  /** Badge variant */
  variant: 'default' | 'success' | 'warning' | 'destructive' | 'outline';
  /** Badge label text */
  label: string;
  /** Show dot indicator */
  dot?: boolean;
}

// =============================================================================
// Field Type Enum
// =============================================================================

/**
 * Supported field types
 */
export type FormFieldType =
  // Text inputs
  | 'text'
  | 'email'
  | 'password'
  | 'password-strength'
  | 'url'
  | 'tel'
  | 'search'
  // Number inputs
  | 'number'
  | 'currency'
  // Multi-line
  | 'textarea'
  // Selection
  | 'select'
  | 'combobox'
  | 'radio'
  // Boolean
  | 'checkbox'
  | 'switch'
  // Date/Time
  | 'date'
  | 'datetime'
  | 'time'
  // File
  | 'file'
  // Special
  | 'rating'
  | 'tags'
  | 'rich-text'
  // Custom
  | 'custom';

// =============================================================================
// Base Field Interface
// =============================================================================

/**
 * Base properties shared by all field types
 */
export interface FormFieldBase {
  /** Field type */
  type: FormFieldType;
  /** Field name (must match form schema) */
  name: string;
  /** Display label */
  label: string;
  /** Placeholder text */
  placeholder?: string;
  /** Help text below the field */
  description?: string;
  /** Whether field is required */
  required?: boolean;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Whether field is read-only */
  readOnly?: boolean;
  /** Auto-focus this field on mount */
  autoFocus?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Validation rules */
  validation?: FormFieldValidation;
  /** Conditional visibility */
  when?: (values: Record<string, unknown>) => boolean;
  /** Icon (left side for inputs) */
  icon?: ReactNode;
}

// =============================================================================
// Text Field Types
// =============================================================================

export interface FormFieldText extends FormFieldBase {
  type: 'text' | 'email' | 'password' | 'url' | 'tel' | 'search';
  maxLength?: number;
  autoComplete?: string;
  showCount?: boolean;
}

export interface FormFieldPasswordStrength extends FormFieldBase {
  type: 'password-strength';
  autoComplete?: string;
  showRequirements?: boolean;
  minLength?: number;
  requireUppercase?: boolean;
  requireNumber?: boolean;
  requireSpecialChar?: boolean;
}

// =============================================================================
// Number Field Types
// =============================================================================

export interface FormFieldNumber extends FormFieldBase {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
}

export interface FormFieldCurrency extends FormFieldBase {
  type: 'currency';
  prefix?: string;
  decimals?: number;
  thousandSeparator?: string;
  decimalSeparator?: string;
}

// =============================================================================
// Textarea Field Type
// =============================================================================

export interface FormFieldTextarea extends FormFieldBase {
  type: 'textarea';
  rows?: number;
  maxLength?: number;
  showCount?: boolean;
  autoResize?: boolean;
}

// =============================================================================
// Selection Field Types
// =============================================================================

export interface FormFieldSelect extends FormFieldBase {
  type: 'select';
  options: FormFieldOption[];
  clearable?: boolean;
  emptyText?: string;
}

export interface FormFieldCombobox extends FormFieldBase {
  type: 'combobox';
  options: FormFieldOption[];
  multiple?: boolean;
  creatable?: boolean;
  loadOptions?: (query: string) => Promise<FormFieldOption[]>;
  searchPlaceholder?: string;
  noOptionsText?: string;
}

export interface FormFieldRadio extends FormFieldBase {
  type: 'radio';
  options: FormFieldOption[];
  orientation?: 'horizontal' | 'vertical';
}

// =============================================================================
// Boolean Field Types
// =============================================================================

export interface FormFieldCheckbox extends FormFieldBase {
  type: 'checkbox';
  checkboxLabel?: string;
}

export interface FormFieldSwitch extends FormFieldBase {
  type: 'switch';
  onLabel?: string;
  offLabel?: string;
}

// =============================================================================
// Date/Time Field Types
// =============================================================================

export interface FormFieldDate extends FormFieldBase {
  type: 'date';
  min?: Date | string;
  max?: Date | string;
  format?: string;
}

export interface FormFieldDateTime extends FormFieldBase {
  type: 'datetime';
  min?: Date | string;
  max?: Date | string;
  showSeconds?: boolean;
}

export interface FormFieldTime extends FormFieldBase {
  type: 'time';
  showSeconds?: boolean;
  hourFormat?: 12 | 24;
}

// =============================================================================
// File Field Type
// =============================================================================

export interface FormFieldFile extends FormFieldBase {
  type: 'file';
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  showPreview?: boolean;
}

// =============================================================================
// Custom Field Type
// =============================================================================

export interface FormFieldCustom extends FormFieldBase {
  type: 'custom';
  render: (props: {
    field: {
      value: unknown;
      onChange: (value: unknown) => void;
      onBlur: () => void;
      name: string;
      ref: React.Ref<unknown>;
    };
    fieldState: {
      invalid: boolean;
      isTouched: boolean;
      isDirty: boolean;
      error?: { message?: string };
    };
  }) => ReactNode;
}

// =============================================================================
// Special Field Types
// =============================================================================

export interface FormFieldRating extends FormFieldBase {
  type: 'rating';
  max?: number;
  allowHalf?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export interface FormFieldTags extends FormFieldBase {
  type: 'tags';
  suggestions?: string[];
  maxTags?: number;
  allowCreate?: boolean;
  emptyText?: string;
}

export interface FormFieldRichText extends FormFieldBase {
  type: 'rich-text';
  minHeight?: number;
  maxHeight?: number;
  toolbar?: ('bold' | 'italic' | 'underline' | 'strike' | 'link' | 'list' | 'heading')[];
  placeholder?: string;
}

// =============================================================================
// Union Type
// =============================================================================

/**
 * All possible field configurations
 */
export type FormField =
  | FormFieldText
  | FormFieldPasswordStrength
  | FormFieldNumber
  | FormFieldCurrency
  | FormFieldTextarea
  | FormFieldSelect
  | FormFieldCombobox
  | FormFieldRadio
  | FormFieldCheckbox
  | FormFieldSwitch
  | FormFieldDate
  | FormFieldDateTime
  | FormFieldTime
  | FormFieldFile
  | FormFieldRating
  | FormFieldTags
  | FormFieldRichText
  | FormFieldCustom;

// =============================================================================
// Layout Types
// =============================================================================

/**
 * Layout configuration for form fields.
 * Each array element represents a row, containing field names.
 */
export type FormFieldLayout = (string | string[])[];

// =============================================================================
// Helper Types
// =============================================================================

/**
 * Extract field names from a fields array (for type safety)
 */
export type FieldNames<T extends FormField[]> = T[number]['name'];
