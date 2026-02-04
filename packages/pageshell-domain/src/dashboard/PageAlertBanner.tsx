'use client';

/**
 * PageAlertBanner
 *
 * Dismissible alert banner for dashboard notifications.
 * Supports different variants (warning, destructive, info, success).
 *
 * @example Basic usage
 * ```tsx
 * <PageAlertBanner
 *   variant="warning"
 *   title="Atenção"
 *   description="Seu perfil está incompleto."
 *   action={{
 *     label: "Completar",
 *     href: "/settings/profile"
 *   }}
 * />
 * ```
 */

import Link from 'next/link';
import { cn } from '@pageshell/core';
import { PageIcon, PageButton, type IconName } from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

export type PageAlertBannerVariant = 'warning' | 'destructive' | 'info' | 'success';

export interface PageAlertBannerAction {
  /** Action label */
  label: string;
  /** Action href */
  href?: string;
  /** Action click handler */
  onClick?: () => void;
}

export interface PageAlertBannerProps {
  /** Alert variant */
  variant?: PageAlertBannerVariant;
  /** Alert icon */
  icon?: IconName;
  /** Alert title */
  title: string;
  /** Alert description */
  description?: string;
  /** Primary action button */
  action?: PageAlertBannerAction;
  /** Whether banner is dismissible */
  dismissible?: boolean;
  /** Dismiss handler */
  onDismiss?: () => void;
  /** Whether banner is visible */
  visible?: boolean;
  /** Additional className */
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

const variantClasses: Record<PageAlertBannerVariant, string> = {
  warning: 'portal-alert-warning',
  destructive: 'portal-alert-destructive',
  info: 'portal-alert-info',
  success: 'portal-alert-success',
};

const defaultIcons: Record<PageAlertBannerVariant, IconName> = {
  warning: 'alert-circle',
  destructive: 'alert-circle',
  info: 'info',
  success: 'check-circle-2',
};

// =============================================================================
// Component
// =============================================================================

export function PageAlertBanner({
  variant = 'warning',
  icon,
  title,
  description,
  action,
  dismissible = true,
  onDismiss,
  visible = true,
  className,
}: PageAlertBannerProps) {
  if (!visible) {
    return null;
  }

  const resolvedIcon = icon ?? defaultIcons[variant];

  return (
    <div
      className={cn(
        'portal-alert portal-animate-in flex items-center justify-between',
        variantClasses[variant],
        className
      )}
    >
      <div className="flex items-start gap-3">
        <PageIcon
          name={resolvedIcon}
          className="w-5 h-5 portal-alert-icon flex-shrink-0 mt-0.5"
        />
        <div className="portal-alert-content">
          <p className="portal-alert-title">{title}</p>
          {description && (
            <p className="portal-alert-description">{description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {action && (
          action.href ? (
            <PageButton asChild>
              <Link href={action.href}>{action.label}</Link>
            </PageButton>
          ) : (
            <PageButton onClick={action.onClick}>{action.label}</PageButton>
          )
        )}
        {dismissible && onDismiss && (
          <PageButton variant="ghost" onClick={onDismiss} aria-label="Close" icon="x" />
        )}
      </div>
    </div>
  );
}
