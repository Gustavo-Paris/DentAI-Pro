'use client';

/**
 * PageQuickActionsPanel - Quick actions grid
 *
 * Displays a responsive grid of quick action buttons with icons and labels.
 * Each action can navigate to a URL or trigger an onClick callback.
 *
 * @example
 * ```tsx
 * <PageQuickActionsPanel
 *   actions={[
 *     { id: '1', label: 'New Patient', icon: 'user-plus', href: '/patients/new' },
 *     { id: '2', label: 'New Appointment', icon: 'calendar-plus', onClick: () => openModal() },
 *   ]}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { Button, PageIcon } from '@parisgroup-ai/pageshell/primitives';

import type { QuickAction } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PageQuickActionsPanelProps {
  /** Array of quick actions to display */
  actions: QuickAction[];
  /** Number of columns in the grid (2-4) */
  columns?: 2 | 3 | 4;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const COLUMN_CLASSES: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
};

// =============================================================================
// Component
// =============================================================================

export function PageQuickActionsPanel({
  actions,
  columns = 4,
  className,
}: PageQuickActionsPanelProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <PageIcon name="zap" className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">
          {tPageShell('domain.odonto.dashboard.quickActions.title', 'Quick Actions')}
        </h3>
      </div>

      {/* Grid */}
      <div className={cn('grid gap-3 p-4', COLUMN_CLASSES[columns])}>
        {actions.map((action) => {
          const content = (
            <>
              <PageIcon name={action.icon} className="w-5 h-5" />
              <span className="text-xs font-medium">{action.label}</span>
            </>
          );

          if (action.href) {
            return (
              <a
                key={action.id}
                href={action.href}
                className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border p-4 text-muted-foreground transition-colors hover:bg-accent/5 hover:text-foreground hover:border-primary/30"
              >
                {content}
              </a>
            );
          }

          return (
            <Button
              key={action.id}
              variant="outline"
              className="flex flex-col items-center justify-center gap-2 h-auto py-4"
              onClick={action.onClick}
            >
              {content}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
