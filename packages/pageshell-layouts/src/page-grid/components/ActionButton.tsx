/**
 * ActionButton Component
 *
 * Action button for PageGrid empty state.
 *
 * @package @pageshell/layouts
 */

'use client';

import type { ReactNode, ComponentType } from 'react';
import { Button, resolveIcon } from '@pageshell/primitives';
import { isActionConfig } from '../utils';
import type { PageGridActionConfig, PageGridActionProp } from '../types';

// =============================================================================
// Single Action Button
// =============================================================================

export function ActionButton({
  config,
  LinkComponent,
}: {
  config: PageGridActionConfig;
  LinkComponent?: ComponentType<{ href: string; children: ReactNode; className?: string }>;
}) {
  const {
    label,
    variant = 'default',
    icon,
    href,
    onClick,
    disabled = false,
    loading = false,
  } = config;

  const IconComponent = icon ? resolveIcon(icon) : undefined;
  const iconElement = IconComponent ? <IconComponent className="h-4 w-4" /> : undefined;
  const buttonVariant = variant === 'primary' ? 'default' : variant;

  const buttonContent = (
    <>
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        iconElement
      )}
      {label}
    </>
  );

  if (href) {
    if (LinkComponent) {
      return (
        <Button variant={buttonVariant} disabled={disabled || loading} asChild>
          <LinkComponent href={href}>{buttonContent}</LinkComponent>
        </Button>
      );
    }
    // Fallback to anchor
    return (
      <Button variant={buttonVariant} disabled={disabled || loading} asChild>
        <a href={href}>{buttonContent}</a>
      </Button>
    );
  }

  return (
    <Button variant={buttonVariant} onClick={onClick} disabled={disabled || loading}>
      {buttonContent}
    </Button>
  );
}

// =============================================================================
// Render Action Helper
// =============================================================================

export function renderAction(
  action: PageGridActionProp | undefined,
  LinkComponent?: ComponentType<{ href: string; children: ReactNode; className?: string }>
): ReactNode {
  if (!action) return null;

  if (isActionConfig(action)) {
    const configs = Array.isArray(action) ? action : [action];
    return (
      <>
        {configs.map((config, index) => (
          <ActionButton
            key={config.label || index}
            config={config}
            LinkComponent={LinkComponent}
          />
        ))}
      </>
    );
  }

  return action;
}
