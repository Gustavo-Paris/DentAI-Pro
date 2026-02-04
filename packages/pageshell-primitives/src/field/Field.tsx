/**
 * Field Compound Component
 *
 * Consolidates form field components into a single namespace.
 *
 * @module field/Field
 *
 * @example
 * ```tsx
 * import { Field } from '@pageshell/primitives';
 *
 * <Field.Label htmlFor="name">Nome</Field.Label>
 * <Field.Input id="name" placeholder="Seu nome" />
 *
 * <Field.Label htmlFor="bio">Bio</Field.Label>
 * <Field.Textarea id="bio" rows={4} />
 *
 * <Field.Select
 *   options={[{ value: '1', label: 'Option 1' }]}
 *   placeholder="Choose..."
 * />
 *
 * <Field.Checkbox label="Accept terms" />
 * ```
 */

import { FieldLabel } from './FieldLabel';
import { FieldInput } from './FieldInput';
import { FieldTextarea } from './FieldTextarea';
import { FieldSelect } from './FieldSelect';
import { FieldCheckbox } from './FieldCheckbox';

/**
 * Field compound component
 *
 * Provides a unified namespace for form field components.
 */
const Field = {
  /**
   * Label component for form fields
   * @see FieldLabel
   */
  Label: FieldLabel,

  /**
   * Input component for single-line text input
   * @see FieldInput
   */
  Input: FieldInput,

  /**
   * Textarea component for multi-line text input
   * @see FieldTextarea
   */
  Textarea: FieldTextarea,

  /**
   * Select component with simplified options API
   * @see FieldSelect
   */
  Select: FieldSelect,

  /**
   * Checkbox component with optional integrated label
   * @see FieldCheckbox
   */
  Checkbox: FieldCheckbox,
};

export { Field };
