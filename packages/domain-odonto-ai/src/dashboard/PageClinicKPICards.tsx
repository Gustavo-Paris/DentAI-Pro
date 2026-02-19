'use client';

/**
 * PageClinicKPICards - KPI stat cards grid
 *
 * Displays a responsive grid of key performance indicator cards with
 * icon, label, current value, and optional change indicator (up/down
 * arrow with percentage).
 *
 * @example
 * ```tsx
 * <PageClinicKPICards
 *   items={[
 *     { label: 'Patients today', value: 12, change: 8, changeLabel: 'vs last week', icon: 'users' },
 *     { label: 'Revenue', value: 'R$ 4.500', change: -3, icon: 'dollar-sign' },
 *   ]}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon } from '@parisgroup-ai/pageshell/primitives';

import type { KPICardData } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PageClinicKPICardsProps {
  /** Array of KPI card data to display */
  items: KPICardData[];
  /** Number of columns in the grid (2-4) */
  columns?: 2 | 3 | 4;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const COLUMN_CLASSES: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

// =============================================================================
// Component
// =============================================================================

export function PageClinicKPICards({
  items,
  columns = 4,
  className,
}: PageClinicKPICardsProps) {
  return (
    <div
      className={cn('grid gap-4', COLUMN_CLASSES[columns], className)}
      role="list"
      aria-label={tPageShell('domain.odonto.dashboard.kpi.ariaLabel', 'Key performance indicators')}
    >
      {items.map((item, index) => (
        <div
          key={index}
          role="listitem"
          className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {item.label}
            </span>
            {item.icon && (
              <PageIcon name={item.icon} className="w-4 h-4 text-muted-foreground" />
            )}
          </div>

          <div className="text-2xl font-bold text-foreground">{item.value}</div>

          {item.change !== undefined && (
            <div className="flex items-center gap-1 text-xs">
              <PageIcon
                name={item.change >= 0 ? 'trending-up' : 'trending-down'}
                className={cn(
                  'w-3 h-3',
                  item.change >= 0 ? 'text-emerald-500' : 'text-red-500',
                )}
              />
              <span
                className={cn(
                  'font-medium',
                  item.change >= 0 ? 'text-emerald-500' : 'text-red-500',
                )}
              >
                {item.change >= 0 ? '+' : ''}
                {item.change}%
              </span>
              {item.changeLabel && (
                <span className="text-muted-foreground">{item.changeLabel}</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
