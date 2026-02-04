'use client';

/**
 * WizardStep Component
 *
 * Conditionally renders content based on current step.
 * Only renders children when the step matches the current wizard step.
 * Must be used inside PageShellWizard.
 *
 * @module wizard/WizardStep
 *
 * @example
 * <PageShellWizard currentStep={2} totalSteps={3} ...>
 *   {(data) => (
 *     <>
 *       <WizardStep step={1}>
 *         <StepOne data={data} />
 *       </WizardStep>
 *       <WizardStep step={2}>
 *         <StepTwo data={data} />
 *       </WizardStep>
 *       <WizardStep step={3}>
 *         <StepThree data={data} />
 *       </WizardStep>
 *     </>
 *   )}
 * </PageShellWizard>
 */

import { logger } from '@repo/logger';
import { useWizardStepContext } from '@pageshell/theme';
import type { WizardStepProps } from './types';

export function WizardStep({ step, children }: WizardStepProps) {
  const wizardContext = useWizardStepContext();

  // If not inside a wizard, render nothing (fail gracefully)
  if (!wizardContext) {
    logger.warn('WizardStep must be used inside PageShellWizard');
    return null;
  }

  // Only render if current step matches
  if (wizardContext.currentStep !== step) {
    return null;
  }

  return <>{children}</>;
}

WizardStep.displayName = 'WizardStep';
