/**
 * DashboardQuickActions Component
 *
 * Quick action buttons for DashboardPage composite.
 *
 * @module dashboard/components/DashboardQuickActions
 */

'use client';

import * as React from 'react';
import { Link } from 'react-router-dom';
import { Button, resolveIcon } from '@pageshell/primitives';
import type { QuickActionConfig } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface DashboardQuickActionsProps {
  /** Quick actions configuration */
  actions: QuickActionConfig[];
}

// =============================================================================
// Component
// =============================================================================

export function DashboardQuickActions({ actions }: DashboardQuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action, index) => {
        const ActionIcon = resolveIcon(action.icon);
        const buttonContent = (
          <Button
            key={index}
            variant={action.featured ? 'default' : (action.variant || 'outline')}
            size={action.featured ? 'default' : 'sm'}
            onClick={action.onClick}
            className={action.featured ? 'font-semibold' : undefined}
          >
            {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
            {action.label}
          </Button>
        );

        if (action.href) {
          return (
            <Link key={index} to={action.href}>
              {buttonContent}
            </Link>
          );
        }

        return buttonContent;
      })}
    </div>
  );
}

DashboardQuickActions.displayName = 'DashboardQuickActions';
