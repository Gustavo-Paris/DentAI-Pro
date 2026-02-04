/**
 * PageConfirmDialog Component
 *
 * Theme-aware confirmation dialog that respects the current theme.
 * Uses AlertDialog under the hood.
 *
 * @module page-confirm-dialog
 */

'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { cn } from '@pageshell/core';
import { pageToast } from '@pageshell/core';
import { Button } from '../button';
import { resolveIcon } from '../icons';
import {
  getModalThemeStyles,
  MODAL_OVERLAY_CLASSES,
  MODAL_CONTENT_BASE_CLASSES,
  CONFIRM_DIALOG_SIZE_CLASSES,
  MobileDragIndicator,
} from '../modal';
import { getVariantConfig } from './constants';
import { useCountdown } from './hooks';
import type { PageConfirmDialogProps } from './types';

// =============================================================================
// Component
// =============================================================================

/**
 * PageConfirmDialog - Theme-aware confirmation dialog
 *
 * @example Basic destructive
 * ```tsx
 * <PageConfirmDialog
 *   open={showDeleteConfirm}
 *   onOpenChange={setShowDeleteConfirm}
 *   title="Excluir curso?"
 *   description="Esta acao nao pode ser desfeita."
 *   onConfirm={handleDelete}
 *   variant="destructive"
 * />
 * ```
 *
 * @example With mutation mode
 * ```tsx
 * <PageConfirmDialog
 *   open={showConfirm}
 *   onOpenChange={setShowConfirm}
 *   title="Excluir item?"
 *   mutation={deleteMutation}
 *   mutationInput={{ id: itemId }}
 *   successMessage="Item excluido!"
 *   variant="destructive"
 * />
 * ```
 */
