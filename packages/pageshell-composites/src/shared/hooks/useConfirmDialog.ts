/**
 * useConfirmDialog Hook
 *
 * Reusable confirmation dialog state management.
 * Used by ListPage, CardListPage, and other composites.
 *
 * @module shared/hooks/useConfirmDialog
 */

'use client';

import * as React from 'react';

// =============================================================================
// Types
// =============================================================================

export interface ConfirmDialogConfig {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
}

export interface ConfirmDialogState {
  open: boolean;
  config: ConfirmDialogConfig | null;
  onConfirm: (() => void | Promise<void>) | null;
  isLoading: boolean;
}

export interface UseConfirmDialogReturn {
  /** Current dialog state */
  state: ConfirmDialogState;
  /** Open the confirm dialog */
  open: (config: ConfirmDialogConfig, onConfirm: () => void | Promise<void>) => void;
  /** Close the dialog */
  close: () => void;
  /** Handle confirm action */
  handleConfirm: () => Promise<void>;
}

// =============================================================================
// Hook
// =============================================================================

export function useConfirmDialog(): UseConfirmDialogReturn {
  const [state, setState] = React.useState<ConfirmDialogState>({
    open: false,
    config: null,
    onConfirm: null,
    isLoading: false,
  });

  const open = React.useCallback(
    (config: ConfirmDialogConfig, onConfirm: () => void | Promise<void>) => {
      setState({
        open: true,
        config,
        onConfirm,
        isLoading: false,
      });
    },
    []
  );

  const close = React.useCallback(() => {
    setState({
      open: false,
      config: null,
      onConfirm: null,
      isLoading: false,
    });
  }, []);

  const handleConfirm = React.useCallback(async () => {
    if (state.onConfirm) {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        await state.onConfirm();
      } finally {
        close();
      }
    }
  }, [state.onConfirm, close]);

  return {
    state,
    open,
    close,
    handleConfirm,
  };
}
