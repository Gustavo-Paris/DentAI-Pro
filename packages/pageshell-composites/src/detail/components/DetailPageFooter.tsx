/**
 * DetailPageFooter Component
 *
 * Footer actions for DetailPage composite.
 * Supports sticky footer on mobile.
 *
 * @module detail/components/DetailPageFooter
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { Button, resolveIcon } from '@pageshell/primitives';
import type { FooterActionConfig } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface DetailPageFooterProps<T = unknown> {
  /** Visible footer actions (already filtered by showWhen) */
  actions: FooterActionConfig<T>[];
  /** Make footer sticky on mobile */
  sticky?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function DetailPageFooter<T = unknown>({
  actions,
  sticky = false,
}: DetailPageFooterProps<T>) {
  if (actions.length === 0) return null;

  const footerContent = (
    <div
      className={cn(
        'flex gap-3 pt-4 border-t border-border mt-6',
        'flex-col sm:flex-row',
        sticky && [
          'fixed bottom-0 left-0 right-0 z-40',
          'bg-background/95 backdrop-blur-sm',
          'px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]',
          'border-t shadow-md',
          'sm:static sm:z-auto sm:bg-transparent sm:backdrop-blur-none',
          'sm:px-0 sm:pb-0 sm:shadow-none',
        ]
      )}
    >
      {actions.map((action, index) => {
        const Icon = action.icon ? resolveIcon(action.icon) : null;
        return (
          <Button
            key={index}
            variant={action.variant ?? 'outline'}
            size="default"
            className="h-11 flex-1 sm:flex-none"
            onClick={action.onClick}
            disabled={action.disabled || action.isLoading}
            leftIcon={Icon ? <Icon className="size-4" /> : undefined}
          >
            {action.isLoading ? 'Please wait...' : action.label}
          </Button>
        );
      })}
    </div>
  );

  // When sticky, add spacer for mobile
  if (sticky) {
    return (
      <>
        <div className="h-52 sm:hidden" aria-hidden="true" />
        {footerContent}
      </>
    );
  }

  return footerContent;
}

DetailPageFooter.displayName = 'DetailPageFooter';
