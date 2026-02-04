/**
 * useFormModalLogic Hook
 *
 * Extracted logic from FormModal for better separation of concerns.
 * Handles modal state, form management, and submit workflow.
 *
 * @module form/hooks/useFormModalLogic
 * @see Code Quality Audit - Extracted from FormModal.tsx (716 lines)
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type FieldValues, type DefaultValues, type UseFormReturn } from 'react-hook-form';
import { useBottomSheet } from '@pageshell/core';
import type { FormModalProps, MutationLike } from '../types';
import type { FormFieldConfig } from '../../shared/types';

// =============================================================================
// Types
// =============================================================================

export interface UseFormModalLogicOptions<
  TValues extends FieldValues = FieldValues,
  TPayload = TValues,
> {
  // Modal state
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Form
  form?: UseFormReturn<TValues>;
  defaultValues?: DefaultValues<TValues>;
  fields?: FormFieldConfig<TValues>[];
  // Query data for initial values
  queryData?: TValues;
  // Mutation
  mutation?: MutationLike<TPayload, unknown>;
  onSubmit?: (values: TValues) => Promise<unknown> | unknown;
  isSubmitting?: boolean;
  // Transform
  transformPayload?: (values: TValues) => TPayload;
  // Callbacks
  onSuccess?: (result: unknown) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
  onSuccessNavigate?: () => void;
  // Value change callback (for draft/auto-save integration)
  onValuesChange?: (values: TValues) => void;
  // Options
  closeOnSuccess?: boolean;
  resetOnClose?: boolean;
  redirectTo?: string;
  routeParams?: Record<string, string | undefined>;
  refreshOnSuccess?: boolean;
  redirectDelay?: number;
  successMessage?: string;
  // Bottom sheet
  sheetSnapPoints?: number[];
}

export interface UseFormModalLogicReturn<TValues extends FieldValues> {
  // State
  open: boolean;
  setOpen: (value: boolean) => void;
  isControlled: boolean;
  showSuccess: boolean;
  isSubmitting: boolean;
  isPending: boolean;
  // Form
  form: UseFormReturn<TValues>;
  hasExternalForm: boolean;
  values: TValues;
  errors: UseFormReturn<TValues>['formState']['errors'];
  // Handlers
  handleOpenChange: (newOpen: boolean) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleCancel: () => void;
  handleChange: (name: string, value: unknown) => void;
  handleTriggerOpen: () => void;
  handleTriggerKeyDown: (e: React.KeyboardEvent) => void;
  handleFooterSubmit: () => void;
  // Bottom sheet (for mobile)
  bottomSheet: ReturnType<typeof useBottomSheet>;
  // Labels
  resolvedSubmitLabel: string;
  resolvedCancelLabel: string;
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Interpolate URL with route params.
 */
function interpolateUrl(
  url: string,
  params?: Record<string, string | undefined>
): string {
  if (!params) return url;
  return url.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, key) => {
    const value = params[key];
    return value ?? `:${key}`;
  });
}

// =============================================================================
// Hook
// =============================================================================

export function useFormModalLogic<
  TValues extends FieldValues = FieldValues,
  TPayload = TValues,
