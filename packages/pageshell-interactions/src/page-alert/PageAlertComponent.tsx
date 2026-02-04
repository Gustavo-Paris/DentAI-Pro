/**
 * PageAlert Component
 *
 * A feedback component for displaying important messages to users.
 * Supports multiple variants, dismissible state, and optional actions.
 *
 * @module page-alert
 */

'use client';

import { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { cn } from '@pageshell/core';
import { Button, resolveIcon, type IconName } from '@pageshell/primitives';
import { usePageShellContext } from '@pageshell/theme';
import {
  ANIMATION_DURATION_NORMAL,
  defaultIcons,
  variantStyles,
  gapClasses,
} from './constants';
import { DefaultLink, isDismissedPersisted, persistDismissed } from './utils';
import type { PageAlertProps, PageAlertGroupProps } from './types';

// =============================================================================
// PageAlert Component
// =============================================================================

export function PageAlert({
  variant,
  title,
  description,
  icon,
  // Action
  action,
  // Link mode
  href,
  showArrow = true,
  LinkComponent = DefaultLink,
  // Dismiss
  dismissible = false,
  onDismiss,
  persistKey,
  // Animation
  animated = true,
  // Layout
  fullWidth = false,
  // Accessibility
  ariaLabel,
  testId,
  className,
  children,
}: PageAlertProps) {
  // Try to get context, but don't fail if not available
  let config;
  try {
    const context = usePageShellContext();
    config = context.config;
  } catch {
    config = { animate: 'animate-in fade-in-0 slide-in-from-bottom-2' };
  }

  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  // Check persisted dismissed state on mount
  useEffect(() => {
    if (persistKey && isDismissedPersisted(persistKey)) {
      setIsDismissed(true);
      setIsVisible(false);
    }
  }, [persistKey]);

  // Handle dismiss
  const handleDismiss = () => {
    if (animated) {
      setIsExiting(true);
      // Wait for exit animation to complete
      setTimeout(() => {
        setIsVisible(false);
        setIsDismissed(true);
        if (persistKey) {
          persistDismissed(persistKey);
        }
        onDismiss?.();
      }, ANIMATION_DURATION_NORMAL);
    } else {
      setIsVisible(false);
      setIsDismissed(true);
      if (persistKey) {
        persistDismissed(persistKey);
      }
      onDismiss?.();
    }
  };

  // Don't render if dismissed
  if (isDismissed || !isVisible) {
    return null;
  }

  // Get styles
  const styles = variantStyles[variant];
  const IconComponent = resolveIcon(icon as IconName) ?? defaultIcons[variant];

  // Alert content
  const alertContent = (
    <>
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <IconComponent className={cn('h-5 w-5', styles.icon)} aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className={cn('text-sm font-medium', styles.title)}>{title}</h4>
        {description && (
          <p className={cn('mt-1 text-sm', styles.description)}>{description}</p>
        )}
        {children && <div className="mt-2">{children}</div>}
        {action && !href && (
          <div className="mt-3">
            <Button
              variant="link"
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
              className={cn('h-auto p-0 font-medium', styles.action)}
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>

      {/* Arrow indicator (link mode) */}
      {href && showArrow && (
        <ArrowRight
          className="w-4 h-4 flex-shrink-0 text-muted-foreground group-hover:translate-x-1 transition-transform"
          aria-hidden="true"
        />
      )}

      {/* Dismiss button */}
      {dismissible && !href && (
        <button
          type="button"
          onClick={handleDismiss}
          className={cn(
            'flex-shrink-0 p-1 rounded-sm transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            styles.dismiss
          )}
          aria-label="Close alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </>
  );

  const containerClasses = cn(
    'relative flex gap-3 border p-4',
    !fullWidth && 'rounded-lg',
    styles.container,
    animated && !isExiting && config.animate,
    isExiting && 'animate-out fade-out-0 slide-out-to-top-2 duration-200',
    href && 'hover:bg-muted/30 transition-colors cursor-pointer group',
    className
  );

  // Link mode - render as anchor
  if (href) {
    return (
      <LinkComponent
        href={href}
        aria-label={ariaLabel ?? title}
        data-testid={testId}
        className={cn('block', containerClasses)}
      >
        {alertContent}
      </LinkComponent>
    );
  }

  // Default mode - render as div with role="alert"
  return (
    <div
      role="alert"
      aria-label={ariaLabel ?? title}
      data-testid={testId}
      className={containerClasses}
    >
      {alertContent}
    </div>
  );
}

// =============================================================================
// PageAlertGroup Component
// =============================================================================

/**
 * PageAlertGroup - Container for multiple alerts
 *
 * @example
 * <PageAlertGroup>
 *   <PageAlert variant="warning" title="Aviso 1" />
 *   <PageAlert variant="info" title="Dica" />
 * </PageAlertGroup>
 */
export function PageAlertGroup({
  children,
  gap = 'md',
  className,
}: PageAlertGroupProps) {
  return (
    <div className={cn(gapClasses[gap], className)} role="region" aria-label="Alerts">
      {children}
    </div>
  );
}

// Attach as compound
PageAlert.Group = PageAlertGroup;
