/**
 * CardActionsMenu Component
 *
 * Dropdown menu for card actions (edit, delete, etc.)
 * Extracted from ListPageCard for better organization.
 *
 * @module list/components/card/CardActionsMenu
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { cn, interpolateHref } from '@pageshell/core';
import {
  resolveIcon,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Button,
} from '@pageshell/primitives';
import { MoreVertical } from 'lucide-react';
import type { CardActionsConfig, CardActionConfirm } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface CardActionsMenuProps<TRow = Record<string, unknown>> {
  /** Row data */
  item: TRow;
  /** Actions configuration */
  actions: CardActionsConfig<TRow>;
  /** Open confirmation dialog */
  onConfirm?: (config: CardActionConfirm<TRow>, action: () => Promise<void>, item: TRow) => void;
  /** Refetch after mutation */
  refetch?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function CardActionsMenu<TRow = Record<string, unknown>>({
  item,
  actions,
  onConfirm,
  refetch,
}: CardActionsMenuProps<TRow>) {
  const router = useRouter();

  return (
    <div className="absolute top-2 right-2 z-20">
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {Object.entries(actions).map(([key, action], idx, arr) => {
            // Check showWhen condition
            if (action.showWhen && !action.showWhen(item)) return null;

            const isDisabled = action.disabledWhen?.(item) ?? false;
            const isDestructive = action.variant === 'destructive';
            const ActionIcon = action.icon ? resolveIcon(action.icon) : null;

            // Separator before destructive
            const prevAction = idx > 0 ? arr[idx - 1]?.[1] : null;
            const showSeparator = isDestructive && idx > 0 && prevAction?.variant !== 'destructive';

            const handleAction = async (e: React.MouseEvent) => {
              e.stopPropagation();

              // Handle href navigation
              if (action.href) {
                const url = typeof action.href === 'function'
                  ? action.href(item)
                  : interpolateHref(action.href, item as Record<string, unknown>);
                router.push(url);
                return;
              }

              const executeAction = async () => {
                if (action.mutation && action.mutationInput) {
                  const input = action.mutationInput(item);
                  await action.mutation.mutateAsync(input);
                  refetch?.();
                } else if (action.onClick) {
                  action.onClick(item);
                }
              };

              if (action.confirm && onConfirm) {
                const confirmConfig = typeof action.confirm === 'boolean'
                  ? { title: `Confirmar ${action.label}?` }
                  : action.confirm;
                onConfirm(confirmConfig, executeAction, item);
              } else {
                await executeAction();
              }
            };

            return (
              <React.Fragment key={key}>
                {showSeparator && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  disabled={isDisabled}
                  className={cn(isDestructive && 'text-destructive focus:text-destructive')}
                  onClick={handleAction}
                >
                  {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
                  {action.label}
                </DropdownMenuItem>
              </React.Fragment>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

CardActionsMenu.displayName = 'CardActionsMenu';
