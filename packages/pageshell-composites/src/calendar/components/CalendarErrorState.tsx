/**
 * CalendarPage Error State
 *
 * Error display for CalendarPage composite.
 * Thin wrapper around GenericErrorState for backward compatibility.
 *
 * @module calendar/components/CalendarErrorState
 * @see GenericErrorState for full feature set
 */

'use client';

import * as React from 'react';
import { GenericErrorState } from '../../shared/components';

// =============================================================================
// Types
// =============================================================================

export interface CalendarErrorStateProps {
  /** Error object */
  error: unknown;
  /** Retry callback */
  retry?: () => unknown;
}

// =============================================================================
// Component
// =============================================================================

export function CalendarErrorState({ error, retry }: CalendarErrorStateProps) {
  return (
    <GenericErrorState
      error={error}
      onRetry={retry}
      variant="error"
      size="md"
    />
  );
}

CalendarErrorState.displayName = 'CalendarErrorState';
