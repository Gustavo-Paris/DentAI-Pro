'use client';

/**
 * PageTreatmentTimeline - Vertical treatment history timeline
 *
 * Displays a vertical timeline of treatment history entries. Each entry
 * shows date, procedure name, tooth, status, and professional. Entries
 * are connected with a vertical line.
 *
 * @example
 * ```tsx
 * <PageTreatmentTimeline
 *   entries={[
 *     {
 *       id: '1',
 *       name: 'Root Canal',
 *       code: 'D3310',
 *       tooth: 14,
 *       status: 'completed',
 *       cost: { value: 1200, currency: 'BRL' },
 *       performedBy: 'Dr. Santos',
 *       performedDate: '2026-02-10',
 *       createdAt: '2026-01-15',
 *       updatedAt: '2026-02-10',
 *     },
 *   ]}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon, StatusBadge } from '@parisgroup-ai/pageshell/primitives';

import type { ProcedureInfo } from './types';
import type { TreatmentStatus } from '../shared';

// =============================================================================
// Types
// =============================================================================

export interface PageTreatmentTimelineProps {
  /** Procedure entries to display in the timeline */
  entries: ProcedureInfo[];
  /** Override status labels */
  statusLabels?: Partial<Record<TreatmentStatus, string>>;
  /** Override "Tooth" label */
  toothLabel?: string;
  /** Override empty state text */
  emptyText?: string;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const STATUS_VARIANT: Record<TreatmentStatus, 'muted' | 'warning' | 'accent' | 'destructive'> = {
  planned: 'muted',
  'in-progress': 'warning',
  completed: 'accent',
  cancelled: 'destructive',
};

const STATUS_LABEL: Record<TreatmentStatus, string> = {
  planned: tPageShell('domain.odonto.treatments.timeline.statusPlanned', 'Planned'),
  'in-progress': tPageShell('domain.odonto.treatments.timeline.statusInProgress', 'In Progress'),
  completed: tPageShell('domain.odonto.treatments.timeline.statusCompleted', 'Completed'),
  cancelled: tPageShell('domain.odonto.treatments.timeline.statusCancelled', 'Cancelled'),
};

const DOT_COLORS: Record<TreatmentStatus, string> = {
  planned: 'bg-muted-foreground',
  'in-progress': 'bg-warning',
  completed: 'bg-primary',
  cancelled: 'bg-destructive',
};

// =============================================================================
// Component
// =============================================================================

export function PageTreatmentTimeline({
  entries,
  statusLabels: statusLabelsOverride,
  toothLabel,
  emptyText,
  className,
}: PageTreatmentTimelineProps) {
  const resolvedStatusLabels = { ...STATUS_LABEL, ...statusLabelsOverride };
  const resolvedToothLabel = toothLabel ?? tPageShell('domain.odonto.treatments.timeline.tooth', 'Tooth');

  if (entries.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground text-center py-4', className)}>
        {emptyText ?? tPageShell('domain.odonto.treatments.timeline.empty', 'No treatment history')}
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {entries.map((entry, index) => {
        const isLast = index === entries.length - 1;

        return (
          <div key={entry.id} className="relative flex gap-4">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div className={cn('w-3 h-3 rounded-full border-2 border-card z-10', DOT_COLORS[entry.status])} />
              {!isLast && <div className="w-px flex-1 bg-border" />}
            </div>

            {/* Content */}
            <div className={cn('pb-6 min-w-0 flex-1', isLast && 'pb-0')}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="text-sm font-medium truncate">{entry.name}</h4>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                    {(entry.performedDate || entry.createdAt) && (
                      <span className="flex items-center gap-1">
                        <PageIcon name="calendar" className="w-3 h-3" />
                        {entry.performedDate || entry.createdAt}
                      </span>
                    )}
                    {entry.tooth && (
                      <span className="flex items-center gap-1">
                        <PageIcon name="hash" className="w-3 h-3" />
                        {resolvedToothLabel} {entry.tooth}
                      </span>
                    )}
                    {entry.performedBy && (
                      <span className="flex items-center gap-1">
                        <PageIcon name="user" className="w-3 h-3" />
                        {entry.performedBy}
                      </span>
                    )}
                  </div>
                </div>
                <StatusBadge
                  label={resolvedStatusLabels[entry.status]}
                  variant={STATUS_VARIANT[entry.status]}
                  size="sm"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
