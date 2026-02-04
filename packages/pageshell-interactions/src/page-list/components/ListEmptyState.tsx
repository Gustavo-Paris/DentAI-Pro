/**
 * ListEmptyState Component
 *
 * Empty state display for PageList.
 *
 * @package @pageshell/interactions
 */

'use client';

import type { ReactNode } from 'react';
import { Button, resolveIcon, type IconName } from '@pageshell/primitives';
import type { PageListEmptyState, ActionConfig, ActionProp } from '../types';

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Render action from ActionProp
 */
function renderAction(action: ActionProp): ReactNode {
  if (!action) return null;

  // If it's a ReactNode (not a config object), render as-is
  if (typeof action !== 'object' || !('label' in action)) {
    return action;
  }

  // It's an ActionConfig
  const config = action as ActionConfig;
  return (
    <Button
      variant={config.variant ?? 'default'}
      onClick={config.onClick}
      disabled={config.disabled}
    >
      {config.label}
    </Button>
  );
}

// =============================================================================
// Component
// =============================================================================

export function ListEmptyState({ emptyState }: { emptyState: PageListEmptyState }) {
  const renderIcon = () => {
    if (!emptyState.icon) return null;
    // Check if it's a ReactElement (already rendered)
    if (typeof emptyState.icon === 'object' && 'type' in emptyState.icon) {
      return emptyState.icon;
    }
    // Try to resolve as PageIconVariant
    const IconComponent = resolveIcon(emptyState.icon as IconName);
    if (IconComponent) {
      return <IconComponent className="h-12 w-12" />;
    }
    return null;
  };

  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      role="status"
      aria-live="polite"
    >
      {emptyState.icon && (
        <div className="mb-4 text-muted-foreground">{renderIcon()}</div>
      )}
      <h3 className="text-lg font-semibold text-foreground">{emptyState.title}</h3>
      {emptyState.description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          {emptyState.description}
        </p>
      )}
      {emptyState.action && <div className="mt-4">{renderAction(emptyState.action)}</div>}
    </div>
  );
}
