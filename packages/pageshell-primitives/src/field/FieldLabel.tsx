/**
 * FieldLabel Component
 *
 * Accessible label component using Radix UI primitives.
 *
 * @module field/FieldLabel
 */

'use client';

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@pageshell/core';
import { fieldLabelVariants } from './variants';
import type { FieldLabelProps } from './types';

/**
 * FieldLabel component
 *
 * An accessible label that works with form inputs.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Field.Label htmlFor="name">Nome</Field.Label>
 *
 * // Required field (shows asterisk)
 * <Field.Label htmlFor="email" required>Email</Field.Label>
 * ```
 */
const FieldLabel = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  FieldLabelProps
>(({ className, required, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(fieldLabelVariants({ required }), className)}
    {...props}
  />
));

FieldLabel.displayName = 'Field.Label';

export { FieldLabel };
