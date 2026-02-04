/**
 * Wizard Constants
 *
 * Shared constants for wizard components.
 *
 * @module wizard/constants
 */

import type { WizardTransitionDirection } from './types';

// =============================================================================
// Transition Animation Classes
// =============================================================================

/**
 * CSS classes for step transition animations.
 */
export const WIZARD_TRANSITION_CLASSES: Record<WizardTransitionDirection, string> = {
  forward: 'animate-in slide-in-from-right-4 fade-in-0 duration-300',
  backward: 'animate-in slide-in-from-left-4 fade-in-0 duration-300',
  none: '',
};
