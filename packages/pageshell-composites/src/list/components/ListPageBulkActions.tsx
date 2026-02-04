/**
 * ListPage Bulk Actions
 *
 * Bulk action bar for ListPage composite.
 *
 * @module list/components/ListPageBulkActions
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { resolveIcon } from '@pageshell/primitives';
import type { BulkActionsConfig, SelectionLabels } from '../../shared/types';
import { DEFAULT_LIST_PAGE_LABELS } from '../../shared/types';

// =============================================================================
// Types
// =============================================================================

export interface ListPageBulkActionsProps<TRow = Record<string, unknown>> {
  /** Bulk actions configuration */
  bulkActions: BulkActionsConfig<TRow>;
  /** Number of selected items */
  selectedCount: number;
  /** Selected rows data */
  selectedRows: TRow[];
  /** Callback to clear selection after action */
  onClearSelection: () => void;
  /** i18n labels for selection text */
  labels?: SelectionLabels;
}

// =============================================================================
// Component
// =============================================================================

export function ListPageBulkActions<TRow = Record<string, unknown>>({
  bulkActions,
  selectedCount,
  selectedRows,
  onClearSelection,
  labels,
}: ListPageBulkActionsProps<TRow>) {
  const selectionLabels = {
    ...DEFAULT_LIST_PAGE_LABELS.selection,
    ...labels,
  };

  if (selectedCount === 0 || Object.keys(bulkActions).length === 0) {
    return null;
  }

  const selectionText = selectedCount > 1
    ? selectionLabels.itemsSelected
    : selectionLabels.itemSelected;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
    >
      <span className="text-sm font-medium text-foreground">
        {selectedCount} {selectionText}
      </span>
      <div className="flex flex-wrap gap-2">
        {Object.entries(bulkActions).map(([key, action]) => {
          const isDestructive = action.variant === 'destructive';
          const BulkActionIcon = resolveIcon(action.icon);
          return (
            <button
              key={key}
              className={cn(
                'min-h-[36px] flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm touch-manipulation transition-colors',
                isDestructive
                  ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              )}
              onClick={async () => {
                if (action.mutation && action.getInputs) {
                  const inputs = action.getInputs(selectedRows);
                  for (const input of inputs) {
                    await action.mutation.mutateAsync(input);
                  }
                  onClearSelection();
                } else if (action.onClick) {
                  await action.onClick(selectedRows);
                  onClearSelection();
                }
              }}
            >
              {BulkActionIcon && <BulkActionIcon className="h-3.5 w-3.5" />}
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

ListPageBulkActions.displayName = 'ListPageBulkActions';
