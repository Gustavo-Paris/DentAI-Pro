/**
 * Card Actions Dropdown
 *
 * Actions dropdown menu for individual cards.
 *
 * @module card-list/components/CardActionsDropdown
 */

'use client';

import * as React from 'react';
import { cn, useHandlerMap } from '@pageshell/core';
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@pageshell/primitives';
import { MoreVertical } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface ResolvedCardAction {
  key: string;
  label: string;
  icon?: string;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}

export interface CardActionsDropdownProps {
  /** Resolved actions for the card */
  actions: ResolvedCardAction[];
}

// =============================================================================
// Component
// =============================================================================

export function CardActionsDropdown({ actions }: CardActionsDropdownProps) {
  // Memoized handler for action clicks - stable reference per action key
  const { getHandler: getActionHandler } = useHandlerMap(
    (key: string, event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const action = actions.find((a) => a.key === key);
      action?.onClick();
    }
  );

  if (actions.length === 0) return null;

  return (
    <div className="absolute top-2 right-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((action, idx) => {
            const isDestructive = action.variant === 'destructive';
            const prevAction = idx > 0 ? actions[idx - 1] : null;
            const showSeparator =
              isDestructive && prevAction?.variant !== 'destructive';

            return (
              <React.Fragment key={action.key}>
                {showSeparator && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  disabled={action.disabled || action.loading}
                  className={cn(
                    isDestructive && 'text-destructive focus:text-destructive'
                  )}
                  onClick={getActionHandler(action.key)}
                >
                  {action.loading ? 'Loading...' : action.label}
                </DropdownMenuItem>
              </React.Fragment>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

CardActionsDropdown.displayName = 'CardActionsDropdown';
