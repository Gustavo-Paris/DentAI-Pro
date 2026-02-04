/**
 * GenericEmptyState Component
 *
 * Unified empty state component for all composites.
 * Replaces duplicate implementations across CardList, SplitPanel, Analytics, etc.
 *
 * Features:
 * - Pre-configured variants (data, search, filter, error, custom)
 * - Size variants (sm, md, lg)
 * - Built-in ARIA accessibility (role="status", aria-live="polite")
 * - Customizable actions
 *
 * @module shared/components/GenericEmptyState
 * @see Code Quality - Consolidation of duplicated state components
 */

'use client';

import * as React from 'react';
import { Button, resolveIcon, type IconProp } from '@pageshell/primitives';
import { Inbox, Search, FileX2, AlertCircle } from 'lucide-react';
import { cn } from '@pageshell/core';
import type { BaseEmptyStateProps, ActionConfig } from '../types';

// =============================================================================
// Types
// =============================================================================

/**
 * Empty state variants with pre-configured icons
 */
export type EmptyStateVariant = 'data' | 'search' | 'filter' | 'error' | 'custom';

/**
 * Size variants for the empty state
 */
export type EmptyStateSize = 'sm' | 'md' | 'lg';

/**
 * ARIA live region politeness setting
 */
export type AriaLive = 'polite' | 'assertive' | 'off';

export interface GenericEmptyStateProps extends BaseEmptyStateProps {
  /** Pre-configured variant with default icon */
  variant?: EmptyStateVariant;
  /** Size variant */
  size?: EmptyStateSize;
  /** Secondary action */
  secondaryAction?: ActionConfig;
  /** Children to render below actions */
  children?: React.ReactNode;
  /**
   * ARIA role for the container.
   * @default 'status'
   */
  role?: 'status' | 'region' | 'none';
  /**
   * ARIA live region setting for screen readers.
   * @default 'polite'
   */
  ariaLive?: AriaLive;
  /**
   * Custom aria-label. Defaults to title if not provided.
   */
  ariaLabel?: string;
}

// =============================================================================
// Constants
// =============================================================================

const VARIANT_ICONS: Record<EmptyStateVariant, React.ComponentType<{ className?: string }>> = {
  data: Inbox,
  search: Search,
  filter: FileX2,
  error: AlertCircle,
  custom: Inbox,
};

const SIZE_CLASSES: Record<EmptyStateSize, { container: string; icon: string; iconWrapper: string; title: string; description: string }> = {
  sm: {
    container: 'py-6 p-4 space-y-3',
    iconWrapper: 'h-10 w-10',
    icon: 'h-5 w-5',
    title: 'text-sm font-medium',
    description: 'text-xs',
  },
  md: {
    container: 'py-8 p-6 space-y-4',
    iconWrapper: 'h-12 w-12',
    icon: 'h-6 w-6',
    title: 'text-base font-semibold',
    description: 'text-sm',
  },
  lg: {
    container: 'py-12 p-8 space-y-5',
    iconWrapper: 'h-14 w-14',
    icon: 'h-7 w-7',
    title: 'text-lg font-semibold',
    description: 'text-sm',
  },
};

// =============================================================================
// Utilities
// =============================================================================

/**
 * Handle action click (onClick or href navigation)
 */
function handleActionClick(action: ActionConfig | undefined): void {
  if (!action) return;
  if (action.onClick) {
    action.onClick();
  } else if (action.href) {
    window.location.href = action.href;
  }
}

// =============================================================================
// Component
// =============================================================================

export const GenericEmptyState = React.memo(function GenericEmptyState({
  title,
  description,
  icon,
  action,
  secondaryAction,
  variant = 'data',
  size = 'md',
  className,
  children,
  // ARIA props with sensible defaults
  role = 'status',
  ariaLive = 'polite',
  ariaLabel,
}: GenericEmptyStateProps) {
  const sizeClasses = SIZE_CLASSES[size];

  // Resolve icon: custom icon > variant default
  const DefaultIcon = VARIANT_ICONS[variant];
  const Icon = icon ? (resolveIcon(icon) ?? DefaultIcon) : DefaultIcon;

  // Build ARIA attributes
  const ariaAttributes: React.HTMLAttributes<HTMLDivElement> = {};
  if (role !== 'none') {
    ariaAttributes.role = role;
  }
  if (ariaLive !== 'off') {
    ariaAttributes['aria-live'] = ariaLive;
  }
  if (ariaLabel) {
    ariaAttributes['aria-label'] = ariaLabel;
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizeClasses.container,
        className
      )}
      {...ariaAttributes}
    >
      {/* Icon */}
      <div
        className={cn(
          'rounded-full bg-muted flex items-center justify-center',
          sizeClasses.iconWrapper
        )}
      >
        <Icon className={cn('text-muted-foreground', sizeClasses.icon)} />
      </div>

      {/* Text Content */}
      <div className="space-y-1 max-w-sm">
        <h3 className={cn('text-foreground', sizeClasses.title)}>{title}</h3>
        {description && (
          <p className={cn('text-muted-foreground', sizeClasses.description)}>
            {description}
          </p>
        )}
      </div>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-2 mt-2">
          {secondaryAction && (
            <Button
              variant="ghost"
              size={size === 'lg' ? 'default' : 'sm'}
              onClick={() => handleActionClick(secondaryAction)}
              disabled={secondaryAction.disabled}
            >
              {secondaryAction.label}
            </Button>
          )}
          {action && (
            <Button
              variant={action.variant === 'outline' ? 'outline' : 'default'}
              size={size === 'lg' ? 'default' : 'sm'}
              onClick={() => handleActionClick(action)}
              disabled={action.disabled}
            >
              {action.label}
            </Button>
          )}
        </div>
      )}

      {/* Optional children */}
      {children}
    </div>
  );
});

GenericEmptyState.displayName = 'GenericEmptyState';
