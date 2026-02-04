/**
 * useSectionedFormLogic Hook
 *
 * Handles form state, submission, and navigation guards for SectionedFormPage.
 *
 * @module sectioned-form/hooks/useSectionedFormLogic
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm, type FieldValues, type UseFormReturn, type DefaultValues } from 'react-hook-form';
import type { SectionedFormMutation } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface UseSectionedFormLogicOptions<TValues extends FieldValues, TData = unknown> {
  /** External form instance */
  form?: UseFormReturn<TValues>;
  /** Default values for declarative mode */
  defaultValues?: TValues;
  /** Query data to populate form */
  queryData?: TData;
  /** Map query data to form values */
  mapDataToValues?: (data: TData) => Partial<TValues>;
  /** Submit handler */
  onSubmit?: (data: TValues) => void | Promise<void>;
  /** Mutation for submission */
  mutation?: SectionedFormMutation<TValues>;
  /** Transform payload before submission */
  transformPayload?: (data: TValues) => unknown;
  /** Success callback */
  onSuccess?: () => void;
  /** Error callback */
  onError?: (error: unknown) => void;
  /** Format error message */
  formatError?: (error: unknown) => string;
  /** Warn on unsaved changes */
  warnOnUnsavedChanges?: boolean;
  /** Back href */
  backHref?: string;
  /** Cancel href */
  cancelHref?: string;
  /** Cancel callback */
  onCancel?: () => void;
}

export interface UseSectionedFormLogicResult<TValues extends FieldValues> {
  /** Form instance */
  form: UseFormReturn<TValues>;
  /** Whether form is submitting */
  isSubmitting: boolean;
  /** Whether form is valid */
  isValid: boolean;
  /** Whether form is dirty */
  isDirty: boolean;
  /** Whether form has errors */
  hasErrors: boolean;
  /** Error messages array */
  errorMessages: string[];
  /** Handle form submission */
  handleFormSubmit: () => Promise<void>;
  /** Handle field change */
  handleFieldChange: (name: string, value: unknown) => void;
  /** Handle cancel action */
  handleCancel: () => void;
  /** Handle back action */
  handleBack: () => void;
  /** Whether to show leave dialog */
  showLeaveDialog: boolean;
  /** Confirm navigation */
  confirmNavigation: () => void;
  /** Cancel navigation */
  cancelNavigation: () => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useSectionedFormLogic<TValues extends FieldValues, TData = unknown>(
  options: UseSectionedFormLogicOptions<TValues, TData>
): UseSectionedFormLogicResult<TValues> {
  const {
    form: externalForm,
    defaultValues,
    queryData,
    mapDataToValues,
    onSubmit,
    mutation,
    transformPayload,
    onSuccess,
    onError,
    formatError,
    warnOnUnsavedChanges = true,
    backHref,
    cancelHref,
    onCancel,
  } = options;

  // Internal form for declarative mode
  const internalForm = useForm<TValues>({
    defaultValues: defaultValues as DefaultValues<TValues>,
  });

  const form = externalForm || internalForm;
  const { formState, reset, setValue, handleSubmit } = form;
  const { isSubmitting, isValid, isDirty, errors } = formState;

  // Navigation guard state
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // Populate form from query data
  useEffect(() => {
    if (queryData && mapDataToValues) {
      const values = mapDataToValues(queryData);
      reset({ ...defaultValues, ...values } as TValues);
    } else if (queryData && !mapDataToValues) {
      // If no mapper, assume data matches form structure
      reset(queryData as unknown as TValues);
    }
  }, [queryData, mapDataToValues, reset, defaultValues]);

  // Extract error messages
  const errorMessages = Object.values(errors)
    .filter((error): error is { message: string } => !!error?.message)
    .map((error) => error.message);

  const hasErrors = errorMessages.length > 0;

  // Handle field change
  const handleFieldChange = useCallback(
    (name: string, value: unknown) => {
      // Use type assertion for react-hook-form Path compatibility
      setValue(name as never, value as never, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [setValue]
  );

  // Handle form submission
  const handleFormSubmit = useCallback(async () => {
    const submitHandler = async (data: TValues) => {
      try {
        const payload = transformPayload ? transformPayload(data) : data;

        if (mutation) {
          if (mutation.mutateAsync) {
            await mutation.mutateAsync(payload as TValues);
          } else {
            mutation.mutate(payload as TValues);
          }
        } else if (onSubmit) {
          await onSubmit(data);
        }

        onSuccess?.();
      } catch (error) {
        const message = formatError?.(error) ?? (error instanceof Error ? error.message : 'An error occurred');
        onError?.(error);
        throw new Error(message);
      }
    };

    await handleSubmit(submitHandler as Parameters<typeof handleSubmit>[0])();
  }, [handleSubmit, mutation, onSubmit, transformPayload, onSuccess, onError, formatError]);

  // Navigation with guard
  const navigateWithGuard = useCallback(
    (action: () => void) => {
      if (warnOnUnsavedChanges && isDirty) {
        setShowLeaveDialog(true);
        setPendingNavigation(() => action);
      } else {
        action();
      }
    },
    [warnOnUnsavedChanges, isDirty]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    const cancelAction = () => {
      if (onCancel) {
        onCancel();
      } else if (cancelHref || backHref) {
        // Navigation will be handled by the component
        window.history.back();
      }
    };
    navigateWithGuard(cancelAction);
  }, [onCancel, cancelHref, backHref, navigateWithGuard]);

  // Handle back
  const handleBack = useCallback(() => {
    navigateWithGuard(() => {
      window.history.back();
    });
  }, [navigateWithGuard]);

  // Confirm navigation
  const confirmNavigation = useCallback(() => {
    setShowLeaveDialog(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  }, [pendingNavigation]);

  // Cancel navigation
  const cancelNavigation = useCallback(() => {
    setShowLeaveDialog(false);
    setPendingNavigation(null);
  }, []);

  return {
    form: form as UseFormReturn<TValues>,
    isSubmitting: isSubmitting || mutation?.isPending || mutation?.isLoading || false,
    isValid,
    isDirty,
    hasErrors,
    errorMessages,
    handleFormSubmit,
    handleFieldChange,
    handleCancel,
    handleBack,
    showLeaveDialog,
    confirmNavigation,
    cancelNavigation,
  };
}
