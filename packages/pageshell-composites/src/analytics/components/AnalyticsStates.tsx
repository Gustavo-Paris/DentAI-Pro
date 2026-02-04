/**
 * AnalyticsPage States
 *
 * Empty and Error state components for AnalyticsPage.
 * Thin wrappers around GenericEmptyState/GenericErrorState.
 *
 * @module analytics/components/AnalyticsStates
 * @see GenericEmptyState, GenericErrorState for full feature set
 */

'use client';

import * as React from 'react';
import { BarChart3 } from 'lucide-react';
import { GenericEmptyState, GenericErrorState } from '../../shared/components';

// =============================================================================
// Empty State
// =============================================================================

export interface AnalyticsEmptyStateProps {
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Action button configuration */
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export const AnalyticsEmptyState = React.memo(function AnalyticsEmptyState({
  title,
  description,
  action,
}: AnalyticsEmptyStateProps) {
  return (
    <GenericEmptyState
      icon={BarChart3}
      title={title}
      description={description}
      action={action ? { ...action, variant: 'outline' } : undefined}
      variant="data"
      size="md"
      ariaLabel={title}
    />
  );
});

AnalyticsEmptyState.displayName = 'AnalyticsEmptyState';

// =============================================================================
// Error State
// =============================================================================

export interface AnalyticsErrorStateProps {
  /** Error object */
  error: unknown;
  /** Retry callback */
  retry?: () => unknown;
}

export const AnalyticsErrorState = React.memo(function AnalyticsErrorState({
  error,
  retry,
}: AnalyticsErrorStateProps) {
  return (
    <GenericErrorState
      error={error}
      onRetry={retry}
      variant="error"
      size="md"
    />
  );
});

AnalyticsErrorState.displayName = 'AnalyticsErrorState';
