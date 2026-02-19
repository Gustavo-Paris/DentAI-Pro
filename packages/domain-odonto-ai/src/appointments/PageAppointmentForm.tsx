'use client';

/**
 * PageAppointmentForm
 *
 * Layout for creating or editing an appointment. Provides fields for
 * patient, professional, date, time slots, procedure, room, and notes.
 * All labels are localized via tPageShell.
 *
 * @example
 * ```tsx
 * <PageAppointmentForm
 *   onSubmit={(data) => createAppointment(data)}
 *   onCancel={() => router.back()}
 *   professionals={professionals}
 *   timeSlots={slots}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { Button, PageIcon } from '@parisgroup-ai/pageshell/primitives';
import type { TimeSlot } from './types';
import type { ProfessionalRole } from '../shared';

// =============================================================================
// Props
// =============================================================================

/** Option for the professional select */
export interface ProfessionalOption {
  /** Professional entity ID */
  id: string;
  /** Display name */
  name: string;
  /** Role */
  role: ProfessionalRole;
}

/** Data shape emitted by the form on submit */
export interface AppointmentFormData {
  /** Selected patient ID */
  patientId: string;
  /** Selected professional ID */
  professionalId: string;
  /** ISO date string */
  date: string;
  /** Selected time slot (HH:mm) */
  time: string;
  /** Procedure name */
  procedure: string;
  /** Room/chair identifier */
  room: string;
  /** Clinical notes */
  notes: string;
}

/** Props for {@link PageAppointmentForm} */
export interface PageAppointmentFormProps {
  /** Submit handler receiving form data */
  onSubmit: (data: AppointmentFormData) => void;
  /** Cancel handler */
  onCancel?: () => void;
  /** Available professionals for selection */
  professionals?: ProfessionalOption[];
  /** Available time slots */
  timeSlots?: TimeSlot[];
  /** Pre-filled values for editing */
  defaultValues?: Partial<AppointmentFormData>;
  /** Whether submission is in progress */
  submitting?: boolean;
  /** Stagger animation delay in ms */
  animationDelay?: number;
  /** Additional CSS classes */
  className?: string;
  /** i18n override: submit button label */
  i18nSubmitLabel?: string;
  /** i18n override: cancel button label */
  i18nCancelLabel?: string;
  /** i18n override: form title */
  i18nTitle?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Appointment creation/edit form with localized labels.
 */
export function PageAppointmentForm({
  onSubmit,
  onCancel,
  professionals = [],
  timeSlots = [],
  defaultValues = {},
  submitting = false,
  animationDelay,
  className,
  i18nSubmitLabel,
  i18nCancelLabel,
  i18nTitle,
}: PageAppointmentFormProps) {
  const title =
    i18nTitle ??
    tPageShell('domain.odonto.appointments.form.title', 'New Appointment');
  const submitLabel =
    i18nSubmitLabel ??
    tPageShell('domain.odonto.appointments.form.submit', 'Save');
  const cancelLabel =
    i18nCancelLabel ??
    tPageShell('domain.odonto.appointments.form.cancel', 'Cancel');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSubmit({
      patientId: (fd.get('patientId') as string) || '',
      professionalId: (fd.get('professionalId') as string) || '',
      date: (fd.get('date') as string) || '',
      time: (fd.get('time') as string) || '',
      procedure: (fd.get('procedure') as string) || '',
      room: (fd.get('room') as string) || '',
      notes: (fd.get('notes') as string) || '',
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('space-y-4 rounded-lg border bg-card p-6 shadow-sm', className)}
      style={animationDelay ? { animationDelay: `${animationDelay}ms` } : undefined}
    >
      <h3 className="text-lg font-semibold">{title}</h3>

      {/* Patient */}
      <fieldset className="space-y-1.5">
        <label htmlFor="appt-patient" className="text-sm font-medium">
          {tPageShell('domain.odonto.appointments.form.patient', 'Patient')}
        </label>
        <input
          id="appt-patient"
          name="patientId"
          type="text"
          defaultValue={defaultValues.patientId}
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder={tPageShell('domain.odonto.appointments.form.patientPlaceholder', 'Search patient...')}
        />
      </fieldset>

      {/* Professional */}
      <fieldset className="space-y-1.5">
        <label htmlFor="appt-professional" className="text-sm font-medium">
          {tPageShell('domain.odonto.appointments.form.professional', 'Professional')}
        </label>
        <select
          id="appt-professional"
          name="professionalId"
          defaultValue={defaultValues.professionalId}
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">
            {tPageShell('domain.odonto.appointments.form.selectProfessional', 'Select professional...')}
          </option>
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.role})
            </option>
          ))}
        </select>
      </fieldset>

      {/* Date + Time */}
      <div className="grid grid-cols-2 gap-3">
        <fieldset className="space-y-1.5">
          <label htmlFor="appt-date" className="text-sm font-medium">
            {tPageShell('domain.odonto.appointments.form.date', 'Date')}
          </label>
          <input
            id="appt-date"
            name="date"
            type="date"
            defaultValue={defaultValues.date}
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </fieldset>

        <fieldset className="space-y-1.5">
          <label htmlFor="appt-time" className="text-sm font-medium">
            {tPageShell('domain.odonto.appointments.form.time', 'Time')}
          </label>
          {timeSlots.length > 0 ? (
            <select
              id="appt-time"
              name="time"
              defaultValue={defaultValues.time}
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">
                {tPageShell('domain.odonto.appointments.form.selectTime', 'Select time...')}
              </option>
              {timeSlots.map((slot) => (
                <option key={slot.time} value={slot.time} disabled={!slot.available}>
                  {slot.time}{!slot.available ? ' (occupied)' : ''}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="appt-time"
              name="time"
              type="time"
              defaultValue={defaultValues.time}
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          )}
        </fieldset>
      </div>

      {/* Procedure */}
      <fieldset className="space-y-1.5">
        <label htmlFor="appt-procedure" className="text-sm font-medium">
          {tPageShell('domain.odonto.appointments.form.procedure', 'Procedure')}
        </label>
        <input
          id="appt-procedure"
          name="procedure"
          type="text"
          defaultValue={defaultValues.procedure}
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder={tPageShell('domain.odonto.appointments.form.procedurePlaceholder', 'e.g. Cleaning, Root Canal...')}
        />
      </fieldset>

      {/* Room */}
      <fieldset className="space-y-1.5">
        <label htmlFor="appt-room" className="text-sm font-medium">
          {tPageShell('domain.odonto.appointments.form.room', 'Room')}
        </label>
        <input
          id="appt-room"
          name="room"
          type="text"
          defaultValue={defaultValues.room}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder={tPageShell('domain.odonto.appointments.form.roomPlaceholder', 'e.g. Room 1, Chair A...')}
        />
      </fieldset>

      {/* Notes */}
      <fieldset className="space-y-1.5">
        <label htmlFor="appt-notes" className="text-sm font-medium">
          {tPageShell('domain.odonto.appointments.form.notes', 'Notes')}
        </label>
        <textarea
          id="appt-notes"
          name="notes"
          rows={3}
          defaultValue={defaultValues.notes}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-y"
          placeholder={tPageShell('domain.odonto.appointments.form.notesPlaceholder', 'Additional notes...')}
        />
      </fieldset>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting
            ? tPageShell('domain.odonto.appointments.form.saving', 'Saving...')
            : submitLabel}
        </Button>
      </div>
    </form>
  );
}
