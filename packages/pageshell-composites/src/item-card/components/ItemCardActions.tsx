/**
 * ItemCardActions Component
 *
 * Dropdown menu for card actions.
 *
 * @module item-card/components/ItemCardActions
 */

'use client';

import * as React from 'react';
import { useState } from 'react';
import { cn } from '@pageshell/core';
import { Button, PageIcon } from '@pageshell/primitives';
import type { ItemCardActionsProps } from '../types';

export function ItemCardActions({ menuActions, className }: ItemCardActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <PageIcon name="more-vertical" className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
          <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-lg shadow-lg z-20">
            {menuActions.map((action, i) => (
              <button
                key={i}
                type="button"
                disabled={action.disabled}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  action.onClick();
                  setIsOpen(false);
                }}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors',
                  action.destructive
                    ? 'text-destructive hover:bg-destructive/10'
                    : 'text-foreground hover:bg-muted',
                  action.disabled && 'opacity-50 cursor-not-allowed',
                  i === 0 && 'rounded-t-lg',
                  i === menuActions.length - 1 && 'rounded-b-lg'
                )}
              >
                {action.icon && <PageIcon name={action.icon} className="h-4 w-4" />}
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

ItemCardActions.displayName = 'ItemCardActions';
