'use client';

/**
 * PageClinicAlerts - Clinic alerts list
 *
 * Displays a list of clinic alerts with severity-colored icons, title,
 * description, optional action button, and dismiss button for dismissible
 * alerts.
 *
 * @example
 * ```tsx
 * <PageClinicAlerts
 *   alerts={[
 *     { id: '1', type: 'warning', title: 'Low stock', description: 'Composite resin below threshold', dismissible: true },
 *     { id: '2', type: 'info', title: 'System update', action: { label: 'View details', href: '/updates' } },
 *   ]}
 *   onDismiss={(id) => removeAlert(id)}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { Button, PageIcon } from '@parisgroup-ai/pageshell/primitives';

import type { ClinicAlert } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PageClinicAlertsProps {
  /** Array of alerts to display */
  alerts: ClinicAlert[];
  /** Callback when an alert is dismissed */
  onDismiss?: (id: string) => void;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const ALERT_ICON: Record<ClinicAlert['type'], string> = {
  info: 'info',
  warning: 'alert-triangle',
  error: 'alert-circle',
  success: 'check-circle',
};

const ALERT_STYLES: Record<ClinicAlert['type'], { bg: string; icon: string; border: string }> = {
  info: {
    bg: 'bg-card',
    icon: 'text-blue-500',
    border: 'border-l-2 border-l-blue-500 border border-border',
  },
  warning: {
    bg: 'bg-card',
    icon: 'text-amber-500',
    border: 'border-l-2 border-l-amber-500 border border-border',
  },
  error: {
    bg: 'bg-card',
    icon: 'text-red-500',
    border: 'border-l-2 border-l-red-500 border border-border',
  },
  success: {
    bg: 'bg-card',
    icon: 'text-emerald-500',
    border: 'border-l-2 border-l-emerald-500 border border-border',
  },
};

// =============================================================================
// Component
// =============================================================================

export function PageClinicAlerts({
  alerts,
  onDismiss,
  className,
}: PageClinicAlertsProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)} role="alert">
      {alerts.map((alert) => {
        const styles = ALERT_STYLES[alert.type];

        return (
          <div
            key={alert.id}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-3',
              styles.bg,
              styles.border,
            )}
          >
            {/* Icon */}
            <PageIcon
              name={ALERT_ICON[alert.type]}
              className={cn('w-4 h-4 mt-0.5 flex-shrink-0', styles.icon)}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{alert.title}</p>
              {alert.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
              )}
              {alert.action && (
                <div className="mt-2">
                  {alert.action.href ? (
                    <a
                      href={alert.action.href}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {alert.action.label}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={alert.action.onClick}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {alert.action.label}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Dismiss button */}
            {alert.dismissible && onDismiss && (
              <button
                type="button"
                onClick={() => onDismiss(alert.id)}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={tPageShell('domain.odonto.dashboard.alerts.dismiss', 'Dismiss alert')}
              >
                <PageIcon name="x" className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
