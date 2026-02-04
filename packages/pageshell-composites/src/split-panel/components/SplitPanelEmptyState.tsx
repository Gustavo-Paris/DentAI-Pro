/**
 * SplitPanelPage Empty State
 *
 * Empty state component for SplitPanelPage panels.
 * Thin wrapper around GenericEmptyState for backward compatibility.
 *
 * @module split-panel/components/SplitPanelEmptyState
 * @see GenericEmptyState for full feature set
 */

'use client';

import * as React from 'react';
import type { IconProp } from '@pageshell/primitives';
import { GenericEmptyState } from '../../shared/components';

// =============================================================================
// Types
// =============================================================================

export interface SplitPanelEmptyStateProps {
  /** Icon to display */
  icon?: IconProp;
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

// =============================================================================
// Component
// =============================================================================

export const SplitPanelEmptyState = React.memo(function SplitPanelEmptyState({
  icon,
  title,
  description,
  action,
}: SplitPanelEmptyStateProps) {
  return (
    <GenericEmptyState
      icon={icon}
      title={title}
      description={description}
      action={action ? { ...action, variant: 'outline' } : undefined}
      variant="data"
      size="md"
    />
  );
});

SplitPanelEmptyState.displayName = 'SplitPanelEmptyState';
