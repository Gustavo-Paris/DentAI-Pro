/**
 * FormPage Types
 *
 * Type definitions for the FormPage composite.
 *
 * @module form/types/form-page
 */

import type { ReactNode } from 'react';
import type { FieldValues, UseFormReturn, DefaultValues } from 'react-hook-form';
import type {
  CompositeBaseProps,
  CompositeQueryResult,
  FormFieldConfig,
  SectionConfig,
} from '../../shared/types';
import type { Shortcut } from '@pageshell/core';
import type { MutationLike, FormPageSlots } from './shared';

// =============================================================================
// FormPage Props
// =============================================================================

/**
 * Props for the FormPage composite
 */
export interface FormPageProps<TValues extends FieldValues = FieldValues>
  extends CompositeBaseProps {
  // ===========================================================================
  // Header
  // ===========================================================================

  /**
   * Page title.
   */
  title: string;

  /**
   * Page description (below title).
   */
  description?: string | ((data: unknown) => string);

  // ===========================================================================
  // Navigation
  // ===========================================================================

  /**
   * Back navigation href.
   */
  backHref?: string;

  /**
   * Back button label.
   */
  backLabel?: string;

  // ===========================================================================
  // Declarative Mode
  // ===========================================================================

  /**
   * Default form values - enables declarative mode.
   * When provided without `form`, useForm is created internally.
   */
  defaultValues?: DefaultValues<TValues>;

  /**
   * Submit handler receiving validated data.
   * Called with form data when validation passes.
   * Also accepts form.handleSubmit result for backward compatibility.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Intentional: supports both data handler and form.handleSubmit result
  onSubmit?: ((data: TValues) => void | Promise<void>) | ((e?: any) => Promise<void>);

  /**
   * Mutation for form submission.
   * Alternative to onSubmit - handles loading states automatically.
   */
  mutation?: MutationLike<TValues, unknown>;

  /**
   * Transform form data before sending to mutation/onSubmit.
   *
   * @example
   * ```tsx
   * transformPayload={(data) => ({
   *   ...data,
   *   priceInCents: Math.round(data.price * 100),
   * })}
   * ```
   */
  transformPayload?: (data: TValues) => unknown;

  /**
   * Success callback - called after successful submit/mutation.
   */
  onSuccess?: (data?: unknown) => void;

  /**
   * Redirect href after successful submit.
   * Supports :param pattern interpolation with mutation result.
   */
  successRedirect?: string;

  /**
   * Error callback - called when submit/mutation fails.
   */
  onError?: (error: Error) => void;

  /**
   * Reset callback - called when form is reset.
   */
  onReset?: () => void;

  /**
   * Success message to show in toast.
   */
  successMessage?: string;

  /**
   * Error message to show in toast.
   */
  errorMessage?: string;

  // ===========================================================================
  // Controlled Mode
  // ===========================================================================

  /**
   * react-hook-form form object for controlled mode.
   * When provided, takes precedence over defaultValues.
   */
  form?: UseFormReturn<TValues>;

  // ===========================================================================
  // Data Loading (Edit Mode)
  // ===========================================================================

  /**
   * Query for loading existing data (edit mode).
   */
  query?: CompositeQueryResult<TValues>;

  // ===========================================================================
  // Legacy/Override Props
  // ===========================================================================

  /** Override form's isSubmitting state */
  isSubmitting?: boolean;
  /** Override form's isValid state */
  isValid?: boolean;
  /** Override form's isDirty state */
  isDirty?: boolean;

  /**
   * Show validation error summary above form.
   */
  showErrors?: boolean;

  /**
   * Custom error message formatter.
   */
  formatError?: (fieldName: string, error: { message?: string; type?: string }) => string;

  // ===========================================================================
  // Labels
  // ===========================================================================

  /** Submit button text */
  submitText?: string;
  /** Submit button label (alias) */
  submitLabel?: string;
  /** Cancel href */
  cancelHref?: string;
  /** Cancel text */
  cancelText?: string;
  /** Cancel button label (alias) */
  cancelLabel?: string;
  /** Loading text shown when submitting */
  loadingText?: string;

  // ===========================================================================
  // Behavior
  // ===========================================================================

  /**
   * Show unsaved changes warning.
   * @default true
   */
  warnOnUnsavedChanges?: boolean;

  /**
   * Show navigation guard for unsaved changes (alias).
   */
  navigationGuard?: boolean;

  /**
   * Auto-save configuration.
   */
  autoSave?:
    | boolean
    | {
        enabled: boolean;
        debounceMs?: number;
        onAutoSave?: (data: TValues) => void | Promise<void>;
      };

  // ===========================================================================
  // Mobile
  // ===========================================================================

  /**
   * Make footer sticky on mobile with safe area padding.
   */
  stickyFooter?: boolean;

  // ===========================================================================
  // Declarative Fields API
  // ===========================================================================

  /**
   * Form fields configuration.
   */
  fields?: FormFieldConfig<TValues>[];

  /**
   * Group fields into sections.
   */
  sections?: SectionConfig[];

  /**
   * Section layout mode.
   * - 'inline': Sections as headers within single card (default)
   * - 'cards': Each section rendered in its own Card
   */
  sectionLayout?: 'inline' | 'cards';

  /**
   * Field layout.
   * Can be:
   * - Simple preset: 'single' | 'two-column' | 'responsive'
   * - Custom layout array: (string | string[])[] where each element is a field name or array of field names for a row
   */
  layout?: 'single' | 'two-column' | 'responsive' | (string | string[])[];

  /** Gap between fields (default: 4) */
  fieldGap?: number;
  /** Gap between columns (default: 4) */
  columnGap?: number;

  // ===========================================================================
  // Keyboard Shortcuts
  // ===========================================================================

  /**
   * Custom keyboard shortcuts.
   */
  shortcuts?: Shortcut[];

  /**
   * Disable default shortcuts (Cmd+S to save, Escape to cancel).
   */
  disableDefaultShortcuts?: boolean;

  // ===========================================================================
  // Slots
  // ===========================================================================

  /**
   * Slot overrides for customization.
   */
  slots?: FormPageSlots;

  /**
   * Custom skeleton for loading state.
   */
  skeleton?: ReactNode;

  /**
   * Custom footer slot (alias for slots.footerExtra).
   */
  footerSlot?: ReactNode;

  /**
   * Cancel callback (for controlled cancel behavior).
   */
  onCancel?: () => void;

  // ===========================================================================
  // Content
  // ===========================================================================

  /**
   * Form content (use fields prop instead for declarative API).
   */
  children?: ReactNode;
}
