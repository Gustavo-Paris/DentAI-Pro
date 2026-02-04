/**
 * Wizard Components
 *
 * Multi-step wizard components for PageShell.
 *
 * @module wizard
 *
 * @example
 * import { PageShellWizard, WizardStep } from '@pageshell/interactions';
 *
 * <PageShellWizard
 *   theme="creator"
 *   currentStep={step}
 *   totalSteps={3}
 *   ...
 * >
 *   {(data) => (
 *     <WizardStep step={1}>
 *       <StepOne data={data} />
 *     </WizardStep>
 *   )}
 * </PageShellWizard>
 */

// Main wizard component
export { PageShellWizard } from './PageShellWizard';

// Step component
export { WizardStep } from './WizardStep';

// Sub-components
export { WizardProgress } from './WizardProgress';
export { WizardNavigation } from './WizardNavigation';
export { WizardBackground } from './WizardBackground';
export { WizardSkeleton } from './WizardSkeleton';

// Constants
export { WIZARD_TRANSITION_CLASSES } from './constants';

// Types
export type {
  WizardBackground as WizardBackgroundVariant,
  WizardProgressVariant,
  WizardStepStatus,
  WizardTransitionDirection,
  WizardStepConfig,
  WizardQueryResult,
  PageShellWizardProps,
  WizardStepProps,
  WizardProgressProps,
  WizardNavigationProps,
  WizardBackgroundProps,
  WizardSkeletonProps,
} from './types';
