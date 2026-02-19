'use client';

/**
 * PageInsuranceVerification - Insurance verification card
 *
 * Displays insurance verification details: provider, policy number,
 * holder name, eligibility status badge, coverage details, and verification date.
 *
 * @example
 * ```tsx
 * <PageInsuranceVerification
 *   verification={{
 *     provider: 'Bradesco Saude',
 *     policyNumber: 'POL-12345',
 *     holderName: 'Maria Silva',
 *     verified: true,
 *     verifiedDate: '2026-02-15',
 *     coverageDetails: 'Basic dental coverage including cleanings and fillings',
 *     eligibilityStatus: 'eligible',
 *   }}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon, StatusBadge } from '@parisgroup-ai/pageshell/primitives';

import type { InsuranceVerificationData } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PageInsuranceVerificationProps {
  /** Insurance verification data */
  verification: InsuranceVerificationData;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

type EligibilityStatus = InsuranceVerificationData['eligibilityStatus'];

const ELIGIBILITY_VARIANT: Record<EligibilityStatus, 'accent' | 'destructive' | 'warning' | 'muted'> = {
  eligible: 'accent',
  ineligible: 'destructive',
  pending: 'warning',
  expired: 'muted',
};

const ELIGIBILITY_LABEL: Record<EligibilityStatus, string> = {
  eligible: tPageShell('domain.odonto.billing.verification.eligible', 'Eligible'),
  ineligible: tPageShell('domain.odonto.billing.verification.ineligible', 'Ineligible'),
  pending: tPageShell('domain.odonto.billing.verification.pending', 'Pending'),
  expired: tPageShell('domain.odonto.billing.verification.expired', 'Expired'),
};

// =============================================================================
// Component
// =============================================================================

export function PageInsuranceVerification({ verification, className }: PageInsuranceVerificationProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-4 flex flex-col gap-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PageIcon name="shield" className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">
            {tPageShell('domain.odonto.billing.verification.title', 'Insurance Verification')}
          </span>
        </div>
        <StatusBadge
          variant={ELIGIBILITY_VARIANT[verification.eligibilityStatus]}
          label={ELIGIBILITY_LABEL[verification.eligibilityStatus]}
        />
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">
            {tPageShell('domain.odonto.billing.verification.provider', 'Provider')}
          </p>
          <p className="font-medium truncate">{verification.provider}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            {tPageShell('domain.odonto.billing.verification.policyNumber', 'Policy Number')}
          </p>
          <p className="font-medium">{verification.policyNumber}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            {tPageShell('domain.odonto.billing.verification.holder', 'Holder')}
          </p>
          <p className="font-medium truncate">{verification.holderName}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            {tPageShell('domain.odonto.billing.verification.status', 'Status')}
          </p>
          <p className="font-medium flex items-center gap-1">
            <PageIcon
              name={verification.verified ? 'check-circle' : 'circle'}
              className={cn('w-3 h-3', verification.verified ? 'text-accent-foreground' : 'text-muted-foreground')}
            />
            {verification.verified
              ? tPageShell('domain.odonto.billing.verification.verified', 'Verified')
              : tPageShell('domain.odonto.billing.verification.unverified', 'Not Verified')}
          </p>
        </div>
      </div>

      {/* Coverage details */}
      {verification.coverageDetails && (
        <div className="text-sm border-t border-border pt-2">
          <p className="text-xs text-muted-foreground mb-1">
            {tPageShell('domain.odonto.billing.verification.coverage', 'Coverage Details')}
          </p>
          <p className="text-muted-foreground">{verification.coverageDetails}</p>
        </div>
      )}

      {/* Verification date */}
      {verification.verifiedDate && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <PageIcon name="calendar" className="w-3 h-3" />
          {tPageShell('domain.odonto.billing.verification.verifiedOn', 'Verified on')}: {verification.verifiedDate}
        </div>
      )}
    </div>
  );
}
