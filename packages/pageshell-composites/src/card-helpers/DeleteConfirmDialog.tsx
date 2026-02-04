'use client';

import { useCallback } from 'react';
import { PageConfirmDialog } from '@pageshell/primitives';
import type { DeleteConfirmDialogProps } from './types';

// Default labels (fallback when not using i18n)
const DEFAULT_LABELS = {
  confirm: 'Delete',
  cancel: 'Cancel',
  loading: 'Deleting...',
};

/**
 * DeleteConfirmDialog
 *
 * Reusable delete confirmation dialog wrapping PageConfirmDialog.
 * Used by ServiceCard, PackageCard, and other CRUD cards.
 *
 * @example Basic usage
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <DeleteConfirmDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Delete Item"
 *   description="Are you sure you want to delete this item?"
 *   onConfirm={handleDelete}
 *   isDeleting={isDeleting}
 * />
 * ```
 *
 * @example With custom labels
 * ```tsx
 * <DeleteConfirmDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title={t('deleteTitle')}
 *   description={t('deleteDescription')}
 *   onConfirm={handleDelete}
 *   confirmText={t('confirmDelete')}
 *   cancelText={t('cancel')}
 *   loadingText={t('deleting')}
 * />
 * ```
 */
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isDeleting = false,
  confirmText = DEFAULT_LABELS.confirm,
  cancelText = DEFAULT_LABELS.cancel,
  loadingText = DEFAULT_LABELS.loading,
}: DeleteConfirmDialogProps) {
  const handleConfirm = useCallback(() => {
    onConfirm();
    onOpenChange(false);
  }, [onConfirm, onOpenChange]);

  return (
    <PageConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      onConfirm={handleConfirm}
      isLoading={isDeleting}
      confirmText={confirmText}
      cancelText={cancelText}
      loadingText={loadingText}
      variant="destructive"
    />
  );
}
