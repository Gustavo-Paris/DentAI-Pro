/**
 * PageConfirmDialog Types
 *
 * @module page-confirm-dialog
 */

import type { ReactNode } from 'react';

// =============================================================================
// Theme & Variant Types
// =============================================================================

export type PageConfirmDialogTheme = 'admin' | 'creator' | 'student';

export type PageConfirmDialogVariant =
  | 'default'
  | 'destructive'
  | 'warning'
  | 'success'
  | 'danger'; // deprecated, use destructive

// =============================================================================
// Mutation Type
// =============================================================================

/**
 * Mutation result type (compatible with tRPC useMutation)
 */
export interface ConfirmDialogMutation<TInput = unknown, TOutput = unknown> {
  mutateAsync: (input: TInput) => Promise<TOutput>;
  isPending: boolean;
}

// =============================================================================
// Component Props
// =============================================================================

export interface PageConfirmDialogProps<TInput = unknown, TOutput = unknown> {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Dialog description */
  description?: string;
  /** Confirm action handler (manual mode) */
  onConfirm?: () => void | Promise<void>;
  /** Cancel action handler */
  onCancel?: () => void;
  /** Whether the confirm action is loading (manual mode) */
  isLoading?: boolean;

  // === Mutation Mode ===
  /** tRPC mutation - handles loading, success, and error automatically */
  mutation?: ConfirmDialogMutation<TInput, TOutput>;
  /** Input to pass to mutation.mutateAsync() */
  mutationInput?: TInput;
  /** Success message for toast */
  successMessage?: string;
  /** Error message for toast */
  errorMessage?: string;
  /** Callback after successful mutation */
  onSuccess?: (data: TOutput) => void;

  // === UI Options ===
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Loading text */
  loadingText?: string;
  /** Visual variant */
  variant?: PageConfirmDialogVariant;
  /** Override theme */
  theme?: PageConfirmDialogTheme;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg';
  /** Additional content between description and buttons */
  children?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Hide the icon */
  hideIcon?: boolean;
  /** Custom icon (overrides variant icon) */
  icon?: ReactNode;
  /** Require checkbox confirmation before enabling confirm button */
  requireConfirmation?: boolean;
  /** Text for the confirmation checkbox */
  confirmationText?: string;
  /** Countdown in seconds before confirm button is enabled */
  countdownSeconds?: number;
  /** Show keyboard shortcut hints */
  showKeyboardHints?: boolean;
  /** Disable closing on Escape key */
  disableEscapeClose?: boolean;
  /** Test ID for automated testing */
  testId?: string;
}
