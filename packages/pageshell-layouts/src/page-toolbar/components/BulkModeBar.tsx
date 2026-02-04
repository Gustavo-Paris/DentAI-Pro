/**
 * BulkModeBar Component
 *
 * Bulk selection mode bar for PageToolbar.
 *
 * @package @pageshell/layouts
 */

'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { cn, useHandlerMap } from '@pageshell/core';
import { Button, resolveIcon } from '@pageshell/primitives';
import type { PageToolbarBulkAction, PageToolbarVariant } from '../types';

// =============================================================================
// Component
// =============================================================================

export function BulkModeBar({
  selectedCount,
  bulkActions,
  onBulkCancel,
  onSelectAll,
  totalItems,
  variant,
}: {
  selectedCount: number;
  bulkActions: PageToolbarBulkAction[];
  onBulkCancel?: () => void;
  onSelectAll?: () => void;
  totalItems?: number;
  variant: PageToolbarVariant;
}) {
  const [loadingAction, setLoadingAction] = useState<number | null>(null);

  // Memoized handler for bulk action button clicks - stable reference per action index
  const { getHandler: getBulkActionHandler } = useHandlerMap(
    async (index: number) => {
      const action = bulkActions[index];
      if (!action) return;
      setLoadingAction(index);
      try {
        await action.onAction();
      } finally {
        setLoadingAction(null);
      }
    }
  );

  const isCompact = variant === 'compact';

  return (
    <div className="flex items-center justify-between w-full gap-4">
      <div className="flex items-center gap-3">
        {/* Cancel button */}
        <Button
          variant="ghost"
          size={isCompact ? 'sm' : 'default'}
          onClick={onBulkCancel}
          className="gap-1.5"
        >
          <X className={cn(isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
          <span className="hidden sm:inline">Cancelar</span>
        </Button>

        {/* Selection count */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex items-center justify-center rounded-full bg-primary text-primary-foreground font-medium',
              isCompact ? 'h-5 w-5 text-xs' : 'h-6 w-6 text-sm'
            )}
          >
            {selectedCount}
          </div>
          <span className={cn('text-muted-foreground', isCompact ? 'text-xs' : 'text-sm')}>
            {selectedCount === 1 ? 'item selecionado' : 'itens selecionados'}
          </span>
        </div>

        {/* Select all */}
        {onSelectAll && totalItems && selectedCount < totalItems && (
          <Button
            variant="link"
            size="sm"
            onClick={onSelectAll}
            className="text-primary h-auto p-0"
          >
            Select all ({totalItems})
          </Button>
        )}
      </div>

      {/* Bulk actions */}
      <div className="flex items-center gap-2">
        {bulkActions.map((action, index) => {
          const Icon = resolveIcon(action.icon);
          const isLoading = loadingAction === index;

          return (
            <Button
              key={index}
              variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
              size={isCompact ? 'sm' : 'default'}
              onClick={getBulkActionHandler(index)}
              disabled={action.disabled || isLoading}
              className="gap-1.5"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                Icon && <Icon className={cn(isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
              )}
              <span className="hidden sm:inline">{action.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
