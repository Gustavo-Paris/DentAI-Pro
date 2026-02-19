/**
 * Appointment domain types
 *
 * Data interfaces for scheduling, reminders, and daily agenda.
 */
import type { BaseEntity, AppointmentStatus, ProfessionalRole } from '../shared';

/** Full appointment record */
export interface AppointmentInfo extends BaseEntity {
  /** Patient display name */
  patientName: string;
  /** Patient entity ID */
  patientId: string;
  /** Professional display name */
  professionalName: string;
  /** Professional role in the clinic */
  professionalRole: ProfessionalRole;
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** Start time (HH:mm) */
  startTime: string;
  /** End time (HH:mm) */
  endTime: string;
  /** Current appointment status */
  status: AppointmentStatus;
  /** Procedure/treatment name */
  procedure: string;
  /** Optional clinical notes */
  notes?: string;
  /** Optional room/chair identifier */
  room?: string;
}

/** Reminder sent to a patient before an appointment */
export interface AppointmentReminder {
  /** Reminder ID */
  id: string;
  /** Related appointment ID */
  appointmentId: string;
  /** Patient display name */
  patientName: string;
  /** Appointment date (YYYY-MM-DD) */
  date: string;
  /** Appointment time (HH:mm) */
  time: string;
  /** Procedure name */
  procedure: string;
  /** Delivery channel */
  channel: 'sms' | 'email' | 'whatsapp';
  /** Whether the reminder has been sent */
  sent: boolean;
}

/** Aggregated appointment statistics */
export interface AppointmentStatsData {
  /** Total appointments today */
  todayTotal: number;
  /** Completed appointments today */
  todayCompleted: number;
  /** Total appointments this week */
  weekTotal: number;
  /** No-show rate as decimal (0-1) */
  noShowRate: number;
  /** Average appointment duration in minutes */
  averageDuration: number;
}

/** A time slot on the daily agenda */
export interface TimeSlot {
  /** Slot time (HH:mm) */
  time: string;
  /** Whether the slot is available for booking */
  available: boolean;
  /** Appointment ID if the slot is occupied */
  appointmentId?: string;
}
