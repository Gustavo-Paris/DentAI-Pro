/**
 * DetailPageQuickActions Component
 *
 * Quick action buttons for DetailPage composite.
 *
 * @module detail/components/DetailPageQuickActions
 */

'use client';

import * as React from 'react';
import { Button, resolveIcon } from '@pageshell/primitives';
import type { QuickActionConfig } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface DetailPageQuickActionsProps {
  /** Quick actions configuration */
  actions: QuickActionConfig[];
}

// =============================================================================
// Component
// =============================================================================

export function DetailPageQuickActions({ actions }: DetailPageQuickActionsProps) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {actions.map((action, index) => {
        const Icon = action.icon ? resolveIcon(action.icon) : null;
        const variant = action.variant ?? 'outline';

        if (action.href) {
          return (
            <Button key={index} variant={variant} size="sm" asChild>
              <a href={action.href}>
                {Icon && <Icon className="h-4 w-4 mr-2" />}
                {action.label}
              </a>
            </Button>
          );
        }

        return (
          <Button
            key={index}
            variant={variant}
            size="sm"
            onClick={action.onClick}
            leftIcon={Icon ? <Icon className="h-4 w-4" /> : undefined}
          >
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}

DetailPageQuickActions.displayName = 'DetailPageQuickActions';
