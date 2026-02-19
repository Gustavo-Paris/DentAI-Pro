'use client';

/**
 * PageAppointmentTimeline
 *
 * Vertical timeline showing appointments for a day or period.
 * Each entry displays time, patient, procedure, and a status dot.
 *
 * @example
 * ```tsx
 * <PageAppointmentTimeline
 *   appointments={appointments}
 *   onAppointmentClick={(id) => router.push(`/appointments/${id}`)}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon, StatusBadge } from '@parisgroup-ai/pageshell/primitives';
import type { AppointmentStatus } from '../shared';
import type { AppointmentInfo } from './types';
import type { StatusVariant } from '@parisgroup-ai/pageshell/primitives';

// =============================================================================
// Helpers
// =============================================================================

const STATUS_DOT_COLOR: Record<AppointmentStatus, string> = {
  scheduled: 'bg-blue-400',
  confirmed: 'bg-emerald-400',
  'in-progress': 'bg-amber-400 animate-pulse',
  completed: 'bg-green-500',
  cancelled: 'bg-red-400',
  'no-show': 'bg-red-600',
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  'in-progress': 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  'no-show': 'No Show',
};

// =============================================================================
// Props
// =============================================================================

/** Props for {@link PageAppointmentTimeline} */
export interface PageAppointmentTimelineProps {
  /** List of appointments to display */
  appointments: AppointmentInfo[];
  /** Callback when an appointment entry is clicked */
  onAppointmentClick?: (appointmentId: string) => void;
  /** Stagger animation delay in ms */
  animationDelay?: number;
  /** Additional CSS classes */
  className?: string;
  /** i18n override: empty state message */
  i18nEmptyMessage?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Vertical timeline rendering a chronological list of appointments.
 */
export function PageAppointmentTimeline({
  appointments,
  onAppointmentClick,
  animationDelay,
  className,
  i18nEmptyMessage,
}: PageAppointmentTimelineProps) {
  const emptyMessage =
    i18nEmptyMessage ??
    tPageShell('domain.odonto.appointments.timeline.empty', 'No appointments for this period');

  if (appointments.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-muted-foreground', className)}>
        <PageIcon name="calendar-off" className="mb-2 h-8 w-8" aria-hidden />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  const sorted = [...appointments].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div
      className={cn('relative', className)}
      style={animationDelay ? { animationDelay: `${animationDelay}ms` } : undefined}
    >
      {/* Vertical line */}
      <div className="absolute left-3 top-0 bottom-0 w-px bg-border" aria-hidden />

      <ul className="space-y-4" role="list">
        {sorted.map((appt, index) => {
          const statusLabel = tPageShell(
            `domain.odonto.appointments.status.${appt.status}`,
            STATUS_LABEL[appt.status],
          );

          return (
            <li
              key={appt.id}
              className={cn(
                'relative flex items-start gap-4 pl-8',
                onAppointmentClick && 'cursor-pointer hover:bg-accent/5 rounded-md p-2 pl-8 -ml-1',
              )}
              onClick={onAppointmentClick ? () => onAppointmentClick(appt.id) : undefined}
              role={onAppointmentClick ? 'button' : undefined}
              tabIndex={onAppointmentClick ? 0 : undefined}
              onKeyDown={
                onAppointmentClick
                  ? (e) => { if (e.key === 'Enter' || e.key === ' ') onAppointmentClick(appt.id); }
                  : undefined
              }
            >
              {/* Status dot */}
              <span
                className={cn(
                  'absolute left-1.5 top-2 h-3 w-3 rounded-full ring-2 ring-background',
                  STATUS_DOT_COLOR[appt.status],
                )}
                title={statusLabel}
              />

              {/* Time */}
              <span className="min-w-[3.5rem] text-xs font-mono text-muted-foreground tabular-nums">
                {appt.startTime}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{appt.patientName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {appt.procedure} &middot; {appt.professionalName}
                </p>
                {appt.room && (
                  <p className="text-xs text-muted-foreground/70">{appt.room}</p>
                )}
              </div>

              {/* Duration */}
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {appt.startTime}&ndash;{appt.endTime}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