>(
  options: UseFormModalLogicOptions<TValues, TPayload>,
  containerRef: React.RefObject<HTMLDivElement | null>
): UseFormModalLogicReturn<TValues> {
  const {
    // Modal state
    open: openProp,
    onOpenChange: onOpenChangeProp,
    // Form
    form: formProp,
    defaultValues,
    fields,
    queryData,
    // Mutation
    mutation,
    onSubmit,
    isSubmitting: isSubmittingProp,
    // Transform
    transformPayload,
    // Callbacks
    onSuccess,
    onError,
    onCancel,
    onSuccessNavigate,
    // Value change callback
    onValuesChange,
    // Options
    closeOnSuccess = true,
    resetOnClose = true,
    redirectTo,
    routeParams,
    refreshOnSuccess,
    redirectDelay = 0,
    successMessage,
    // Bottom sheet
    sheetSnapPoints,
  } = options;

  // Router for navigation
  const router = useRouter();

  // ===========================================================================
  // Internal State
  // ===========================================================================

  const [internalOpen, setInternalOpen] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [internalIsSubmitting, setInternalIsSubmitting] = React.useState(false);

  const isSubmitting = isSubmittingProp ?? internalIsSubmitting;

  // Mode detection
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (isControlled && onOpenChangeProp) {
        onOpenChangeProp(value);
      } else {
        setInternalOpen(value);
      }
    },
    [isControlled, onOpenChangeProp]
  );

  // Bottom sheet hook
  const bottomSheet = useBottomSheet({
    open,
    onOpenChange: setOpen,
    snapPoints: sheetSnapPoints ?? [75],
    closeOnSwipeDown: true,
  });

  // ===========================================================================
  // Form Setup
  // ===========================================================================

  const initialValues = React.useMemo<DefaultValues<TValues>>(
    () => (queryData || defaultValues || {}) as DefaultValues<TValues>,
    [queryData, defaultValues]
  );

  const internalForm = useForm<TValues>({
    defaultValues: initialValues,
  });

  const form = formProp ?? internalForm;
  const hasExternalForm = !!formProp;

  // ===========================================================================
  // Effects
  // ===========================================================================

  // Reset form when modal opens or query data changes
  React.useEffect(() => {
    if (open) {
      form.reset(initialValues);
      setShowSuccess(false);
    }
  }, [open, initialValues, form]);

  // Subscribe to form value changes for draft/auto-save integration
  React.useEffect(() => {
    if (!onValuesChange || !open) return;

    const subscription = form.watch((values) => {
      onValuesChange(values as TValues);
    });

    return () => subscription.unsubscribe();
  }, [form, onValuesChange, open]);

  // ===========================================================================
  // Handlers
  // ===========================================================================

  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (!newOpen && resetOnClose) {
        form.reset(initialValues);
        setShowSuccess(false);
        (mutation as MutationLike<TPayload, unknown>)?.reset?.();
      }
      setOpen(newOpen);
    },
    [resetOnClose, initialValues, mutation, setOpen, form]
  );

  const handleChange = React.useCallback(
    (name: string, value: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form.setValue(name as any, value as any, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [form]
  );

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const values = form.getValues();

      // Validation
      if (hasExternalForm) {
        const isValid = await form.trigger();
        if (!isValid) return;
      } else if (fields) {
        let hasErrors = false;
        for (const field of fields) {
          const value = values[field.name as keyof TValues];
          if (
            field.required &&
            (value === undefined || value === null || value === '')
          ) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            form.setError(field.name as any, {
              type: 'required',
              message: `${field.label} is required`,
            });
            hasErrors = true;
          }
        }
        if (hasErrors) return;
      }

      try {
        setInternalIsSubmitting(true);

        const payload = transformPayload
          ? transformPayload(values)
          : (values as unknown as TPayload);

        let result: unknown;
        if (mutation) {
          result = await mutation.mutateAsync(payload);
        } else if (onSubmit) {
          result = await onSubmit(values);
        }

        if (successMessage) {
          setShowSuccess(true);
        }

        if (redirectDelay > 0) {
          await new Promise((r) => setTimeout(r, redirectDelay));
        }

        onSuccessNavigate?.();

        if (refreshOnSuccess) {
          router.refresh();
        }

        if (redirectTo) {
          const url = interpolateUrl(redirectTo, routeParams);
          router.push(url);
        }

        if (closeOnSuccess) {
          handleOpenChange(false);
        }

        onSuccess?.(result);
      } catch (error) {
        onError?.(error as Error);
      } finally {
        setInternalIsSubmitting(false);
      }
    },
    [
      form,
      fields,
      hasExternalForm,
      transformPayload,
      mutation,
      onSubmit,
      successMessage,
      redirectDelay,
      onSuccessNavigate,
      refreshOnSuccess,
      redirectTo,
      routeParams,
      closeOnSuccess,
      handleOpenChange,
      onSuccess,
      onError,
      router,
    ]
  );

  const handleCancel = React.useCallback(() => {
    onCancel?.();
    handleOpenChange(false);
  }, [onCancel, handleOpenChange]);

  const handleTriggerOpen = React.useCallback(() => {
    setOpen(true);
  }, [setOpen]);

  const handleTriggerKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
    },
    [setOpen]
  );

  const handleFooterSubmit = React.useCallback(() => {
    // containerRef is INSIDE the form, so we need closest() to find the parent form
    // querySelector() would look for a form descendant, which doesn't exist
    const formEl = containerRef.current?.closest('form');
    if (formEl) {
      formEl.dispatchEvent(
        new Event('submit', { cancelable: true, bubbles: true })
      );
    }
  }, [containerRef]);

  // ===========================================================================
  // Computed Values
  // ===========================================================================

  const isPending = isSubmitting || !!mutation?.isPending;
  const values = form.watch();
  const errors = form.formState.errors;

  return {
    // State
    open,
    setOpen,
    isControlled,
    showSuccess,
    isSubmitting,
    isPending,
    // Form
    form,
    hasExternalForm,
    values,
    errors,
    // Handlers
    handleOpenChange,
    handleSubmit,
    handleCancel,
    handleChange,
    handleTriggerOpen,
    handleTriggerKeyDown,
    handleFooterSubmit,
    // Bottom sheet
    bottomSheet,
    // Labels (defaults, can be overridden in component)
    resolvedSubmitLabel: 'Save',
    resolvedCancelLabel: 'Cancel',
  };
}
