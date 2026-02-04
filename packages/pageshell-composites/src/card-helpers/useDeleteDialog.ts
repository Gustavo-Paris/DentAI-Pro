'use client';

import { useState, useCallback } from 'react';
import type { UseDeleteDialogReturn } from './types';

/**
 * useDeleteDialog
 *
 * Hook for managing delete dialog state.
 * Provides consistent state management for delete confirmations.
 *
 * @example Basic usage
 * ```tsx
 * const deleteDialog = useDeleteDialog();
 *
 * return (
 *   <>
 *     <Button onClick={deleteDialog.open}>Delete</Button>
 *     <DeleteConfirmDialog
 *       open={deleteDialog.isOpen}
 *       onOpenChange={deleteDialog.setOpen}
 *       ...
 *     />
 *   </>
 * );
 * ```
 */
export function useDeleteDialog(): UseDeleteDialogReturn {
  const [showDialog, setShowDialog] = useState(false);

  const openDialog = useCallback(() => setShowDialog(true), []);
  const closeDialog = useCallback(() => setShowDialog(false), []);

  return {
    isOpen: showDialog,
    open: openDialog,
    close: closeDialog,
    setOpen: setShowDialog,
  };
}
