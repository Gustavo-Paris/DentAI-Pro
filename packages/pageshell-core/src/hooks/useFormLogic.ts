/**
 * useFormLogic - Headless Form Logic Hook
 *
 * Encapsulates form state management: submission, validation, dirty state,
 * unsaved changes warning, and auto-save.
 *
 * Can be used independently for custom UIs or with FormPage/FormModal.
 *
 * @module hooks/useFormLogic
 *
 * @example Basic usage with manual state
 * ```tsx
 * const form = useFormLogic({
 *   onSubmit: async (data) => {
 *     await api.save(data);
 *   },
 *   warnOnUnsavedChanges: true,
 * });
 *
 * // Track dirty state
 * const handleChange = () => form.markDirty();
 *
 * // Submit
 * <button onClick={form.submit} disabled={form.isSubmitting}>
 *   {form.isSubmitting ? 'Saving...' : 'Save'}
 * </button>
 * ```
 *
 * @example Integration with react-hook-form
 * ```tsx
 * const rhf = useForm<MyForm>();
 * const form = useFormLogic({
 *   formState: rhf.formState,
 *   onSubmit: rhf.handleSubmit(handleSubmit),
 *   warnOnUnsavedChanges: true,
 * });
 *
 * // Use form.isSubmitting, form.isDirty, form.hasErrors from hook
 * ```
 *
 * @example With auto-save
 * ```tsx
 * const form = useFormLogic({
 *   autoSave: {
 *     enabled: true,
 *     debounceMs: 2000,
 *     onAutoSave: async () => {
 *       await api.saveDraft(getData());
 *     },
 *   },
 * });
 *
 * // Auto-save status: form.autoSaveStatus ('idle' | 'saving' | 'saved' | 'error')
 * ```
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

// =============================================================================
// Types
// =============================================================================

/**
 * Form state from react-hook-form or similar
 */
export interface FormStateInput {
  /** Is form currently submitting */
  isSubmitting?: boolean;
  /** Is form valid */
  isValid?: boolean;
  /** Has form been modified */
  isDirty?: boolean;
  /** Form validation errors */
  errors?: Record<string, { message?: string; type?: string }>;
}

/**
 * Auto-save configuration
 */
export interface AutoSaveConfig {
  /** Enable auto-save */
  enabled: boolean;
  /** Debounce delay in ms */
  debounceMs?: number;
  /** Callback to save data */
  onAutoSave: () => void | Promise<void>;
}

/**
 * useFormLogic options
 */
export interface UseFormLogicOptions {
  // Form state (from react-hook-form or manual)
  /** External form state */
  formState?: FormStateInput;

  // Manual state overrides
  /** Override isSubmitting */
  isSubmitting?: boolean;
  /** Override isValid */
  isValid?: boolean;
  /** Override isDirty */
  isDirty?: boolean;

  // Submission
  /** Submit handler */
  onSubmit?: () => Promise<void> | void;
  /** Called after successful submit */
  onSubmitSuccess?: () => void;
  /** Called after failed submit */
  onSubmitError?: (error: unknown) => void;

  // Unsaved changes
  /** Warn before leaving with unsaved changes */
  warnOnUnsavedChanges?: boolean;
  /** Custom navigation handler (default: router.push) */
  onNavigate?: (href: string) => void;

  // Auto-save
  /** Auto-save configuration */
  autoSave?: AutoSaveConfig;

  // Reset
  /** Reset handler */
  onReset?: () => void;

  // Error formatting
  /** Custom error formatter */
  formatError?: (fieldName: string, error: { message?: string; type?: string }) => string;
}

/**
 * Auto-save status
 */
export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Navigation guard state
 */
export interface NavigationGuardState {
  /** Is warning dialog open */
  isOpen: boolean;
  /** Pending navigation URL */
  pendingHref: string | null;
}

/**
 * useFormLogic return type
 */
export interface UseFormLogicReturn {
  // State
  /** Is form currently submitting */
  isSubmitting: boolean;
  /** Is form valid */
  isValid: boolean;
  /** Has form been modified */
  isDirty: boolean;
  /** Form has validation errors */
  hasErrors: boolean;
  /** Formatted error messages */
  errorMessages: Array<{ field: string; message: string }>;
  /** Auto-save status */
  autoSaveStatus: AutoSaveStatus;

  // Actions
  /** Submit the form */
  submit: () => Promise<void>;
  /** Reset the form */
  reset: () => void;
  /** Mark form as dirty */
  markDirty: () => void;
  /** Mark form as clean */
  markClean: () => void;

  // Navigation guard
  /** Navigation guard state */
  navigationGuard: NavigationGuardState;
  /** Navigate with unsaved changes check */
  handleNavigate: (href: string) => void;
  /** Confirm pending navigation */
  confirmNavigation: () => void;
  /** Cancel pending navigation */
  cancelNavigation: () => void;

  // Utilities
  /** Format a single error */
  formatError: (fieldName: string, error: { message?: string; type?: string }) => string;
}

// =============================================================================
// Defaults
// =============================================================================

const DEFAULT_AUTOSAVE_DEBOUNCE_MS = 2000;
const AUTOSAVE_SAVED_DISPLAY_MS = 2000;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Default error formatter - converts field names and error messages
 */
