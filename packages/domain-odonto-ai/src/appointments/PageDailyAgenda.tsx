'use client';

/**
 * PageDailyAgenda
 *
 * Full daily agenda with time slots. Shows occupied versus available slots,
 * and fires a callback when an empty slot is clicked for quick booking.
 *
 * @example
 * ```tsx
 * <PageDailyAgenda
 *   date="2026-02-18"
 *   appointments={todayAppointments}
 *   timeSlots={allSlots}
 *   onSlotClick={(time) => openBookingDialog(time)}
 *   onAppointmentClick={(id) => router.push(`/appointments/${id}`)}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { Button, PageIcon, StatusBadge } from '@parisgroup-ai/pageshell/primitives';
import type { AppointmentStatus } from '../shared';
import type { AppointmentInfo, TimeSlot } from './types';
import type { StatusVariant } from '@parisgroup-ai/pageshell/primitives';

// =============================================================================
// Helpers
// =============================================================================

const STATUS_VARIANT: Record<AppointmentStatus, StatusVariant> = {
  scheduled: 'info',
  confirmed: 'default',
  'in-progress': 'warning',
  completed: 'success',
  cancelled: 'destructive',
  'no-show': 'destructive',
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

/** Props for {@link PageDailyAgenda} */
export interface PageDailyAgendaProps {
  /** Date displayed in the header (YYYY-MM-DD) */
  date: string;
  /** Appointments for the day */
  appointments: AppointmentInfo[];
  /** All time slots for the day */
  timeSlots: TimeSlot[];
  /** Callback when an available slot is clicked */
  onSlotClick?: (time: string) => void;
  /** Callback when an occupied slot/appointment is clicked */
  onAppointmentClick?: (appointmentId: string) => void;
  /** Stagger animation delay in ms */
  animationDelay?: number;
  /** Additional CSS classes */
  className?: string;
  /** i18n override: available slot label */
  i18nAvailableLabel?: string;
  /** i18n override: header title */
  i18nTitle?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Daily agenda grid with time slots and appointment cards.
 */
export function PageDailyAgenda({
  date,
  appointments,
  timeSlots,
  onSlotClick,
  onAppointmentClick,
  animationDelay,
  className,
  i18nAvailableLabel,
  i18nTitle,
}: PageDailyAgendaProps) {
  const title =
    i18nTitle ??
    tPageShell('domain.odonto.appointments.agenda.title', 'Daily Agenda');
  const availableLabel =
    i18nAvailableLabel ??
    tPageShell('domain.odonto.appointments.agenda.available', 'Available');

  // Index appointments by startTime for O(1) lookup
  const apptByTime = new Map<string, AppointmentInfo>();
  for (const appt of appointments) {
    apptByTime.set(appt.startTime, appt);
  }

  return (
    <div
      className={cn('rounded-lg border bg-card shadow-sm', className)}
      style={animationDelay ? { animationDelay: `${animationDelay}ms` } : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <PageIcon name="calendar" className="h-4 w-4 text-muted-foreground" aria-hidden />
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <span className="text-xs text-muted-foreground font-mono">{date}</span>
      </div>

      {/* Time slots grid */}
      <div className="divide-y">
        {timeSlots.map((slot) => {
          const appt = apptByTime.get(slot.time);
          const isOccupied = !slot.available && appt;
          const isBlocked = !slot.available && !appt;

          return (
            <div
              key={slot.time}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                slot.available && onSlotClick && 'cursor-pointer hover:bg-accent/10',
                isOccupied && onAppointmentClick && 'cursor-pointer hover:bg-accent/5',
                isBlocked && 'opacity-50',
              )}
              onClick={() => {
                if (slot.available && onSlotClick) {
                  onSlotClick(slot.time);
                } else if (isOccupied && onAppointmentClick) {
                  onAppointmentClick(appt.id);
                }
              }}
              role={slot.available && onSlotClick ? 'button' : isOccupied && onAppointmentClick ? 'button' : undefined}
              tabIndex={
                (slot.available && onSlotClick) || (isOccupied && onAppointmentClick) ? 0 : undefined
              }
              onKeyDown={(e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                if (slot.available && onSlotClick) onSlotClick(slot.time);
                else if (isOccupied && onAppointmentClick) onAppointmentClick(appt.id);
              }}
            >
              {/* Time */}
              <span className="min-w-[3.5rem] font-mono text-xs text-muted-foreground tabular-nums">
                {slot.time}
              </span>

              {/* Content */}
              {isOccupied ? (
                <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                  <div className="min-w-0">
                    <span className="font-medium truncate block">{appt.patientName}</span>
                    <span className="text-xs text-muted-foreground truncate block">
                      {appt.procedure} &middot; {appt.professionalName}
                    </span>
                  </div>
                  <StatusBadge
                    label={tPageShell(
                      `domain.odonto.appointments.status.${appt.status}`,
                      STATUS_LABEL[appt.status],
                    )}
                    variant={STATUS_VARIANT[appt.status]}
                  />
                </div>
              ) : slot.available ? (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                  <PageIcon name="plus" className="h-3 w-3" aria-hidden />
                  {availableLabel}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground/50 italic">
                  {tPageShell('domain.odonto.appointments.agenda.blocked', 'Blocked')}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
