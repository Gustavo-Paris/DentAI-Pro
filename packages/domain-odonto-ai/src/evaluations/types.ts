/**
 * Evaluation subdomain types
 *
 * Types for dental evaluation display components.
 */

/** Pre-resolved tooth evaluation info for display */
export interface EvaluationToothInfo {
  /** FDI tooth number */
  tooth: string;
  /** Treatment type key (e.g. "resina") */
  treatmentType: string;
  /** Pre-resolved i18n treatment label */
  treatmentLabel: string;
  /** Pre-resolved treatment icon component */
  treatmentIcon: React.ComponentType<{ className?: string }>;
  /** Evaluation status */
  status: 'completed' | 'planned';
  /** AI treatment indication text */
  aiIndication?: string;
}