function defaultFormatError(
  fieldName: string,
  error: { message?: string; type?: string }
): string {
  // Convert camelCase to readable format
  const readableName = fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();

  const message = error?.message || 'Campo inválido';
  return `${readableName}: ${message}`;
}

// =============================================================================
// Hook
// =============================================================================

export function useFormLogic(
  options: UseFormLogicOptions = {}
): UseFormLogicReturn {
  const {
    formState,
    isSubmitting: isSubmittingProp,
    isValid: isValidProp,
    isDirty: isDirtyProp,
    onSubmit,
    onSubmitSuccess,
    onSubmitError,
    warnOnUnsavedChanges = false,
    onNavigate,
    autoSave,
    onReset,
    formatError: formatErrorProp,
  } = options;

  // =========================================================================
  // State
  // =========================================================================

  // Internal dirty state (for manual tracking)
  const [internalIsDirty, setInternalIsDirty] = useState(false);

  // Internal submitting state (for manual tracking)
  const [internalIsSubmitting, setInternalIsSubmitting] = useState(false);

  // Auto-save status
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');

  // Navigation guard state
  const [navigationGuard, setNavigationGuard] = useState<NavigationGuardState>({
    isOpen: false,
    pendingHref: null,
  });

  // =========================================================================
  // Resolved State (merge external + internal)
  // =========================================================================

  const isSubmitting = isSubmittingProp ?? formState?.isSubmitting ?? internalIsSubmitting;
  const isValid = isValidProp ?? formState?.isValid ?? true;
  const isDirty = isDirtyProp ?? formState?.isDirty ?? internalIsDirty;

  // Error handling
  const errors = formState?.errors;
  const hasErrors = !!errors && Object.keys(errors).length > 0;

  // Error formatter
  const formatError = formatErrorProp ?? defaultFormatError;

  // Formatted error messages
  const errorMessages = useMemo(() => {
    if (!errors) return [];
    return Object.entries(errors)
      .filter(([_, error]) => error)
      .map(([field, error]) => ({
        field,
        message: formatError(field, error),
      }));
  }, [errors, formatError]);

  // =========================================================================
  // Unsaved Changes Warning (beforeunload)
  // =========================================================================

  useEffect(() => {
    if (!warnOnUnsavedChanges || !isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [warnOnUnsavedChanges, isDirty]);

  // =========================================================================
  // Auto-save
  // =========================================================================

  useEffect(() => {
    if (!autoSave?.enabled || !isDirty) return;

    const debounceMs = autoSave.debounceMs ?? DEFAULT_AUTOSAVE_DEBOUNCE_MS;

    const timeoutId = setTimeout(async () => {
      setAutoSaveStatus('saving');
      try {
        await autoSave.onAutoSave();
        setAutoSaveStatus('saved');
        // Reset to idle after display time
        setTimeout(() => setAutoSaveStatus('idle'), AUTOSAVE_SAVED_DISPLAY_MS);
      } catch {
        setAutoSaveStatus('error');
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [autoSave, isDirty]);

  // =========================================================================
  // Actions
  // =========================================================================

  const submit = useCallback(async () => {
    if (!onSubmit) return;

    setInternalIsSubmitting(true);
    try {
      await onSubmit();
      setInternalIsDirty(false);
      onSubmitSuccess?.();
    } catch (error) {
      onSubmitError?.(error);
      throw error;
    } finally {
      setInternalIsSubmitting(false);
    }
  }, [onSubmit, onSubmitSuccess, onSubmitError]);

  const reset = useCallback(() => {
    setInternalIsDirty(false);
    setInternalIsSubmitting(false);
    setAutoSaveStatus('idle');
    onReset?.();
  }, [onReset]);

  const markDirty = useCallback(() => {
    setInternalIsDirty(true);
  }, []);

  const markClean = useCallback(() => {
    setInternalIsDirty(false);
  }, []);

  // =========================================================================
  // Navigation Guard
  // =========================================================================

  const handleNavigate = useCallback(
    (href: string) => {
      if (warnOnUnsavedChanges && isDirty) {
        setNavigationGuard({ isOpen: true, pendingHref: href });
      } else if (onNavigate) {
        onNavigate(href);
      }
    },
    [warnOnUnsavedChanges, isDirty, onNavigate]
  );

  const confirmNavigation = useCallback(() => {
    if (navigationGuard.pendingHref && onNavigate) {
      onNavigate(navigationGuard.pendingHref);
    }
    setNavigationGuard({ isOpen: false, pendingHref: null });
  }, [navigationGuard.pendingHref, onNavigate]);

  const cancelNavigation = useCallback(() => {
    setNavigationGuard({ isOpen: false, pendingHref: null });
  }, []);

  // =========================================================================
  // Return
  // =========================================================================

  return {
    // State
    isSubmitting,
    isValid,
    isDirty,
    hasErrors,
    errorMessages,
    autoSaveStatus,

    // Actions
    submit,
    reset,
    markDirty,
    markClean,

    // Navigation guard
    navigationGuard,
    handleNavigate,
    confirmNavigation,
    cancelNavigation,

    // Utilities
    formatError,
  };
}
