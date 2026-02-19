/**
 * Prescriptions subdomain
 *
 * Prescription generation, medication database, and digital signing.
 *
 * @example
 * ```tsx
 * import { PagePrescriptionCard, PagePrescriptionForm } from '@parisgroup-ai/domain-odonto-ai/prescriptions';
 * ```
 */

export { PagePrescriptionCard } from './PagePrescriptionCard';
export type { PagePrescriptionCardProps } from './PagePrescriptionCard';

export { PageMedicationSearch } from './PageMedicationSearch';
export type { PageMedicationSearchProps } from './PageMedicationSearch';

export { PagePrescriptionForm } from './PagePrescriptionForm';
export type { PagePrescriptionFormProps } from './PagePrescriptionForm';

export { PageMedicationList } from './PageMedicationList';
export type { PageMedicationListProps } from './PageMedicationList';

export { PageDigitalSignature } from './PageDigitalSignature';
export type { PageDigitalSignatureProps } from './PageDigitalSignature';

export { PagePrescriptionHistory } from './PagePrescriptionHistory';
export type { PagePrescriptionHistoryProps } from './PagePrescriptionHistory';

export type {
  PrescriptionInfo,
  MedicationItem,
  MedicationSearchResult,
  DigitalSignatureData,
} from './types';
