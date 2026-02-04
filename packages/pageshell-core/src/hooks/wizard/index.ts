/**
 * Wizard Logic Module
 *
 * @module hooks/wizard
 */

// Main hook
export { useWizardLogic } from './useWizardLogicCore';

// Keyboard navigation hook (shared)
export { useWizardKeyboardNav } from './useWizardKeyboardNav';
export type {
  UseWizardKeyboardNavOptions,
  UseWizardKeyboardNavResult,
} from './useWizardKeyboardNav';

// Types
export type {
  StepValidationResult,
  WizardResumableConfig,
  UseWizardLogicOptions,
  UseWizardLogicReturn,
} from './types';

// Storage utilities (for extension)
export {
  DEFAULT_EXPIRY_DAYS,
  loadProgress,
  saveProgress,
  clearStoredProgress,
  type StoredWizardProgress,
} from './storage';
