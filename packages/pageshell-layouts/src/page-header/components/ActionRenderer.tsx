/**
 * ActionRenderer Component
 *
 * Action button rendering for PageHeader.
 *
 * @package @pageshell/layouts
 */

'use client';

import * as React from 'react';
import { isValidElement } from 'react';
import { Button, StatusBadge, resolveIcon } from '@pageshell/primitives';
import type { PageBadge, ActionProp, HeaderActionConfig } from '../types';

// =============================================================================
// Badge Renderer
// =============================================================================

export function renderBadges(badge: PageBadge | PageBadge[] | undefined) {
  if (!badge) return null;

  const badges = Array.isArray(badge) ? badge : [badge];

  return (
    <>
      {badges.map((b, index) => (
        <StatusBadge key={index} variant={b.variant ?? 'primary'}>
          {b.label}
        </StatusBadge>
      ))}
    </>
  );
}

// =============================================================================
// Type Guard
// =============================================================================

export function isHeaderActionConfig(action: ActionProp): action is HeaderActionConfig {
  if (action === null || action === undefined) {
    return false;
  }
  if (typeof action === 'string' || typeof action === 'number' || typeof action === 'boolean') {
    return false;
  }
  if (isValidElement(action)) {
    return false;
  }
  if (Array.isArray(action)) {
    // Array could be array of configs or array of ReactNodes
    // Check first element
    const first = action[0];
    if (first && typeof first === 'object' && 'label' in first) {
      return true; // array of HeaderActionConfig
    }
    return false;
  }
  return typeof (action as HeaderActionConfig).label === 'string';
}

// =============================================================================
// Single Action Button
// =============================================================================

export function SingleActionButton({
  config,
  LinkComponent,
}: {
  config: HeaderActionConfig;
  LinkComponent: React.ComponentType<{
    href: string;
    children: React.ReactNode;
    className?: string;
  }>;
}): React.ReactElement | null {
  const {
    label,
    variant = 'default',
    icon,
    href,
    onClick,
    mutation,
    mutationInput,
    show = true,
    disabled = false,
  } = config;

  if (!show) {
    return null;
  }

  const IconComponent = icon ? resolveIcon(icon) : undefined;
  const iconElement = IconComponent ? <IconComponent className="h-4 w-4" /> : undefined;

  const handleClick = mutation
    ? () => mutation.mutateAsync(mutationInput as never)
    : onClick;

  const isLoading = mutation?.isPending ?? false;
  const buttonVariant = variant === 'primary' ? 'default' : variant;

  if (href) {
    return (
      <Button variant={buttonVariant} disabled={disabled} asChild>
        <LinkComponent href={href}>
          {iconElement}
          {label}
        </LinkComponent>
      </Button>
    );
  }

  return (
    <Button variant={buttonVariant} onClick={handleClick} disabled={disabled || isLoading}>
      {isLoading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        iconElement
      )}
      {label}
    </Button>
  );
}

// =============================================================================
// Action Renderer
// =============================================================================

export function renderAction(
  action: ActionProp,
  LinkComponent: React.ComponentType<{
    href: string;
    children: React.ReactNode;
    className?: string;
  }>
): React.ReactNode {
  if (!action) return null;

  // If it's a ReactElement, return as-is
  if (isValidElement(action)) {
    return action;
  }

  // If it's an array, handle accordingly
  if (Array.isArray(action)) {
    // Check if it's an array of configs
    const firstItem = action[0];
    if (firstItem && typeof firstItem === 'object' && 'label' in firstItem) {
      // Array of HeaderActionConfig
      return (
        <div className="flex items-center gap-2">
          {(action as HeaderActionConfig[]).map((config, index) => (
            <SingleActionButton
              key={config.label || index}
              config={config}
              LinkComponent={LinkComponent}
            />
          ))}
        </div>
      );
    }
    // Array of ReactNodes
    return <>{action}</>;
  }

  // Single config
  if (isHeaderActionConfig(action)) {
    return (
      <SingleActionButton
        config={action as HeaderActionConfig}
        LinkComponent={LinkComponent}
      />
    );
  }

  // Fallback - it's some other ReactNode (string, number, etc)
  return action as React.ReactNode;
}
