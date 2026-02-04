'use client';

import { useState } from 'react';
import { Button, PageIcon } from '@pageshell/primitives';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import type { CardActionButtonsProps } from './types';

// Default labels (fallback when not using i18n)
const DEFAULT_LABELS = {
  edit: 'Edit',
  delete: 'Delete',
  cancel: 'Cancel',
  deleting: 'Deleting...',
  confirmTitle: 'Confirm Delete',
  confirmDescription: 'Are you sure you want to delete "{name}"?',
};

/**
 * CardActionButtons
 *
 * Common Edit/Delete button pair for CRUD cards.
 * Provides consistent action button layout with delete confirmation.
 *
 * @example Basic usage
 * ```tsx
 * <CardActionButtons
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   entityName={item.name}
 *   isDeleting={isDeleting}
 * />
 * ```
 *
 * @example With i18n labels
 * ```tsx
 * <CardActionButtons
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   entityName={item.name}
 *   deleteDialogTitle={t('deleteTitle')}
 *   labels={{
 *     edit: t('edit'),
 *     delete: t('delete'),
 *     cancel: t('cancel'),
 *     deleting: t('deleting'),
 *     confirmDescription: t('deleteConfirmDescription', { name: item.name }),
 *   }}
 * />
 * ```
 *
 * @example Ghost buttons
 * ```tsx
 * <CardActionButtons
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   entityName={item.name}
 *   editVariant="ghost"
 *   deleteVariant="ghost"
 * />
 * ```
 */
export function CardActionButtons({
  onEdit,
  onDelete,
  entityName,
  deleteDialogTitle,
  isEditDisabled = false,
  isDeleteDisabled = false,
  isDeleting = false,
  editVariant = 'outline',
  deleteVariant = 'outline',
  labels = {},
}: CardActionButtonsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const mergedLabels = {
    ...DEFAULT_LABELS,
    ...labels,
  };

  const description =
    mergedLabels.confirmDescription?.replace('{name}', entityName) ??
    `Are you sure you want to delete "${entityName}"?`;

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant={editVariant}
          size="sm"
          onClick={onEdit}
          disabled={isEditDisabled}
          className="gap-1"
        >
          <PageIcon name="edit" className="h-4 w-4" />
          {mergedLabels.edit}
        </Button>
        <Button
          variant={deleteVariant}
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          disabled={isDeleteDisabled || isDeleting}
          className="gap-1 text-destructive hover:text-destructive"
        >
          <PageIcon name="trash" className="h-4 w-4" />
          {mergedLabels.delete}
        </Button>
      </div>

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={deleteDialogTitle ?? mergedLabels.confirmTitle}
        description={description}
        onConfirm={onDelete}
        isDeleting={isDeleting}
        confirmText={mergedLabels.delete}
        cancelText={mergedLabels.cancel}
        loadingText={mergedLabels.deleting}
      />
    </>
  );
}
