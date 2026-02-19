/**
 * Settings subdomain
 *
 * Clinic configuration, professional profiles, and system preferences.
 *
 * @example
 * ```tsx
 * import { PageClinicProfileForm, PageProfessionalCard } from '@parisgroup-ai/domain-odonto-ai/settings';
 * ```
 */

// Types
export type {
  ClinicProfile,
  ProfessionalInfo,
  WorkingHours,
  ProcedureCatalogItem,
  NotificationSetting,
  InsuranceProvider,
} from './types';

// Components
export { PageClinicProfileForm } from './PageClinicProfileForm';
export type { PageClinicProfileFormProps } from './PageClinicProfileForm';

export { PageProfessionalCard } from './PageProfessionalCard';
export type { PageProfessionalCardProps } from './PageProfessionalCard';

export { PageWorkingHoursEditor } from './PageWorkingHoursEditor';
export type { PageWorkingHoursEditorProps } from './PageWorkingHoursEditor';

export { PageProcedureCatalog } from './PageProcedureCatalog';
export type { PageProcedureCatalogProps } from './PageProcedureCatalog';

export { PageNotificationSettings } from './PageNotificationSettings';
export type { PageNotificationSettingsProps } from './PageNotificationSettings';

export { PageInsuranceProviderList } from './PageInsuranceProviderList';
export type { PageInsuranceProviderListProps } from './PageInsuranceProviderList';
