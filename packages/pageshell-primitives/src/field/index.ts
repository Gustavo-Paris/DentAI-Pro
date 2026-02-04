/**
 * Field Component Exports
 *
 * @module field
 */

// Main compound component
export { Field } from './Field';

// Individual components (for direct imports)
export { FieldInput } from './FieldInput';
export { FieldTextarea } from './FieldTextarea';
export { FieldLabel } from './FieldLabel';
export { FieldSelect, type FieldSelectProps, type FieldSelectOption, type FieldSelectGroup } from './FieldSelect';
export { FieldCheckbox, type FieldCheckboxProps } from './FieldCheckbox';

// Variants (for extending or custom implementations)
export {
  fieldInputVariants,
  fieldTextareaVariants,
  fieldLabelVariants,
  fieldSelectVariants,
  fieldCheckboxVariants,
} from './variants';

// Types
export type { FieldInputProps, FieldTextareaProps, FieldLabelProps } from './types';
