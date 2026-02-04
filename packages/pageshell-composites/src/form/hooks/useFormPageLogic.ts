/**
 * useFormPageLogic Hook
 *
 * Extracted logic from FormPage for better separation of concerns.
 * Handles form state, submit workflow, navigation guard, and auto-save.
 *
 * @module form/hooks/useFormPageLogic
 * @see Code Quality Audit - Extracted from FormPage.tsx (580 lines)
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type FieldValues, type DefaultValues, type UseFormReturn } from 'react-hook-form';
import { interpolateHref, useAutoSave, type AutoSaveStatus } from '@pageshell/core';
import { useNavigationGuard } from '@pageshell/core/hooks/form/useNavigationGuard';
import type { MutationLike } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface AutoSaveConfig<TValues> {
  enabled: boolean;
  debounceMs?: number;
  onAutoSave?: (data: TValues) => Promise<void> | void;
}

export interface UseFormPageLogicOptions<TValues extends FieldValues = FieldValues> {
  // Form
  form?: UseFormReturn<TValues>;
  defaultValues?: DefaultValues<TValues>;
  queryData?: TValues;
  // Submit
  onSubmit?: (values: TValues) => Promise<unknown> | unknown;
  mutation?: MutationLike<TValues, unknown>;
  transformPayload?: (values: TValues) => unknown;
  onSuccess?: (result?: unknown) => void;
  successRedirect?: string;
  onError?: (error: Error) => void;
  // Navigation guard
  warnOnUnsavedChanges?: boolean;
  backHref?: string;
  cancelHref?: string;
  onCancel?: () => void;
  // Auto-save
  autoSave?: boolean | AutoSaveConfig<TValues>;
  // Error formatting
  formatError?: (fieldName: string, error: { message?: string; type?: string }) => string;
}

export interface UseFormPageLogicReturn<TValues extends FieldValues> {
  // Form
  form: UseFormReturn<TValues> | undefined;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  hasErrors: boolean;
  errorMessages: Array<{ field: string; message: string }>;
  // Handlers
  handleFormSubmit: () => Promise<void>;
  handleFieldChange: (name: string, value: unknown) => void;
  handleCancel: () => void;
  handleBack: () => void;
  handleNavigate: (href: string) => void;
  // Navigation guard
  showLeaveDialog: boolean;
  confirmNavigation: () => void;
  cancelNavigation: () => void;
  // Auto-save
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
}

// =============================================================================
// Hook
// =============================================================================

export function useFormPageLogic<TValues extends FieldValues = FieldValues>(
  options: UseFormPageLogicOptions<TValues>
): UseFormPageLogicReturn<TValues> {
  const {
    // Form
    form: externalForm,
    defaultValues,
    queryData,
    // Submit
    onSubmit,
    mutation,
    transformPayload,
    onSuccess,
    successRedirect,
    onError,
    // Navigation guard
    warnOnUnsavedChanges = true,
    backHref,
    cancelHref,
    onCancel,
    // Auto-save
    autoSave,
    // Error formatting
    formatError,
  } = options;

  const router = useRouter();

  // ===========================================================================
  // Form Setup
  // ===========================================================================

  const mergedDefaults = React.useMemo(() => {
    if (queryData) {
      return { ...defaultValues, ...queryData } as DefaultValues<TValues>;
    }
    return defaultValues;
  }, [defaultValues, queryData]);

  const internalForm = useForm<TValues>({
    defaultValues: mergedDefaults as DefaultValues<TValues>,
    mode: 'onChange',
  });

  // Reset form when query data changes
  React.useEffect(() => {
    if (queryData && !externalForm) {
      internalForm.reset(queryData);
    }
  }, [queryData, externalForm, internalForm]);

  const form: UseFormReturn<TValues> | undefined = externalForm ?? (mergedDefaults ? internalForm : undefined);

  // ===========================================================================
  // Form State
  // ===========================================================================

  const formState = form?.formState;
  const isSubmitting = mutation?.isPending ?? formState?.isSubmitting ?? false;
  const isValid = formState?.isValid ?? true;
  const isDirty = formState?.isDirty ?? false;

  const errorMessages = React.useMemo(() => {
    if (!formState?.errors) return [];

    const messages: Array<{ field: string; message: string }> = [];
    for (const [fieldName, error] of Object.entries(formState.errors)) {
      if (error && typeof error === 'object' && 'message' in error) {
        const message = formatError
          ? formatError(fieldName, error as { message?: string; type?: string })
          : (error as { message?: string }).message || `${fieldName} is invalid`;
        messages.push({ field: fieldName, message });
      }
    }
    return messages;
  }, [formState?.errors, formatError]);

  const hasErrors = errorMessages.length > 0;

  // ===========================================================================
  // Navigation Guard (using extracted hook)
  // ===========================================================================

  const navigationGuard = useNavigationGuard({
    enabled: warnOnUnsavedChanges,
    isDirty,
    router,
  });

  const {
    showLeaveDialog,
    handleNavigate,
    confirmNavigation,
    cancelNavigation,
  } = navigationGuard;

  // ===========================================================================
  // Auto-save (using extracted hook)
  // ===========================================================================

  const autoSaveConfig: AutoSaveConfig<TValues> = typeof autoSave === 'object'
    ? autoSave
    : { enabled: !!autoSave };

  const autoSaveHook = useAutoSave<TValues>({
    enabled: autoSaveConfig.enabled && !!form,
    isDirty,
    debounceMs: autoSaveConfig.debounceMs,
    onAutoSave: autoSaveConfig.onAutoSave ?? (async () => {}),
    getData: () => form?.getValues() as TValues,
  });

  const autoSaveStatus: AutoSaveStatus = autoSaveHook.status;

  // ===========================================================================
  // Handlers
  // ===========================================================================

  const handleFormSubmit = React.useCallback(async () => {
    if (!form) {
      if (onSubmit) {
        await onSubmit({} as TValues);
      }
      return;
    }

    await form.handleSubmit(async (data: TValues) => {
      try {
        // Transform payload for mutation (allows different shape than form data)
        const payload = transformPayload ? transformPayload(data) : data;

        if (mutation) {
          // Type assertion needed when transformPayload changes the shape
          const result = await mutation.mutateAsync(payload as TValues);
          onSuccess?.(result);
          if (successRedirect) {
            const resolvedHref = interpolateHref(successRedirect, result);
            router.push(resolvedHref);
          }
        } else if (onSubmit) {
          // onSubmit receives original form data (TValues), not transformed payload
          await onSubmit(data);
          onSuccess?.();
          if (successRedirect) {
            router.push(successRedirect);
          }
        }
      } catch (error) {
        onError?.(error as Error);
        throw error;
      }
    })();
  }, [form, mutation, onSubmit, onSuccess, onError, transformPayload, successRedirect, router]);

  const handleFieldChange = React.useCallback((name: string, value: unknown) => {
    if (form) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form.setValue(name as any, value as any, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [form]);

  const handleCancel = React.useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      const href = cancelHref ?? backHref;
      if (href) {
        handleNavigate(href);
      }
    }
  }, [onCancel, cancelHref, backHref, handleNavigate]);

  const handleBack = React.useCallback(() => {
    if (backHref) {
      handleNavigate(backHref);
    }
  }, [backHref, handleNavigate]);

  return {
    // Form
    form,
    isSubmitting,
    isValid,
    isDirty,
    hasErrors,
    errorMessages,
    // Handlers
    handleFormSubmit,
    handleFieldChange,
    handleCancel,
    handleBack,
    handleNavigate,
    // Navigation guard
    showLeaveDialog,
    confirmNavigation,
    cancelNavigation,
    // Auto-save
    autoSaveStatus,
  };
}
