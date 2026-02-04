/**
 * SectionedFormPage Composite
 *
 * Form page with collapsible sections, alerts, and badges.
 *
 * @module sectioned-form
 */

// Main component
export { SectionedFormPage } from './SectionedFormPage';

// Types
export type {
  SectionedFormPageProps,
  SectionedFormSectionConfig,
  SectionedFormFieldConfig,
  SectionedFormFieldType,
  SectionedFormFieldOption,
  SectionedFormAlertConfig,
  SectionedFormMutation,
  SectionedFormPageSlots,
  SectionedFormLabels,
  SectionBadgeConfig,
} from './types';
export { sectionedFormPageDefaults } from './types';

// Components (for advanced customization)
export {
  FormSection,
  SectionFormField,
  SectionedFormSkeleton,
  SectionAlert,
} from './components';
export type {
  FormSectionProps,
  SectionFormFieldProps,
  SectionedFormSkeletonProps,
  SectionAlertProps,
} from './components';

// Hooks (for advanced customization)
export { useSectionedFormLogic } from './hooks';
export type {
  UseSectionedFormLogicOptions,
  UseSectionedFormLogicResult,
} from './hooks';
