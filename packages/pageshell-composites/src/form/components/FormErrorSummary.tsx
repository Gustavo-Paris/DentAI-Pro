/**
 * Form Error Summary
 *
 * Error summary component for form validation with optional shake animation.
 *
 * @module form/components/FormErrorSummary
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { PageAlert } from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

export interface FormErrorSummaryProps {
  /** Array of field errors */
  errors: Array<{ field: string; message: string }>;
  /** Trigger shake animation */
  animate?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export const FormErrorSummary = React.memo(function FormErrorSummary({
  errors,
  animate = false,
  className,
}: FormErrorSummaryProps) {
  if (errors.length === 0) return null;

  return (
    <div className={cn(animate && 'animate-shake', className)}>
      <PageAlert
        variant="error"
        title={
          errors.length === 1
            ? 'Please fix the error below'
            : `Please fix the ${errors.length} errors below`
        }
      >
        <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
          {errors.map(({ field, message }) => (
            <li key={field}>{message}</li>
          ))}
        </ul>
      </PageAlert>
    </div>
  );
});

FormErrorSummary.displayName = 'FormErrorSummary';
