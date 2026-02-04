/**
 * Form Field Configuration Types
 *
 * Form field types and configuration.
 *
 * @module shared/types/form-field
 */

import type { ReactNode } from 'react';
import type { IconProp } from '@pageshell/primitives';

// =============================================================================
// Form Field Option Types
// =============================================================================

/**
 * Rich option for select/radio/checkbox fields
 * Supports icon and description for enhanced UX
 */
export interface FormFieldOption {
  /** Option value */
  value: string;
  /** Display label */
  label: string;
  /** Optional description (for radio groups with rich content) */
  description?: string;
  /** Optional icon (for radio groups with rich content) */
  icon?: IconProp;
  /** Disable this specific option */
  disabled?: boolean;
}

// =============================================================================
// Form Field Configuration
// =============================================================================

/**
 * Form field types
 */
export type FormFieldType =
  // Text inputs
  | 'text'
  | 'email'
  | 'password'
  | 'password-strength' // Password with strength indicator
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
  | 'multiselect'
  | 'combobox'
  | 'radio'
  // Boolean
  | 'checkbox'
  | 'switch'
  // Date/Time
  | 'date'
  | 'datetime'
  | 'time'
  // File/Media
  | 'file'
  | 'image'
  | 'color'
  // Special
  | 'slider'
  | 'rating' // Star rating (1-5)
  | 'tags' // Tag input with badges
  | 'rich-text' // Rich text editor (TipTap)
  // Custom
  | 'custom';

/**
 * Form field configuration
 */
export interface FormFieldConfig<TValues = Record<string, unknown>> {
  /** Field name (path in form values) */
  name: keyof TValues | string;
  /** Field type */
  type: FormFieldType;
  /** Display label */
  label: string;
  /** Test ID for automated testing */
  testId?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Help text */
  description?: string;
  /** Is required? */
  required?: boolean;
  /** Disable condition */
  disabled?: boolean | ((values: TValues) => boolean);
  /** Hide condition */
  hidden?: boolean | ((values: TValues) => boolean);
  /**
   * Show condition (inverse of hidden).
   * Field is shown when this returns true.
   * More intuitive for conditional visibility.
   */
  showWhen?: (values: TValues) => boolean;
  /** Options for select/radio/checkbox */
  options?: (string | FormFieldOption)[];
  /** Validation rules (compatible with react-hook-form) */
  validation?: {
    min?: number | { value: number; message: string };
    max?: number | { value: number; message: string };
    minLength?: number | { value: number; message: string };
    maxLength?: number | { value: number; message: string };
    pattern?: RegExp | { value: RegExp; message: string };
    message?: string;
    required?: boolean | string;
    step?: number | { value: number; message: string };
    validate?: unknown;
  };
  // ===========================================================================
  // Type-specific properties
  // ===========================================================================

  /**
   * Currency symbol for currency fields.
   * @default 'R$'
   */
  currencySymbol?: string;

  /**
   * Label displayed next to checkbox (for checkbox type).
   * If not provided, uses the main `label` property.
   */
  checkboxLabel?: string;

  /**
   * Label for switch when ON (for switch type).
   */
  onLabel?: string;

  /**
   * Label for switch when OFF (for switch type).
   */
  offLabel?: string;

  /**
   * Number of rows for textarea.
   * @default 4
   */
  rows?: number;

  /**
   * Suffix text displayed after number input.
   * Example: 'horas', 'dias', 'unidades'
   */
  suffix?: string;

  /**
   * Auto-focus this field when form opens.
   */
  autoFocus?: boolean;

  /**
   * Icon for the field (displayed in label or input).
   * Accepts IconProp (string name or component) or ReactNode for flexibility.
   */
  icon?: IconProp | ReactNode;

  /**
   * Custom render function.
   * Can be either:
   * - New pattern: (field: FormFieldConfig, form: FormInstance) => ReactNode
   * - Legacy react-hook-form pattern: (props: { field, fieldState }) => ReactNode
   *
   * @remarks Intentionally uses `any` for flexibility across form library patterns.
   * This allows both react-hook-form's Controller render and custom patterns.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: ((arg: any, arg2?: any) => ReactNode) | undefined;
}
