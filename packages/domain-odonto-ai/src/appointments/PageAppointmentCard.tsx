'use client';

/**
 * PageAppointmentCard
 *
 * Displays a single appointment with patient name, professional,
 * date/time range, procedure, room, and a color-coded status badge.
 *
 * @example
 * ```tsx
 * <PageAppointmentCard
 *   patientName="Maria Silva"
 *   professionalName="Dr. Carlos"
 *   professionalRole="dentist"
 *   date="2026-02-18"
 *   startTime="09:00"
 *   endTime="09:45"
 *   procedure="Limpeza"
 *   status="confirmed"
 *   room="Sala 2"
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { Button, PageIcon, StatusBadge } from '@parisgroup-ai/pageshell/primitives';
import type { AppointmentStatus, ProfessionalRole } from '../shared';
import type { StatusVariant } from '@parisgroup-ai/pageshell/primitives';

// =============================================================================
// Status → Variant mapping
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

/** Props for {@link PageAppointmentCard} */
export interface PageAppointmentCardProps {
  /** Patient display name */
  patientName: string;
  /** Professional display name */
  professionalName: string;
  /** Professional role */
  professionalRole: ProfessionalRole;
  /** Procedure/treatment name */
  procedure: string;
  /** ISO date string */
  date: string;
  /** Start time (HH:mm) */
  startTime: string;
  /** End time (HH:mm) */
  endTime: string;
  /** Appointment status */
  status: AppointmentStatus;
  /** Room/chair identifier */
  room?: string;
  /** Notes */
  notes?: string;
  /** Click handler */
  onClick?: () => void;
  /** Stagger animation delay in ms */
  animationDelay?: number;
  /** Additional CSS classes */
  className?: string;
  /** i18n override: patient label */
  i18nPatientLabel?: string;
  /** i18n override: professional label */
  i18nProfessionalLabel?: string;
  /** i18n override: room label */
  i18nRoomLabel?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Card displaying an appointment's key details and status.
 */
export function PageAppointmentCard({
  patientName,
  professionalName,
  professionalRole,
  procedure,
  date,
  startTime,
  endTime,
  status,
  room,
  notes,
  onClick,
  animationDelay,
  className,
  i18nPatientLabel,
  i18nProfessionalLabel,
  i18nRoomLabel,
}: PageAppointmentCardProps) {
  const patientLabel =
    i18nPatientLabel ??
    tPageShell('domain.odonto.appointments.card.patient', 'Patient');
  const professionalLabel =
    i18nProfessionalLabel ??
    tPageShell('domain.odonto.appointments.card.professional', 'Professional');
  const roomLabel =
    i18nRoomLabel ??
    tPageShell('domain.odonto.appointments.card.room', 'Room');

  const statusLabel = tPageShell(
    `domain.odonto.appointments.status.${status}`,
    STATUS_LABEL[status],
  );

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-accent/5',
        onClick && 'cursor-pointer',
        className,
      )}
      style={animationDelay ? { animationDelay: `${animationDelay}ms` } : undefined}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {/* Header: procedure + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <PageIcon name="calendar" className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span className="font-medium text-sm">{procedure}</span>
        </div>
        <StatusBadge label={statusLabel} variant={STATUS_VARIANT[status]} />
      </div>

      {/* Body */}
      <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <PageIcon name="user" className="h-3.5 w-3.5" aria-hidden />
          <span>
            <span className="text-foreground font-medium">{patientLabel}:</span>{' '}
            {patientName}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <PageIcon name="stethoscope" className="h-3.5 w-3.5" aria-hidden />
          <span>
            <span className="text-foreground font-medium">{professionalLabel}:</span>{' '}
            {professionalName}
            <span className="ml-1 text-xs">({professionalRole})</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <PageIcon name="clock" className="h-3.5 w-3.5" aria-hidden />
          <span>
            {date} &middot; {startTime}&ndash;{endTime}
          </span>
        </div>

        {room && (
          <div className="flex items-center gap-1.5">
            <PageIcon name="map-pin" className="h-3.5 w-3.5" aria-hidden />
            <span>
              <span className="text-foreground font-medium">{roomLabel}:</span> {room}
            </span>
          </div>
        )}

        {notes && (
          <p className="mt-2 text-xs italic text-muted-foreground/80">{notes}</p>
        )}
      </div>
    </div>
  );
}
