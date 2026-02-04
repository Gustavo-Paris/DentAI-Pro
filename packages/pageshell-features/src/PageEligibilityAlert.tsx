'use client';

/**
 * PageEligibilityAlert - Eligibility status alert for session actions
 *
 * Displays contextual alerts for session eligibility status (cancellation, reschedule, etc.)
 * Handles warning, success, and error states based on eligibility data.
 *
 * @example Cancellation eligibility
 * ```tsx
 * <PageEligibilityAlert
 *   eligibility={{
 *     canProceed: true,
 *     refundEligible: true,
 *     warningMessage: "Cancelamento com menos de 24h não terá reembolso",
 *   }}
 *   type="cancellation"
 * />
 * ```
 *
 * @example Reschedule eligibility
 * ```tsx
 * <PageEligibilityAlert
 *   eligibility={{
 *     canProceed: true,
 *     remainingAttempts: 2,
 *   }}
 *   type="reschedule"
 * />
 * ```
 */

import { PageAlert } from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

export type EligibilityAlertType = 'cancellation' | 'reschedule' | 'generic';

export interface EligibilityData {
  /** Whether the action can proceed */
  canProceed?: boolean;
  /** Whether refund is eligible (for cancellation) */
  refundEligible?: boolean;
  /** Warning message to display */
  warningMessage?: string;
  /** Success message to display */
  successMessage?: string;
  /** Error/reason message when action is blocked */
  reason?: string;
  /** Remaining attempts (for reschedule) */
  remainingAttempts?: number;
}

export interface PageEligibilityAlertProps {
  /** Eligibility data from API */
  eligibility: EligibilityData;
  /** Type of action for contextual messaging */
  type?: EligibilityAlertType;
  /** Additional className */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function PageEligibilityAlert({
  eligibility,
  type = 'generic',
  className,
}: PageEligibilityAlertProps) {
  const {
    canProceed = true,
    refundEligible,
    warningMessage,
    successMessage,
    reason,
    remainingAttempts,
  } = eligibility;

  // If action is blocked, show error
  if (!canProceed && reason) {
    return (
      <PageAlert
        variant="error"
        title={reason}
        icon="x-circle"
        className={className}
      />
    );
  }

  // Warning message takes priority
  if (warningMessage) {
    return (
      <PageAlert
        variant="warning"
        title={warningMessage}
        icon="alert-triangle"
        className={className}
      />
    );
  }

  // Success/info messages
  if (successMessage) {
    return (
      <PageAlert
        variant="success"
        title={successMessage}
        icon="check-circle-2"
        className={className}
      />
    );
  }

  // Refund eligible (cancellation)
  if (type === 'cancellation' && refundEligible) {
    return (
      <PageAlert
        variant="success"
        title="Você receberá reembolso total se cancelar agora."
        icon="check-circle-2"
        className={className}
      />
    );
  }

  // Remaining reschedules (reschedule)
  if (type === 'reschedule' && remainingAttempts !== undefined) {
    const isLow = remainingAttempts <= 1;
    const message = remainingAttempts === 0
      ? 'Este é seu último reagendamento permitido.'
      : `Você ainda pode reagendar ${remainingAttempts} vez${remainingAttempts > 1 ? 'es' : ''}.`;

    return (
      <PageAlert
        variant={isLow ? 'warning' : 'info'}
        title={message}
        icon="refresh-cw"
        className={className}
      />
    );
  }

  // Nothing to show
  return null;
}
