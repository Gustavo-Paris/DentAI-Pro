/**
 * ListPage Empty State
 *
 * Empty state display for ListPage composite (both table and cards modes).
 * Thin wrapper around GenericEmptyState for consistency.
 *
 * @module list/components/shared/ListPageEmptyState
 * @see GenericEmptyState for full feature set
 */

'use client';

import * as React from 'react';
import { GenericEmptyState, type EmptyStateVariant } from '../../../shared/components';

// =============================================================================
// Types
// =============================================================================

export interface ListPageEmptyStateProps {
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Action button configuration */
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  /**
   * Empty state variant
   * - 'data': No data exists yet (show create action)
   * - 'search': No results from search/filter (show clear action)
   */
  variant?: EmptyStateVariant;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

// =============================================================================
// Component
// =============================================================================

export const ListPageEmptyState = React.memo(function ListPageEmptyState({
  title,
  description,
  action,
  variant = 'data',
  size = 'lg',
}: ListPageEmptyStateProps) {
  return (
    <GenericEmptyState
      title={title}
      description={description}
      action={action}
      variant={variant}
      size={size}
    />
  );
});

ListPageEmptyState.displayName = 'ListPageEmptyState';
