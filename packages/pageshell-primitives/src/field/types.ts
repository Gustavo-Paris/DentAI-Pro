/**
 * Field Types
 *
 * Type definitions for Field components.
 *
 * @module field/types
 */

import type { VariantProps } from 'class-variance-authority';
import type * as LabelPrimitive from '@radix-ui/react-label';
import type { fieldInputVariants, fieldTextareaVariants, fieldLabelVariants } from './variants';

/**
 * FieldInput props
 */
export interface FieldInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof fieldInputVariants> {
  /**
   * Error state - applies error styling
   */
  error?: boolean;

  /**
   * Icon to show on the left side of the input
   */
  leftIcon?: React.ReactNode;

  /**
   * Icon to show on the right side of the input
   */
  rightIcon?: React.ReactNode;
}

/**
 * FieldTextarea props
 */
export interface FieldTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof fieldTextareaVariants> {
  /**
   * Error state - applies error styling
   */
  error?: boolean;
}

/**
 * FieldLabel props
 */
export interface FieldLabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof fieldLabelVariants> {}
