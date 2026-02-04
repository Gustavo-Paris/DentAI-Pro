/**
 * ListPage Confirm Dialog (Unified)
 *
 * Confirmation dialog for row/bulk/card actions.
 * Supports both simple config and dynamic content.
 *
 * @module list/components/shared/ListPageConfirmDialog
 */

'use client';

import * as React from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

/**
 * Confirm dialog configuration
 */
export interface ConfirmDialogConfig {
  /** Dialog title (required) */
  title: string;
  /** Dialog description */
  description?: string;
  /** Custom body content */
  body?: React.ReactNode;
  /** Confirm button text */
  confirmLabel?: string;
  /** Cancel button text */
  cancelLabel?: string;
  /** Loading button text */
  loadingLabel?: string;
  /** Button variant */
  variant?: 'default' | 'destructive';
}

/**
 * Confirm dialog state
 */
export interface ConfirmDialogState {
  /** Whether dialog is open */
  open: boolean;
  /** Current config */
  config: ConfirmDialogConfig | null;
  /** Whether action is loading */
  isLoading: boolean;
}

export interface ListPageConfirmDialogProps {
  /** Dialog state */
  state: ConfirmDialogState;
  /** Close handler */
  onClose: () => void;
  /** Confirm handler */
  onConfirm: () => void | Promise<void>;
}

// =============================================================================
// Component
// =============================================================================

export const ListPageConfirmDialog = React.memo(function ListPageConfirmDialog({
  state,
  onClose,
  onConfirm,
}: ListPageConfirmDialogProps) {
  const { open, config, isLoading } = state;

  // Handle dialog open/close
  const handleOpenChange = React.useCallback(
    (isOpen: boolean) => {
      if (!isOpen && !isLoading) {
        onClose();
      }
    },
    [isLoading, onClose]
  );

  // Don't render if no config
  if (!config) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          {config.description && (
            <DialogDescription>{config.description}</DialogDescription>
          )}
        </DialogHeader>

        {/* Custom body content */}
        {config.body && <div className="py-4">{config.body}</div>}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {config.cancelLabel ?? 'Cancel'}
          </Button>
          <Button
            variant={config.variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading
              ? (config.loadingLabel ?? 'Processing...')
              : (config.confirmLabel ?? 'Confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

ListPageConfirmDialog.displayName = 'ListPageConfirmDialog';
