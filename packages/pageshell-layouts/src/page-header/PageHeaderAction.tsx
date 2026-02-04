'use client';

/**
 * PageHeaderAction - Renders header action from declarative config
 *
 * Supports both ReactNode (passthrough) and declarative HeaderActionConfig
 * with mutation support for common patterns like "Mark all as read".
 *
 * @example Simple button
 * <PageHeaderAction action={{ label: "Salvar", variant: "primary" }} />
 *
 * @example With mutation
 * <PageHeaderAction
 *   action={{
 *     label: "Marcar todas como lidas",
 *     variant: "primary",
 *     mutation: markAllAsReadMutation,
 *     show: unreadCount > 0,
 *   }}
 * />
 *
 * @example Multiple actions
 * <PageHeaderActions
 *   actions={[
 *     { label: 'Exportar', icon: 'download', variant: 'outline', onClick: handleExport },
 *     { label: 'Novo', icon: 'plus', variant: 'primary', href: '/new' },
 *   ]}
 * />
 */

import { type ReactNode, isValidElement } from 'react';
import { Button, resolveIcon } from '@pageshell/primitives';
import type { HeaderActionConfig, HeaderActionProp, HeaderActionsProp } from './types';

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if headerAction is a declarative config object
 */
function isHeaderActionConfig(
  action: HeaderActionProp
): action is HeaderActionConfig {
  if (action === null || action === undefined) {
    return false;
  }
  // ReactNode types: string, number, boolean, ReactElement, array
  if (typeof action === 'string' || typeof action === 'number' || typeof action === 'boolean') {
    return false;
  }
  if (isValidElement(action)) {
    return false;
  }
  if (Array.isArray(action)) {
    return false;
  }
  // Check if it has the required 'label' property of HeaderActionConfig
  return typeof (action as HeaderActionConfig).label === 'string';
}

// =============================================================================
// Props
// =============================================================================

export interface PageHeaderActionProps {
  /** Header action - ReactNode or declarative config */
  action?: HeaderActionProp;
  /** Custom Link component for framework-agnostic usage */
  LinkComponent?: React.ComponentType<{
    href: string;
    children: React.ReactNode;
    className?: string;
  }>;
}

// =============================================================================
// Default Link Component
// =============================================================================

function DefaultLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

// =============================================================================
// Component
// =============================================================================

export function PageHeaderAction({ action, LinkComponent = DefaultLink }: PageHeaderActionProps): ReactNode {
  if (!action) {
    return null;
  }

  // Passthrough for ReactNode
  if (!isHeaderActionConfig(action)) {
    return action;
  }

  // Declarative config
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
  } = action;

  // Conditional visibility
  if (!show) {
    return null;
  }

  // Resolve icon if provided and render it
  const IconComponent = icon ? resolveIcon(icon) : undefined;
  const iconElement = IconComponent ? <IconComponent className="h-4 w-4" /> : undefined;

  // Handle click - mutation takes precedence over onClick
  const handleClick = mutation
    ? () => mutation.mutateAsync(mutationInput as never)
    : onClick;

  // Loading state from mutation
  const isLoading = mutation?.isPending ?? false;

  // Map variant to Button variant
  const buttonVariant = variant === 'primary' ? 'default' : variant;

  // Extract testId from config
  const testId = action.testId;

  // If href is provided, render as Link
  if (href) {
    return (
      <Button
        variant={buttonVariant}
        disabled={disabled}
        asChild
        data-testid={testId}
      >
        <LinkComponent href={href}>
          {iconElement}
          {label}
        </LinkComponent>
      </Button>
    );
  }

  return (
    <Button
      variant={buttonVariant}
      onClick={handleClick}
      disabled={disabled || isLoading}
      data-testid={testId}
    >
      {isLoading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : iconElement}
      {label}
    </Button>
  );
}

// =============================================================================
// Single Action Button (Internal)
// =============================================================================

/**
 * Renders a single action button from config
 */
function SingleActionButton({
  config,
  LinkComponent = DefaultLink
}: {
  config: HeaderActionConfig;
  LinkComponent?: React.ComponentType<{
    href: string;
    children: React.ReactNode;
    className?: string;
  }>;
}): ReactNode {
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
    testId,
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
      <Button
        variant={buttonVariant}
        disabled={disabled}
        asChild
        data-testid={testId}
      >
        <LinkComponent href={href}>
          {iconElement}
          {label}
        </LinkComponent>
      </Button>
    );
  }

  return (
    <Button
      variant={buttonVariant}
      onClick={handleClick}
      disabled={disabled || isLoading}
      data-testid={testId}
    >
      {isLoading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : iconElement}
      {label}
    </Button>
  );
}

// =============================================================================
// Multiple Actions Component
// =============================================================================

export interface PageHeaderActionsProps {
  /** Array of header action configs */
  actions?: HeaderActionsProp;
  /** Custom Link component for framework-agnostic usage */
  LinkComponent?: React.ComponentType<{
    href: string;
    children: React.ReactNode;
    className?: string;
  }>;
}

/**
 * PageHeaderActions - Renders multiple header action buttons
 *
 * @example
 * <PageHeaderActions
 *   actions={[
 *     { label: 'Exportar', icon: 'download', variant: 'outline', onClick: handleExport },
 *     { label: 'Novo', icon: 'plus', variant: 'primary', href: '/new' },
 *   ]}
 * />
 */
export function PageHeaderActions({ actions, LinkComponent }: PageHeaderActionsProps): ReactNode {
  if (!actions || actions.length === 0) {
    return null;
  }

  // Filter visible actions
  const visibleActions = actions.filter((action) => action.show !== false);

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {visibleActions.map((action, index) => (
        <SingleActionButton key={action.label || index} config={action} LinkComponent={LinkComponent} />
      ))}
    </div>
  );
}
