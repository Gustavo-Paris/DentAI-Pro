'use client';

/**
 * PagePatientAlerts - Alert banner list for patient
 *
 * Displays a list of alerts with severity-based color coding, type icons,
 * and optional dismiss callback.
 *
 * @example
 * ```tsx
 * <PagePatientAlerts
 *   alerts={[
 *     { id: '1', type: 'allergy', severity: 'critical', title: 'Penicillin allergy' },
 *     { id: '2', type: 'overdue-treatment', severity: 'warning', title: 'Root canal overdue' },
 *   ]}
 *   onDismiss={(id) => console.log('Dismissed:', id)}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { Button, PageIcon } from '@parisgroup-ai/pageshell/primitives';

import type { PatientAlert } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PagePatientAlertsProps {
  /** List of patient alerts */
  alerts: PatientAlert[];
  /** Callback when an alert is dismissed */
  onDismiss?: (id: string) => void;
  /** Additional CSS class names */
  className?: string;
  /** Override title label */
  titleLabel?: string;
  /** Override empty state label */
  emptyLabel?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const TYPE_ICON: Record<PatientAlert['type'], string> = {
  allergy: 'alert-triangle',
  'medical-condition': 'heart',
  'overdue-treatment': 'clock',
  'payment-due': 'credit-card',
  general: 'info',
};

const SEVERITY_STYLES: Record<PatientAlert['severity'], string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  critical: 'bg-red-50 border-red-200 text-red-800',
};

const SEVERITY_ICON_STYLES: Record<PatientAlert['severity'], string> = {
  info: 'text-blue-500',
  warning: 'text-yellow-600',
  critical: 'text-red-600',
};

// =============================================================================
// Component
// =============================================================================

export function PagePatientAlerts({
  alerts,
  onDismiss,
  className,
  titleLabel = tPageShell('domain.odonto.patients.alerts.title', 'Alerts'),
  emptyLabel = tPageShell('domain.odonto.patients.alerts.empty', 'No alerts'),
}: PagePatientAlertsProps) {
  if (alerts.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground text-center py-4', className)}>
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <PageIcon name="bell" className="w-4 h-4 text-muted-foreground" />
        {titleLabel}
      </h3>

      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={cn(
            'flex items-start gap-3 rounded-lg border p-3',
            SEVERITY_STYLES[alert.severity],
          )}
          role="alert"
        >
          <PageIcon
            name={TYPE_ICON[alert.type]}
            className={cn('w-4 h-4 mt-0.5 flex-shrink-0', SEVERITY_ICON_STYLES[alert.severity])}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{alert.title}</p>
            {alert.description && (
              <p className="text-xs mt-0.5 opacity-80">{alert.description}</p>
            )}
          </div>
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              className="flex-shrink-0 h-6 w-6 p-0"
              onClick={() => onDismiss(alert.id)}
              aria-label={tPageShell('domain.odonto.patients.alerts.dismiss', 'Dismiss')}
            >
              <PageIcon name="x" className="w-3 h-3" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
