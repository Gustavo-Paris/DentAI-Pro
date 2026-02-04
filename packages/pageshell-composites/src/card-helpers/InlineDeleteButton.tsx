'use client';

import { useState, useCallback } from 'react';
import { Button, PageIcon, PageConfirmDialog } from '@pageshell/primitives';
import { cn } from '@pageshell/core';
import type { InlineDeleteButtonProps } from './types';

// Default labels (fallback when not using i18n)
const DEFAULT_LABELS = {
  delete: 'Delete',
  cancel: 'Cancel',
  deleting: 'Deleting...',
  confirmDescription: 'Are you sure you want to delete "{name}"?',
};

/**
 * InlineDeleteButton
 *
 * Delete button with built-in confirmation dialog.
 * Combines the trigger button and PageConfirmDialog in one component.
 *
 * @example Basic usage
 * ```tsx
 * <InlineDeleteButton
 *   entityId={item.id}
 *   entityName={item.name}
 *   dialogTitle="Delete Item"
 *   onDelete={handleDelete}
 *   isDeleting={isDeleting}
 * />
 * ```
 *
 * @example Icon-only button
 * ```tsx
 * <InlineDeleteButton
 *   entityId={item.id}
 *   entityName={item.name}
 *   dialogTitle="Delete Item"
 *   onDelete={handleDelete}
 *   size="icon"
 *   showLabel={false}
 * />
 * ```
 *
 * @example With i18n labels
 * ```tsx
 * <InlineDeleteButton
 *   entityId={item.id}
 *   entityName={item.name}
 *   dialogTitle={t('deleteTitle')}
 *   dialogDescription={t('deleteDescription', { name: item.name })}
 *   onDelete={handleDelete}
 *   labels={{
 *     delete: t('delete'),
 *     cancel: t('cancel'),
 *     deleting: t('deleting'),
 *   }}
 * />
 * ```
 */
export function InlineDeleteButton({
  entityId,
  entityName,
  dialogTitle,
  dialogDescription,
  onDelete,
  isDeleting = false,
  disabled = false,
  variant = 'outline',
  size = 'sm',
  showLabel = true,
  labels = {},
  className,
}: InlineDeleteButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const mergedLabels = {
    ...DEFAULT_LABELS,
    ...labels,
  };

  const description =
    dialogDescription ??
    mergedLabels.confirmDescription?.replace('{name}', entityName) ??
    `Are you sure you want to delete "${entityName}"?`;

  const handleConfirmDelete = useCallback(() => {
    onDelete(entityId);
    setConfirmOpen(false);
  }, [entityId, onDelete]);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        disabled={disabled || isDeleting}
        onClick={() => setConfirmOpen(true)}
        className={cn(
          'gap-1 text-destructive hover:text-destructive',
          className
        )}
      >
        {isDeleting ? (
          <PageIcon name="loader" className="h-4 w-4 animate-spin" />
        ) : (
          <PageIcon name="trash" className="h-4 w-4" />
        )}
        {showLabel && size !== 'icon' && mergedLabels.delete}
      </Button>

      <PageConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={dialogTitle}
        description={description}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        confirmText={mergedLabels.delete}
        cancelText={mergedLabels.cancel}
        loadingText={mergedLabels.deleting}
        variant="destructive"
      />
    </>
  );
}
