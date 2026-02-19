/**
 * Appointments subdomain
 *
 * Appointment cards, scheduling, calendar views, and reminders.
 *
 * @example
 * ```tsx
 * import { PageAppointmentCard } from '@parisgroup-ai/domain-odonto-ai/appointments';
 * ```
 */

// =============================================================================
// Types
// =============================================================================
export type {
  AppointmentInfo,
  AppointmentReminder,
  AppointmentStatsData,
  TimeSlot,
} from './types';

// =============================================================================
// Components
// =============================================================================
export { PageAppointmentCard, type PageAppointmentCardProps } from './PageAppointmentCard';
export { PageAppointmentTimeline, type PageAppointmentTimelineProps } from './PageAppointmentTimeline';
export { PageAppointmentReminder, type PageAppointmentReminderProps } from './PageAppointmentReminder';
export {
  PageAppointmentForm,
  type PageAppointmentFormProps,
  type AppointmentFormData,
  type ProfessionalOption,
} from './PageAppointmentForm';
export { PageDailyAgenda, type PageDailyAgendaProps } from './PageDailyAgenda';
export { PageAppointmentStats, type PageAppointmentStatsProps } from './PageAppointmentStats';
