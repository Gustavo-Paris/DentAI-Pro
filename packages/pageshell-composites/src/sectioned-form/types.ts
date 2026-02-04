/**
 * SectionedFormPage Types
 *
 * Type definitions for form pages with collapsible sections.
 *
 * @module sectioned-form/types
 */

import type { ReactNode } from 'react';
import type { FieldValues, UseFormReturn, Path } from 'react-hook-form';
import type { StatusVariant } from '@pageshell/primitives';
import type { IconProp } from '@pageshell/primitives';
import type { IconColor } from '@pageshell/layouts';
import type {
  CompositeBaseProps,
  CompositeQueryResult,
  FormAriaLabels,
} from '../shared/types';

// =============================================================================
// Section Badge Configuration
// =============================================================================

/**
 * Badge configuration for sections
 */
export interface SectionBadgeConfig {
  /** Badge label */
  label: string;
  /** Badge variant */
  variant?: StatusVariant;
}

// =============================================================================
// Form Field Configuration
// =============================================================================

/**
 * Form field types supported in sectioned forms
 */
export type SectionedFormFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'custom';

/**
 * Select/radio option
 */
export interface SectionedFormFieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Form field configuration
 */
export interface SectionedFormFieldConfig<TValues extends FieldValues = FieldValues> {
  /** Field name (path in form values) */
  name: Path<TValues>;
  /** Field type */
  type: SectionedFormFieldType;
  /** Field label */
  label: string;
  /** Placeholder text */
  placeholder?: string;
  /** Help text */
  helpText?: string;
  /** Field icon */
  icon?: IconProp;
  /** Options for select/radio fields */
  options?: SectionedFormFieldOption[];
  /** Whether field is required */
  required?: boolean;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Show field conditionally */
  showWhen?: (values: TValues) => boolean;
  /** Hide field conditionally (inverse of showWhen) */
  hidden?: boolean | ((values: TValues) => boolean);
  /** Custom render function */
  render?: (props: {
    field: SectionedFormFieldConfig<TValues>;
    value: unknown;
    error?: string;
    onChange: (name: string, value: unknown) => void;
  }) => ReactNode;
  /** Grid column span (1 or 2) */
  colSpan?: 1 | 2;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Section Configuration
// =============================================================================

/**
 * Form section configuration
 */
export interface SectionedFormSectionConfig<TValues extends FieldValues = FieldValues> {
  /** Section ID (unique) */
  id: string;
  /** Section title */
  title: string;
  /** Section description */
  description?: string;
  /** Section icon */
  icon?: IconProp;
  /** Icon color variant */
  iconColor?: IconColor;
  /** Whether section is open by default */
  defaultOpen?: boolean;
  /** Badge configuration */
  badge?: SectionBadgeConfig;
  /** Dynamic badge based on data */
  badgeResolver?: (data: unknown) => SectionBadgeConfig | undefined;
  /** Form fields in this section */
  fields?: SectionedFormFieldConfig<TValues>[];
  /** Custom content (alternative to fields) */
  children?: ReactNode;
  /** Custom render function for section content */
  render?: (props: {
    form: UseFormReturn<TValues>;
    data: unknown;
  }) => ReactNode;
}

// =============================================================================
// Alert Configuration
// =============================================================================

/**
 * Alert configuration for top of form
 */
export interface SectionedFormAlertConfig<TData = unknown> {
  /** Show alert condition */
  show: boolean | ((data: TData) => boolean);
  /** Alert variant */
  variant: 'info' | 'warning' | 'success' | 'error';
  /** Alert icon */
  icon?: IconProp;
  /** Alert title */
  title: string;
  /** Alert description */
  description?: string;
}

// =============================================================================
// Mutation Interface
// =============================================================================

/**
 * Mutation-like interface compatible with tRPC, React Query, etc.
 */
export interface SectionedFormMutation<TPayload = unknown> {
  mutate: (payload: TPayload) => void;
  mutateAsync?: (payload: TPayload) => Promise<unknown>;
  isPending?: boolean;
  isLoading?: boolean; // Legacy support
  isError?: boolean;
  error?: unknown;
}

// =============================================================================
// Slots Configuration
// =============================================================================

/**
 * Slots for customization
 */
export interface SectionedFormPageSlots<TData = unknown> {
  /** Content before alert */
  beforeAlert?: ReactNode | ((data: TData) => ReactNode);
  /** Content after alert, before sections */
  afterAlert?: ReactNode | ((data: TData) => ReactNode);
  /** Content between sections and footer */
  afterSections?: ReactNode | ((data: TData) => ReactNode);
  /** Extra content in footer (left side) */
  footerExtra?: ReactNode | ((data: TData) => ReactNode);
  /** Custom error display */
  errors?: ReactNode | ((errors: Record<string, { message?: string }>) => ReactNode);
}

// =============================================================================
// Labels Configuration (i18n)
// =============================================================================

/**
 * Customizable labels for i18n
 */
export interface SectionedFormLabels {
  /** Submit button text */
  submitText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Loading text during submission */
  loadingText?: string;
  /** Back button label */
  backLabel?: string;
  /** Unsaved changes warning title */
  unsavedChangesTitle?: string;
  /** Unsaved changes warning description */
  unsavedChangesDescription?: string;
  /** Leave without saving button text */
  leaveWithoutSaving?: string;
  /** Keep editing button text */
  keepEditing?: string;
  /** Dirty form indicator text */
  unsavedIndicator?: string;
}

// =============================================================================
// SectionedFormPage Props
// =============================================================================

/**
 * Props for SectionedFormPage composite
 */
export interface SectionedFormPageProps<
  TValues extends FieldValues = FieldValues,
  TData = unknown,
> extends CompositeBaseProps {
  // -------------------------------------------------------------------------
  // Alert Configuration
  // -------------------------------------------------------------------------

  /**
   * Alert shown at top of form (e.g., incomplete setup warning)
   */
  alert?: SectionedFormAlertConfig<TData>;

  /**
   * Success alert shown when complete
   */
  successAlert?: SectionedFormAlertConfig<TData>;

  // -------------------------------------------------------------------------
  // Sections Configuration
  // -------------------------------------------------------------------------

  /**
   * Collapsible form sections
   */
  sections: SectionedFormSectionConfig<TValues>[];

  // -------------------------------------------------------------------------
  // Form Handling
  // -------------------------------------------------------------------------

  /**
   * External form instance (controlled mode)
   */
  form?: UseFormReturn<TValues>;

  /**
   * Default form values (declarative mode)
   */
  defaultValues?: TValues;

  /**
   * Form submission handler
   */
  onSubmit?: (data: TValues) => void | Promise<void>;

  /**
   * Mutation for form submission
   */
  mutation?: SectionedFormMutation<TValues>;

  /**
   * Transform payload before submission
   */
  transformPayload?: (data: TValues) => unknown;

  /**
   * Success callback
   */
  onSuccess?: () => void;

  /**
   * Error callback
   */
  onError?: (error: unknown) => void;

  // -------------------------------------------------------------------------
  // Data Loading
  // -------------------------------------------------------------------------

  /**
   * Query for initial data
   */
  query?: CompositeQueryResult<TData>;

  /**
   * Map query data to form values
   */
  mapDataToValues?: (data: TData) => Partial<TValues>;

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------

  /**
   * Back href for header
   */
  backHref?: string;

  /**
   * Back label
   */
  backLabel?: string;

  /**
   * Cancel href (defaults to backHref)
   */
  cancelHref?: string;

  /**
   * Cancel callback
   */
  onCancel?: () => void;

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  /**
   * Primary action configuration
   */
  primaryAction?: {
    label: string;
    loading?: boolean;
    disabled?: boolean;
    icon?: IconProp;
  };

  /**
   * Secondary action configuration
   */
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    icon?: IconProp;
  };

