/**
 * FieldError Component
 *
 * Accessible field error display with icon and optional shake animation.
 *
 * @module form/components/FieldError
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { PageIcon } from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

export interface FieldErrorProps {
  /** Error message to display */
  message: string;
  /** Element ID for accessibility */
  id: string;
  /** Trigger shake animation */
  animate?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export const FieldError = React.memo(function FieldError({
  message,
  id,
  animate = false,
  className,
}: FieldErrorProps) {
  return (
    <p
      id={id}
      className={cn(
        'flex items-center gap-1.5 text-sm text-destructive',
        animate && 'animate-shake',
        className
      )}
      role="alert"
    >
      <PageIcon name="alert-circle" className="h-4 w-4 flex-shrink-0" aria-hidden />
      <span>{message}</span>
    </p>
  );
});

FieldError.displayName = 'FieldError';
