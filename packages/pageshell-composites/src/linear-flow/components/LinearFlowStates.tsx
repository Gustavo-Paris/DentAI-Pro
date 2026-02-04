/**
 * LinearFlowPage States
 *
 * Error state component for LinearFlowPage.
 * Thin wrapper around GenericErrorState with Card container.
 *
 * @module linear-flow/components/LinearFlowStates
 * @see GenericErrorState for full feature set
 */

'use client';

import * as React from 'react';
import { Card } from '@pageshell/primitives';
import { GenericErrorState } from '../../shared/components';

// =============================================================================
// Types
// =============================================================================

export interface LinearFlowErrorStateProps {
  /** Error object */
  error: unknown;
  /** Optional retry handler */
  retry?: () => unknown;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Error state display for LinearFlowPage.
 * Shows error message with optional retry action.
 */
export const LinearFlowErrorState = React.memo(function LinearFlowErrorState({
  error,
  retry,
}: LinearFlowErrorStateProps) {
  return (
    <Card className="p-8">
      <GenericErrorState
        error={error}
        onRetry={retry}
        variant="error"
        size="md"
      />
    </Card>
  );
});

LinearFlowErrorState.displayName = 'LinearFlowErrorState';
