/**
 * AlertBanner Component
 *
 * A prominent alert banner for important messages that require user attention.
 * Supports dismissible state, action buttons, and optional persistence.
 *
 * Use this when you need:
 * - A dismissible alert that can persist across sessions
 * - Primary/secondary action buttons
 * - Consistent styling across the application
 *
 * For simpler inline alerts, use PageAlert from @pageshell/interactions.
 *
 * @package @pageshell/features
 *
 * @example Basic usage
 * ```tsx
 * <AlertBanner
 *   variant="warning"
 *   title="Low Balance"
 *   description="Your credit balance is running low."
 *   primaryAction={{ label: "Add Credits", href: "/credits" }}
 *   dismissible
 * />
 * ```
 *
 * @example With persistence
 * ```tsx
 * <AlertBanner
 *   variant="info"
 *   title="New Feature"
 *   description="Check out our new dashboard!"
 *   dismissKey="new-dashboard-promo"
 *   dismissExpiryMs={24 * 60 * 60 * 1000}
 * />
 * ```
 *
 * @example With primary/secondary actions
 * ```tsx
 * <AlertBanner
 *   variant="warning"
 *   title="Unsaved Changes"
 *   description="You have unsaved work."
 *   primaryAction={{ label: "Restore", onClick: handleRestore }}
 *   secondaryAction={{ label: "Discard", onClick: handleDiscard }}
 *   dismissible
 * />
 * ```
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { Button, PageIcon } from '@pageshell/primitives';
import type { PageIconVariant } from '@pageshell/primitives';
import { useDismissState } from './hooks/useDismissState';

// =============================================================================
// Types
// =============================================================================

export type AlertBannerVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertBannerAction {
  /** Action label */
  label: string;
  /** Click handler (mutually exclusive with href) */
  onClick?: () => void;
  /** Navigation href (mutually exclusive with onClick) */
  href?: string;
  /** Disable action */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
}

export interface AlertBannerProps {
  // Content
  /** Banner title */
  title: string;
  /** Banner description */
  description?: string | React.ReactNode;
  /** Custom icon (overrides variant default) */
  icon?: PageIconVariant;
  /** Additional content below description */
  children?: React.ReactNode;

  // Variant
  /** Visual variant */
  variant: AlertBannerVariant;

  // Actions
  /** Primary action button */
  primaryAction?: AlertBannerAction;
  /** Secondary action button */
  secondaryAction?: AlertBannerAction;

  // Dismiss
  /** Show dismiss button */
  dismissible?: boolean;
  /** LocalStorage key for dismiss persistence */
  dismissKey?: string;
  /** Expiry time in ms for dismissal (e.g., 24 * 60 * 60 * 1000 for 24h) */
  dismissExpiryMs?: number;
  /** Callback when dismissed */
  onDismiss?: () => void;

  // Layout
  /** Position: inline (default), floating */
  position?: 'inline' | 'floating-top' | 'floating-bottom';
  /** Additional className */
  className?: string;
  /** Accessible label */
  ariaLabel?: string;
  /** Test ID */
  testId?: string;

  // Link component (for Next.js)
  /** Custom Link component for navigation actions */
  LinkComponent?: React.ComponentType<{
    href: string;
    children: React.ReactNode;
    className?: string;
  }>;
}

// =============================================================================
// Constants
// =============================================================================

const variantConfig: Record<
  AlertBannerVariant,
  { icon: PageIconVariant; border: string; bg: string; iconColor: string }
> = {
  info: {
    icon: 'info',
    border: 'border-info/30',
    bg: 'bg-info/10',
    iconColor: 'text-info',
  },
  success: {
    icon: 'check-circle-2',
    border: 'border-success/30',
    bg: 'bg-success/10',
    iconColor: 'text-success',
  },
  warning: {
    icon: 'alert-triangle',
    border: 'border-warning/30',
    bg: 'bg-warning/10',
    iconColor: 'text-warning',
  },
  error: {
    icon: 'alert-circle',
    border: 'border-destructive/30',
    bg: 'bg-destructive/10',
    iconColor: 'text-destructive',
  },
};

const primaryButtonVariant: Record<AlertBannerVariant, 'default' | 'destructive'> = {
  info: 'default',
  success: 'default',
  warning: 'default',
  error: 'destructive',
};

// =============================================================================
// Component
// =============================================================================

export function AlertBanner({
  // Content
  title,
  description,
  icon,
  children,
  // Variant
  variant,
  // Actions
  primaryAction,
  secondaryAction,
  // Dismiss
  dismissible = false,
  dismissKey,
  dismissExpiryMs,
  onDismiss,
  // Layout
  position = 'inline',
  className,
  ariaLabel,
  testId,
  // Link
  LinkComponent,
}: AlertBannerProps) {
  const { isDismissed, isExiting, dismiss } = useDismissState({
    persistKey: dismissKey,
    expiryMs: dismissExpiryMs,
    onDismiss,
  });

  // Don't render if dismissed
  if (isDismissed) {
    return null;
  }

  const config = variantConfig[variant];
  const resolvedIcon = icon ?? config.icon;

  // Render action button
  const renderAction = (action: AlertBannerAction, isPrimary: boolean) => {
    const buttonVariant = isPrimary ? primaryButtonVariant[variant] : 'ghost';
    const buttonSize = 'sm';

    const content = (
      <Button
        variant={buttonVariant}
        size={buttonSize}
        disabled={action.disabled}
        onClick={action.onClick}
        className={cn(
          isPrimary && variant === 'warning' && 'bg-warning hover:bg-warning/90 text-warning-foreground'
        )}
      >
        {action.loading && (
          <PageIcon name="loader" className="h-3.5 w-3.5 animate-spin mr-1.5" />
        )}
        {action.label}
      </Button>
    );

    // Wrap with Link if href provided
    if (action.href && LinkComponent) {
      return (
        <LinkComponent href={action.href} className="contents">
          {content}
        </LinkComponent>
      );
    }

    if (action.href) {
      return (
        <a href={action.href} className="contents">
          {content}
        </a>
      );
    }

    return content;
  };

  // Position classes
  const positionClasses = {
    inline: '',
    'floating-top': 'fixed top-4 left-1/2 -translate-x-1/2 z-50 shadow-lg backdrop-blur-sm',
    'floating-bottom': 'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 shadow-lg backdrop-blur-sm',
  };

  return (
    <div
      role="alert"
      aria-label={ariaLabel ?? title}
      data-testid={testId}
      className={cn(
        'rounded-lg border p-4',
        config.border,
        config.bg,
        positionClasses[position],
        // Animation
        'transition-all duration-150',
        isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn('flex-shrink-0 p-2 rounded-lg', config.bg)}>
          <PageIcon
            name={resolvedIcon}
            className={cn('h-5 w-5', config.iconColor)}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          {description && (
            <div className="mt-1 text-sm text-muted-foreground">
              {typeof description === 'string' ? <p>{description}</p> : description}
            </div>
          )}
          {children}

          {/* Actions */}
          {(primaryAction || secondaryAction) && (
            <div className="mt-3 flex items-center gap-2">
              {primaryAction && renderAction(primaryAction, true)}
              {secondaryAction && renderAction(secondaryAction, false)}
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {dismissible && (
          <button
            type="button"
            onClick={dismiss}
            className="flex-shrink-0 p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close alert"
          >
            <PageIcon name="x" className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

AlertBanner.displayName = 'AlertBanner';
