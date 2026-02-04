/**
 * TabbedListPage States
 *
 * Empty state and group header components for TabbedListPage.
 * Thin wrapper around GenericEmptyState for backward compatibility.
 *
 * @module tabbed-list/components/TabbedListStates
 * @see GenericEmptyState for full feature set
 */

'use client';

import * as React from 'react';
import { GenericEmptyState } from '../../shared/components';

// =============================================================================
// Types
// =============================================================================

export interface TabbedListEmptyStateProps {
  /** Empty state title */
  title: string;
  /** Optional description */
  description?: string;
  /** Optional icon */
  icon?: React.ReactNode;
}

export interface DefaultGroupHeaderProps {
  /** Group heading ID for accessibility */
  id: string;
  /** Group label */
  label: string;
  /** Item count in group */
  count: number;
}

// =============================================================================
// Components
// =============================================================================

/**
 * Empty state component for when no items are found.
 * Uses GenericEmptyState with ARIA attributes for accessibility.
 */
export const TabbedListEmptyState = React.memo(function TabbedListEmptyState({
  title,
  description,
  icon,
}: TabbedListEmptyStateProps) {
  // GenericEmptyState expects IconProp (string | ComponentType), not ReactNode
  // For backward compatibility with ReactNode icons, we render custom or use default
  return (
    <GenericEmptyState
      title={title}
      description={description}
      variant="data"
      size="lg"
      role="status"
      ariaLive="polite"
    >
      {/* If custom ReactNode icon was provided, render it above (legacy support) */}
      {icon && (
        <div className="mb-4 text-muted-foreground -mt-4 order-first">
          {icon}
        </div>
      )}
    </GenericEmptyState>
  );
});

TabbedListEmptyState.displayName = 'TabbedListEmptyState';

/**
 * Default group header for grouped items.
 */
export const DefaultGroupHeader = React.memo(function DefaultGroupHeader({
  id,
  label,
  count,
}: DefaultGroupHeaderProps) {
  return (
    <h2
      id={id}
      className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
    >
      {label} ({count})
    </h2>
  );
});

DefaultGroupHeader.displayName = 'DefaultGroupHeader';
