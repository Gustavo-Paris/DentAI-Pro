/**
 * Field Wrapper Component
 *
 * Wrapper for form fields with label, description, and error display.
 *
 * @module wizard/components/FieldWrapper
 */

'use client';

import * as React from 'react';
import { Label } from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

export interface FieldWrapperProps {
  /** Field label */
  label: string;
  /** Field name (for ID generation) */
  name: string;
  /** Whether the field is required */
  required?: boolean;
  /** Field description */
  description?: string;
  /** Error message */
  error?: string;
  /** Field children */
  children: React.ReactNode;
}

// =============================================================================
// Component
// =============================================================================

export const FieldWrapper = React.memo(function FieldWrapper({
  label,
  name,
  required,
  description,
  error,
  children,
}: FieldWrapperProps) {
  const id = `field-${name}`;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
            id,
            'aria-describedby': [descriptionId, errorId].filter(Boolean).join(' ') || undefined,
            'aria-invalid': error ? true : undefined,
          })
        : children}
      {description && !error && (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
});

FieldWrapper.displayName = 'FieldWrapper';
