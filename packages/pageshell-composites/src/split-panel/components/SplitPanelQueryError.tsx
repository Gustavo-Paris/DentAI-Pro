/**
 * SplitPanelPage Query Error
 *
 * Error display component for SplitPanelPage panels.
 * Thin wrapper around GenericErrorState for backward compatibility.
 *
 * @module split-panel/components/SplitPanelQueryError
 * @see GenericErrorState for full feature set
 */

'use client';

import * as React from 'react';
import { GenericErrorState } from '../../shared/components';

// =============================================================================
// Types
// =============================================================================

export interface SplitPanelQueryErrorProps {
  /** Error object */
  error: unknown;
  /** Retry callback */
  retry?: () => unknown;
}

// =============================================================================
// Component
// =============================================================================

export const SplitPanelQueryError = React.memo(function SplitPanelQueryError({
  error,
  retry,
}: SplitPanelQueryErrorProps) {
  return (
    <GenericErrorState
      error={error}
      onRetry={retry}
      variant="error"
      size="sm"
    />
  );
});

SplitPanelQueryError.displayName = 'SplitPanelQueryError';