export function PageConfirmDialog<TInput = unknown, TOutput = unknown>({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  isLoading: isLoadingProp = false,
  // Mutation mode props
  mutation,
  mutationInput,
  successMessage,
  errorMessage,
  onSuccess,
  // UI options
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loadingText = 'Processing...',
  variant = 'default',
  size = 'md',
  children,
  className,
  hideIcon = false,
  icon,
  requireConfirmation = false,
  confirmationText = 'Eu entendo e quero continuar',
  countdownSeconds = 0,
  showKeyboardHints = false,
  disableEscapeClose = false,
  testId,
}: PageConfirmDialogProps<TInput, TOutput>) {
  const variantConfig = getVariantConfig(variant);

  // Resolve icons
  const LoaderIcon = resolveIcon('loader');
  const CheckCircleIcon = resolveIcon('check-circle');
  const VariantIcon = resolveIcon(variantConfig.iconName);

  // Use mutation's isPending if available, otherwise use prop
  const isLoading = mutation?.isPending ?? isLoadingProp;

  // Confirmation checkbox state
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Countdown state
  const countdown = useCountdown(countdownSeconds, open);

  // Reset confirmation when dialog closes
  useEffect(() => {
    if (!open) {
      setIsConfirmed(false);
    }
  }, [open]);

  // Determine if confirm button should be disabled
  const isConfirmDisabled =
    isLoading ||
    (requireConfirmation && !isConfirmed) ||
    (countdownSeconds > 0 && countdown > 0);

  const handleCancel = useCallback(() => {
    onCancel?.();
    onOpenChange(false);
  }, [onCancel, onOpenChange]);

  const handleConfirm = useCallback(async () => {
    if (isConfirmDisabled) return;

    // Mutation mode: use mutation with automatic toast
    if (mutation && mutationInput !== undefined) {
      try {
        const result = await mutation.mutateAsync(mutationInput);
        if (successMessage) {
          pageToast.success(successMessage);
        }
        onOpenChange(false);
        onSuccess?.(result);
      } catch (error) {
        const message =
          errorMessage ||
          (error instanceof Error ? error.message : 'Ocorreu um erro');
        pageToast.error(message);
        // Don't close dialog on error
      }
      return;
    }

    // Manual mode: use onConfirm callback
    if (onConfirm) {
      try {
        await onConfirm();
        if (successMessage) {
          pageToast.success(successMessage);
          onOpenChange(false);
        }
      } catch (error) {
        if (successMessage) {
          const message =
            errorMessage ??
            (error instanceof Error ? error.message : 'Ocorreu um erro');
          pageToast.error(message);
        }
      }
    }
  }, [
    isConfirmDisabled,
    mutation,
    mutationInput,
    successMessage,
    errorMessage,
    onSuccess,
    onConfirm,
    onOpenChange,
  ]);

  // Handle escape key
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen && disableEscapeClose && !isLoading) {
        return;
      }
      onOpenChange(newOpen);
    },
    [disableEscapeClose, isLoading, onOpenChange]
  );

  // Keyboard shortcuts
  useEffect(() => {
    if (!open || !showKeyboardHints) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !isConfirmDisabled) {
        e.preventDefault();
        handleConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, showKeyboardHints, isConfirmDisabled, handleConfirm]);

  // Determine which icon to show
  const displayIcon =
    icon ||
    (VariantIcon && <VariantIcon className="h-5 w-5" aria-hidden="true" />);

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <AlertDialogPrimitive.Portal>
        {/* Overlay */}
        <AlertDialogPrimitive.Overlay className={MODAL_OVERLAY_CLASSES} />

        {/* Content */}
        <AlertDialogPrimitive.Content
          data-testid={testId}
          style={getModalThemeStyles()}
          className={cn(
            'themed-dialog',
            MODAL_CONTENT_BASE_CLASSES,
            CONFIRM_DIALOG_SIZE_CLASSES[size],
            className
          )}
        >
          {/* Mobile drag indicator */}
          <MobileDragIndicator />

          {/* Header with Icon */}
          <div className="px-5 pt-4 pb-2 sm:px-6 sm:pt-5">
            <div className="flex items-start gap-4">
              {/* Icon */}
              {!hideIcon && (
                <div
                  className={cn(
                    'flex-shrink-0 rounded-full p-2.5 transition-transform',
                    variantConfig.iconBg,
                    variantConfig.iconAnimation && variantConfig.iconAnimation
                  )}
                >
                  {displayIcon}
                </div>
              )}

              {/* Title and Description */}
              <div className="flex-1 min-w-0 pt-0.5">
                <AlertDialogPrimitive.Title className="text-lg font-semibold leading-tight text-foreground">
                  {title}
                </AlertDialogPrimitive.Title>
                {description && (
                  <AlertDialogPrimitive.Description className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </AlertDialogPrimitive.Description>
                )}
              </div>
            </div>
          </div>

          {/* Optional additional content */}
          {children && (
            <div className="px-5 py-2 sm:px-6 sm:pl-[4.5rem]">{children}</div>
          )}

          {/* Confirmation checkbox */}
          {requireConfirmation && (
            <div className="px-5 py-3 sm:px-6">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    checked={isConfirmed}
                    onChange={(e) => setIsConfirmed(e.target.checked)}
                    className={cn(
                      'peer h-5 w-5 rounded border-2 appearance-none cursor-pointer transition-all',
                      'border-muted-foreground/40 bg-transparent',
                      'checked:border-primary checked:bg-primary',
                      'hover:border-primary/60',
                      'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:ring-offset-popover'
                    )}
                  />
                  {CheckCircleIcon && (
                    <CheckCircleIcon
                      className={cn(
                        'absolute h-3 w-3 text-primary-foreground pointer-events-none transition-opacity',
                        isConfirmed ? 'opacity-100' : 'opacity-0'
                      )}
                      aria-hidden="true"
                    />
                  )}
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  {confirmationText}
                </span>
              </label>
            </div>
          )}

          {/* Footer */}
          <div className="px-5 py-4 sm:px-6 border-t border-border mt-2">
            {/* Keyboard hints */}
            {showKeyboardHints && (
              <div className="hidden sm:flex items-center gap-4 mb-3 text-xs text-muted-foreground">
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">
                    Esc
                  </kbd>{' '}
                  para cancelar
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">
                    Enter
                  </kbd>{' '}
                  para confirmar
                </span>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2">
              <AlertDialogPrimitive.Cancel asChild>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  {cancelText}
                </Button>
              </AlertDialogPrimitive.Cancel>
              <AlertDialogPrimitive.Action asChild>
                <Button
                  variant={variantConfig.buttonVariant}
                  onClick={handleConfirm}
                  disabled={isConfirmDisabled}
                  className={cn(
                    'w-full sm:w-auto transition-all',
                    isConfirmDisabled && 'opacity-50'
                  )}
                >
                  {isLoading ? (
                    <>
                      {LoaderIcon && (
                        <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {loadingText}
                    </>
                  ) : countdown > 0 ? (
                    <>
                      {confirmText} ({countdown}s)
                    </>
                  ) : (
                    confirmText
                  )}
                </Button>
              </AlertDialogPrimitive.Action>
            </div>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

PageConfirmDialog.displayName = 'PageConfirmDialog';