  /**
   * Header action slot (right side of header)
   */
  headerAction?: ReactNode;

  // -------------------------------------------------------------------------
  // Behavior
  // -------------------------------------------------------------------------

  /**
   * Warn on unsaved changes before navigation
   * @default true
   */
  warnOnUnsavedChanges?: boolean;

  /**
   * Show form-level errors
   * @default false
   */
  showErrors?: boolean;

  /**
   * Format error messages
   */
  formatError?: (error: unknown) => string;

  /**
   * Grid columns for fields (within sections)
   * @default 2
   */
  fieldColumns?: 1 | 2;

  /**
   * Gap between fields
   * @default 4
   */
  fieldGap?: 4 | 6 | 8;

  // -------------------------------------------------------------------------
  // Slots & Customization
  // -------------------------------------------------------------------------

  /**
   * Slot overrides
   */
  slots?: SectionedFormPageSlots<TData>;

  /**
   * Custom skeleton for loading state
   */
  skeleton?: ReactNode;

  /**
   * Customizable labels (i18n)
   */
  labels?: SectionedFormLabels;

  /**
   * ARIA labels for accessibility (i18n)
   */
  ariaLabels?: FormAriaLabels;

  /**
   * Additional class names
   */
  className?: string;

  /**
   * Test ID
   */
  testId?: string;
}

// =============================================================================
// Defaults
// =============================================================================

/**
 * Default values for SectionedFormPage
 */
export const sectionedFormPageDefaults = {
  // Base
  theme: 'default' as const,
  containerVariant: 'shell' as const,
  // Labels
  submitText: 'Save',
  cancelText: 'Cancel',
  loadingText: 'Saving...',
  backLabel: 'Back',
  unsavedChangesTitle: 'Unsaved changes',
  unsavedChangesDescription: 'You have unsaved changes. Are you sure you want to leave?',
  leaveWithoutSaving: 'Leave without saving',
  keepEditing: 'Keep editing',
  unsavedIndicator: 'Unsaved changes',
} as const;
