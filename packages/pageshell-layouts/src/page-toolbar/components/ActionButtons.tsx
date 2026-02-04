/**
 * ActionButtons Component
 *
 * Action buttons for PageToolbar.
 *
 * @package @pageshell/layouts
 */

'use client';

import { cn } from '@pageshell/core';
import { Button, resolveIcon } from '@pageshell/primitives';
import type { PageToolbarAction, PageToolbarVariant } from '../types';

// =============================================================================
// Component
// =============================================================================

export function ActionButtons({
  actions,
  variant,
}: {
  actions: PageToolbarAction[];
  variant: PageToolbarVariant;
}) {
  const isCompact = variant === 'compact';

  return (
    <div className="flex items-center gap-2">
      {actions.map((action, index) => {
        const Icon = resolveIcon(action.icon);
        const buttonVariant =
          action.variant === 'primary'
            ? 'default'
            : action.variant === 'destructive'
              ? 'destructive'
              : action.variant === 'ghost'
                ? 'ghost'
                : action.variant === 'secondary'
                  ? 'secondary'
                  : 'outline';

        return (
          <Button
            key={index}
            variant={buttonVariant}
            size={isCompact ? 'sm' : 'default'}
            onClick={action.onClick}
            disabled={action.disabled}
            className="gap-1.5"
          >
            {Icon && <Icon className={cn(isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />}
            {action.showLabel !== false && (
              <span className="hidden sm:inline">{action.label}</span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
