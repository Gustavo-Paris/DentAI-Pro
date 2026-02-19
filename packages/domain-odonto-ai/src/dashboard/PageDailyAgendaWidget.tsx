'use client';

/**
 * PageDailyAgendaWidget - Compact daily agenda for dashboard
 *
 * Displays a compact list of daily appointments with time, patient name,
 * procedure, and status indicator. Shows up to maxItems entries with a
 * "view all" link when there are more.
 *
 * @example
 * ```tsx
 * <PageDailyAgendaWidget
 *   date="2026-02-18"
 *   items={[
 *     { id: '1', time: '09:00', patientName: 'Maria Silva', procedure: 'Cleaning', status: 'confirmed', professional: 'Dr. Santos' },
 *   ]}
 *   onViewAll={() => router.push('/appointments')}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon, StatusBadge } from '@parisgroup-ai/pageshell/primitives';

import type { AgendaWidgetItem } from './types';
import type { AppointmentStatus } from '../shared';

// =============================================================================
// Types
// =============================================================================

export interface PageDailyAgendaWidgetProps {
  /** Date to display (ISO format) */
  date: string;
  /** Agenda items for the day */
  items: AgendaWidgetItem[];
  /** Maximum number of items to show */
  maxItems?: number;
  /** Callback when "view all" is clicked */
  onViewAll?: () => void;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  scheduled: 'bg-blue-400',
  confirmed: 'bg-emerald-400',
  'in-progress': 'bg-amber-400',
  completed: 'bg-gray-400',
  cancelled: 'bg-red-400',
  'no-show': 'bg-red-300',
};

const STATUS_VARIANT: Record<AppointmentStatus, 'accent' | 'muted' | 'outline'> = {
  scheduled: 'muted',
  confirmed: 'accent',
  'in-progress': 'accent',
  completed: 'outline',
  cancelled: 'outline',
  'no-show': 'outline',
};

// =============================================================================
// Component
// =============================================================================

export function PageDailyAgendaWidget({
  date,
  items,
  maxItems = 6,
  onViewAll,
  className,
}: PageDailyAgendaWidgetProps) {
  const visibleItems = items.slice(0, maxItems);
  const hasMore = items.length > maxItems;

  return (
    <div className={cn('rounded-lg border border-border bg-card', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <PageIcon name="calendar" className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">
            {tPageShell('domain.odonto.dashboard.agenda.title', 'Daily Agenda')}
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>

      {/* Items */}
      {visibleItems.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          {tPageShell('domain.odonto.dashboard.agenda.empty', 'No appointments for today')}
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {visibleItems.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              {/* Time */}
              <span className="w-12 flex-shrink-0 text-xs font-mono font-medium text-muted-foreground">
                {item.time}
              </span>

              {/* Status dot */}
              <span
                className={cn('w-2 h-2 rounded-full flex-shrink-0', STATUS_COLOR[item.status])}
                aria-hidden="true"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.patientName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {item.procedure} &middot; {item.professional}
                </p>
              </div>

              {/* Status badge */}
              <StatusBadge
                variant={STATUS_VARIANT[item.status]}
                label={item.status}
              />
            </li>
          ))}
        </ul>
      )}

      {/* View all */}
      {hasMore && onViewAll && (
        <div className="border-t border-border px-4 py-2">
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-medium text-primary hover:underline"
          >
            {tPageShell('domain.odonto.dashboard.agenda.viewAll', 'View all appointments')}
            {' '}({items.length})
          </button>
        </div>
      )}
    </div>
  );
}
