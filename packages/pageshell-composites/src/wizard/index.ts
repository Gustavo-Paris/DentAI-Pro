// Simple WizardPage
export { WizardPage } from './WizardPage';
export { WizardBackground, type WizardBackgroundVariant } from './WizardBackground';
// WizardSidePanel consolidated into EnhancedWizardSidePanel
export {
  EnhancedWizardSidePanel,
  EnhancedWizardSidePanel as WizardSidePanel,
  type EnhancedWizardSidePanelProps,
  type EnhancedWizardSidePanelProps as WizardSidePanelProps,
} from './components';
export type {
  WizardPageProps,
  WizardPageSlots,
  WizardResumableConfig,
  WizardSidePanelConfig,
  SidePanelWidth,
} from './types';

// EnhancedWizardPage (full-featured with AI chat, declarative fields, etc.)
export { EnhancedWizardPage } from './EnhancedWizardPage';
export {
  FormFieldsRenderer,
  FormFieldRendererSingle,
  type FormFieldInput,
  type FormFieldInputBase,
  type FormFieldSection,
} from './FormFieldsRenderer';
export type {
  EnhancedWizardPageProps,
  EnhancedWizardPageSlots,
  EnhancedWizardStepConfig,
  WizardAIChatConfig,
  WizardChatMessage,
  WizardEnhancedResumableConfig,
  WizardEnhancedSidePanelConfig,
  WizardFormField,
  WizardFormFieldType,
  WizardFormFieldLayout,
  WizardFormFieldBase,
  WizardFormFieldText,
  WizardFormFieldPasswordStrength,
  WizardFormFieldNumber,
  WizardFormFieldCurrency,
  WizardFormFieldTextarea,
  WizardFormFieldSelect,
  WizardFormFieldSelectOption,
  WizardFormFieldRadio,
  WizardFormFieldCheckbox,
  WizardFormFieldSwitch,
  WizardFormFieldCustom,
} from './enhanced-types';

// Defaults
export {
  wizardPageDefaults,
  enhancedWizardPageDefaults,
  loadWizardProgress,
  saveWizardProgress,
  clearWizardProgress,
} from './defaults';

// Re-export from @pageshell/core for backward compatibility
export { interpolateHref } from '@pageshell/core';
