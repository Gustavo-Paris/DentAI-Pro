/**
 * GenericErrorState Component
 *
 * Unified error state component for all composites.
 * Replaces duplicate implementations across SplitPanel, Analytics, LinearFlow, etc.
 *
 * Features:
 * - Pre-configured variants (error, warning, critical, network)
 * - Size variants (sm, md, lg)
 * - Built-in ARIA accessibility (role="alert", aria-live="assertive")
 * - Automatic error message extraction
 * - Customizable retry action
 *
 * @module shared/components/GenericErrorState
 * @see Code Quality - Consolidation of duplicated state components
 */

'use client';

import * as React from 'react';
import { Button, resolveIcon, type IconProp } from '@pageshell/primitives';
import { AlertCircle, RefreshCw, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@pageshell/core';
import type { BaseErrorStateProps, ActionConfig, ErrorLabels } from '../types';
import { getErrorMessage, DEFAULT_ERROR_LABELS } from '../types';

// =============================================================================
// Types
// =============================================================================

/**
 * Error state variants with pre-configured icons and styles
 */
export type ErrorStateVariant = 'error' | 'warning' | 'critical' | 'network';

/**
 * Size variants for the error state
 */
export type ErrorStateSize = 'sm' | 'md' | 'lg';

/**
 * ARIA live region politeness setting
 */
export type AriaLive = 'polite' | 'assertive' | 'off';

export interface GenericErrorStateProps extends Omit<BaseErrorStateProps, 'action'> {
  /** Pre-configured variant with default icon and styling */
  variant?: ErrorStateVariant;
  /** Size variant */
  size?: ErrorStateSize;
  /** Custom retry label */
  retryLabel?: string;
  /** Custom action (overrides onRetry) */
  action?: ActionConfig;
  /** Children to render below actions */
  children?: React.ReactNode;
  /**
   * ARIA role for the container.
   * @default 'alert'
   */
  role?: 'alert' | 'status' | 'none';
  /**
   * ARIA live region setting for screen readers.
   * @default 'assertive'
   */
  ariaLive?: AriaLive;
  /**
   * Custom aria-label.
   */
  ariaLabel?: string;
  /**
   * i18n labels for error state titles.
   * All labels have English defaults.
   */
  labels?: ErrorLabels;
}

// =============================================================================
// Constants
// =============================================================================

const VARIANT_CONFIG: Record<
  ErrorStateVariant,
  {
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
  }
> = {
  error: {
    icon: AlertCircle,
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
  },
  critical: {
    icon: XCircle,
    iconBg: 'bg-red-600/10',
    iconColor: 'text-red-600',
  },
  network: {
    icon: RefreshCw,
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
  },
};

const SIZE_CLASSES: Record<
  ErrorStateSize,
  {
    container: string;
    iconWrapper: string;
    icon: string;
    title: string;
    description: string;
  }
> = {
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

/**
 * Get variant title from labels or use English defaults
 */
function getVariantTitle(variant: ErrorStateVariant, labels?: ErrorLabels): string {
  const resolvedLabels = { ...DEFAULT_ERROR_LABELS, ...labels };
  switch (variant) {
    case 'error':
      return resolvedLabels.error;
    case 'warning':
      return resolvedLabels.warning;
    case 'critical':
      return resolvedLabels.critical;
    case 'network':
      return resolvedLabels.network;
    default:
      return resolvedLabels.error;
  }
}

// =============================================================================
// Component
// =============================================================================

export const GenericErrorState = React.memo(function GenericErrorState({
  title,
  description,
  icon,
  error,
  onRetry,
  action,
  variant = 'error',
  size = 'md',
  retryLabel = 'Try again',
  className,
  children,
  // ARIA props with sensible defaults for errors
  role = 'alert',
  ariaLive = 'assertive',
  ariaLabel,
  labels,
}: GenericErrorStateProps) {
  const sizeClasses = SIZE_CLASSES[size];
  const variantConfig = VARIANT_CONFIG[variant];

  // Resolve icon: custom icon > variant default
  const DefaultIcon = variantConfig.icon;
  const Icon = icon ? (resolveIcon(icon) ?? DefaultIcon) : DefaultIcon;

  // Resolve description: explicit description > error message > default
  const displayDescription = description ?? (error ? getErrorMessage(error) : undefined);

  // Resolve title: explicit title > variant default (with i18n labels)
  const displayTitle = title ?? getVariantTitle(variant, labels);

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
          'rounded-full flex items-center justify-center',
          sizeClasses.iconWrapper,
          variantConfig.iconBg
        )}
      >
        <Icon className={cn(sizeClasses.icon, variantConfig.iconColor)} />
      </div>

      {/* Text Content */}
      <div className="space-y-1 max-w-sm">
        <h3 className={cn('text-foreground', sizeClasses.title)}>{displayTitle}</h3>
        {displayDescription && (
          <p className={cn('text-muted-foreground', sizeClasses.description)}>
            {displayDescription}
          </p>
        )}
      </div>

      {/* Actions */}
      {(onRetry || action) && (
        <div className="flex items-center gap-2 mt-2">
          {action ? (
            <Button
              variant={action.variant === 'outline' ? 'outline' : 'default'}
              size={size === 'lg' ? 'default' : 'sm'}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.label}
            </Button>
          ) : onRetry ? (
            <Button
              variant="outline"
              size={size === 'lg' ? 'default' : 'sm'}
              onClick={onRetry}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {retryLabel}
            </Button>
          ) : null}
        </div>
      )}

      {/* Optional children */}
      {children}
    </div>
  );
});

GenericErrorState.displayName = 'GenericErrorState';
