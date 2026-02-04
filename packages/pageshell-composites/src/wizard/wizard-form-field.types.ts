/**
 * Wizard Form Field Types
 *
 * Form field type definitions for EnhancedWizardPage.
 * Extracted from enhanced-types.ts for better organization.
 *
 * @module wizard/wizard-form-field.types
 */

import type { ReactNode } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

// =============================================================================
// Form Field Types
// =============================================================================

/**
 * Form field types supported by EnhancedWizardPage
 */
export type WizardFormFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'password-strength'
  | 'url'
  | 'tel'
  | 'search'
  | 'date'
  | 'datetime'
  | 'time'
  | 'number'
  | 'currency'
  | 'textarea'
  | 'select'
  | 'combobox'
  | 'radio'
  | 'checkbox'
  | 'switch'
  | 'file'
  | 'rating'
  | 'tags'
  | 'rich-text'
  | 'custom';

// =============================================================================
// Base Field Definition
// =============================================================================

/**
 * Base form field definition
 */
export interface WizardFormFieldBase {
  /** Field type */
  type: WizardFormFieldType;
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
  /** Read-only state */
  readOnly?: boolean;
  /** Auto-focus this field on mount */
  autoFocus?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Conditional visibility */
  when?: (values: Record<string, unknown>) => boolean;
  /** Icon (left side for inputs) */
  icon?: ReactNode;
}

// =============================================================================
// Specific Field Types
// =============================================================================

/**
 * Text-based field (text, email, password, etc.)
 */
export interface WizardFormFieldText extends WizardFormFieldBase {
  type: 'text' | 'email' | 'password' | 'url' | 'tel' | 'search' | 'date' | 'datetime' | 'time';
  /** Minimum length */
  minLength?: number;
  /** Maximum length */
  maxLength?: number;
  /** Input pattern */
  pattern?: string;
  /** Prefix text/icon */
  prefix?: ReactNode;
  /** Suffix text/icon */
  suffix?: ReactNode;
  /** Auto-complete hint */
  autoComplete?: string;
  /** Show character count */
  showCount?: boolean;
}

/**
 * Password with strength indicator
 */
export interface WizardFormFieldPasswordStrength extends WizardFormFieldBase {
  type: 'password-strength';
  /** Auto-complete hint */
  autoComplete?: string;
  /** Show requirements checklist */
  showRequirements?: boolean;
  /** Minimum length requirement */
  minLength?: number;
  /** Require uppercase character */
  requireUppercase?: boolean;
  /** Require number character */
  requireNumber?: boolean;
  /** Require special character */
  requireSpecialChar?: boolean;
}

/**
 * Number field
 */
export interface WizardFormFieldNumber extends WizardFormFieldBase {
  type: 'number';
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Suffix text (e.g., "hours", "items") */
  suffix?: string;
}

/**
 * Currency field
 */
export interface WizardFormFieldCurrency extends WizardFormFieldBase {
  type: 'currency';
  /** Currency code */
  currency?: string;
  /** Locale for formatting */
  locale?: string;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
}

/**
 * Textarea field
 */
export interface WizardFormFieldTextarea extends WizardFormFieldBase {
  type: 'textarea';
  /** Number of rows */
  rows?: number;
  /** Minimum length */
  minLength?: number;
  /** Maximum length */
  maxLength?: number;
  /** Show character count */
  showCount?: boolean;
}

/**
 * Select field option
 */
export interface WizardFormFieldSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
}

/**
 * Select field
 */
export interface WizardFormFieldSelect extends WizardFormFieldBase {
  type: 'select';
  /** Options list */
  options: (string | WizardFormFieldSelectOption)[];
  /** Allow multiple selection */
  multiple?: boolean;
}

/**
 * Radio group field
 */
export interface WizardFormFieldRadio extends WizardFormFieldBase {
  type: 'radio';
  /** Options list */
  options: (string | WizardFormFieldSelectOption)[];
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
}

/**
 * Checkbox field
 */
export interface WizardFormFieldCheckbox extends WizardFormFieldBase {
  type: 'checkbox';
  /** Checkbox label (separate from field label) */
  checkboxLabel?: string;
}

/**
 * Switch field
 */
export interface WizardFormFieldSwitch extends WizardFormFieldBase {
  type: 'switch';
  /** Switch label (separate from field label) */
  switchLabel?: string;
}

/**
 * Custom field with render function
 */
export interface WizardFormFieldCustom extends WizardFormFieldBase {
  type: 'custom';
  /** Custom render function */
  render: (field: WizardFormFieldCustom, form: UseFormReturn<FieldValues>) => ReactNode;
}

// =============================================================================
// Union Type
// =============================================================================

/**
 * Union of all form field types
 */
export type WizardFormField =
  | WizardFormFieldText
  | WizardFormFieldPasswordStrength
  | WizardFormFieldNumber
  | WizardFormFieldCurrency
  | WizardFormFieldTextarea
  | WizardFormFieldSelect
  | WizardFormFieldRadio
  | WizardFormFieldCheckbox
  | WizardFormFieldSwitch
  | WizardFormFieldCustom;

/**
 * Layout configuration for form fields
 * Each row can be a single field name or array of field names
 */
export type WizardFormFieldLayout = (string | string[])[];
