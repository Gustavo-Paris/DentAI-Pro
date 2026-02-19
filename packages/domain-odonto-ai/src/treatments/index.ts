/**
 * Treatments subdomain
 *
 * Treatment plans, procedures, odontograms, and clinical records.
 *
 * @example
 * ```tsx
 * import { PageTreatmentPlan } from '@parisgroup-ai/domain-odonto-ai/treatments';
 * ```
 */

// Types
export type {
  TreatmentPlanInfo,
  ProcedureInfo,
  ClinicalNoteData,
  OdontogramTooth,
  ChecklistItem,
  CostEstimateItem,
} from './types';

// Components
export { PageTreatmentPlan } from './PageTreatmentPlan';
export type { PageTreatmentPlanProps } from './PageTreatmentPlan';

export { PageProcedureCard } from './PageProcedureCard';
export type { PageProcedureCardProps } from './PageProcedureCard';

export { PageOdontogram } from './PageOdontogram';
export type { PageOdontogramProps } from './PageOdontogram';

export { PageClinicalNote } from './PageClinicalNote';
export type { PageClinicalNoteProps } from './PageClinicalNote';

export { PageTreatmentTimeline } from './PageTreatmentTimeline';
export type { PageTreatmentTimelineProps } from './PageTreatmentTimeline';

export { PageProcedureChecklist } from './PageProcedureChecklist';
export type { PageProcedureChecklistProps } from './PageProcedureChecklist';

export { PageTreatmentCostEstimate } from './PageTreatmentCostEstimate';
export type { PageTreatmentCostEstimateProps } from './PageTreatmentCostEstimate';
