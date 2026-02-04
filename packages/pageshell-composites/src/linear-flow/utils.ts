/**
 * LinearFlowPage Utilities
 *
 * Helper functions for LinearFlowPage.
 *
 * @module linear-flow/utils
 */

import type { StepConfig, StepStatus } from './types';

/**
 * Infer step statuses based on current step.
 * Steps before current are 'completed', current is 'current', after are 'upcoming'.
 */
export function inferStepStatuses(
  steps: StepConfig[],
  currentStep: string
): (StepConfig & { status: StepStatus })[] {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return steps.map((step, index) => ({
    ...step,
    status:
      step.status ??
      (index < currentIndex
        ? 'completed'
        : index === currentIndex
          ? 'current'
          : 'upcoming'),
  }));
}
