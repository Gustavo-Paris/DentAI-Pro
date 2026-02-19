/**
 * Patients subdomain
 *
 * Patient cards, profiles, medical history, and dental charts.
 *
 * @example
 * ```tsx
 * import { PagePatientCard } from '@parisgroup-ai/domain-odonto-ai/patients';
 * ```
 */

// Types
export type {
  PatientInfo,
  MedicalRecord,
  DentalChartTooth,
  PatientAlert,
} from './types';

// Components
export { PagePatientCard } from './PagePatientCard';
export type { PagePatientCardProps } from './PagePatientCard';

export { PagePatientProfile } from './PagePatientProfile';
export type { PagePatientProfileProps } from './PagePatientProfile';

export { PageMedicalHistory } from './PageMedicalHistory';
export type { PageMedicalHistoryProps } from './PageMedicalHistory';

export { PageDentalChart } from './PageDentalChart';
export type { PageDentalChartProps } from './PageDentalChart';

export { PagePatientAlerts } from './PagePatientAlerts';
export type { PagePatientAlertsProps } from './PagePatientAlerts';

export { PagePatientList } from './PagePatientList';
export type { PagePatientListProps } from './PagePatientList';
