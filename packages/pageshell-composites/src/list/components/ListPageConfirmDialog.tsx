/**
 * ListPage Confirm Dialog
 *
 * Extracted confirmation dialog for row/bulk actions.
 *
 * @module list/components/ListPageConfirmDialog
 */

'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@pageshell/primitives';
import type { ConfirmDialogState } from '../../shared/hooks';

// Re-export shared types for backwards compatibility
export type { ConfirmDialogConfig, ConfirmDialogState } from '../../shared/hooks';

// =============================================================================
// Types
// =============================================================================

export interface ListPageConfirmDialogProps {
  state: ConfirmDialogState;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

// =============================================================================
// Component
// =============================================================================

export function ListPageConfirmDialog({
  state,
  onClose,
  onConfirm,
}: ListPageConfirmDialogProps) {
  return (
    <Dialog
      open={state.open}
      onOpenChange={(open) => {
        if (!open && !state.isLoading) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{state.config?.title || 'Confirm Action'}</DialogTitle>
          {state.config?.description && (
            <DialogDescription>{state.config.description}</DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={state.isLoading}
          >
            {state.config?.cancelLabel || 'Cancel'}
          </Button>
          <Button
            variant={state.config?.variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={state.isLoading}
          >
            {state.isLoading ? 'Processing...' : state.config?.confirmLabel || 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

ListPageConfirmDialog.displayName = 'ListPageConfirmDialog';

// Re-export shared hook for backwards compatibility
export { useConfirmDialog } from '../../shared/hooks';
