'use client';

/**
 * PageInsuranceClaim - Insurance claim card
 *
 * Displays claim number, patient, insurance provider, procedures list,
 * claimed/approved amounts, status badge, and submission/resolution dates.
 *
 * @example
 * ```tsx
 * <PageInsuranceClaim
 *   claim={{
 *     id: '1',
 *     claimNumber: 'CLM-2026-001',
 *     patientName: 'Maria Silva',
 *     insuranceProvider: 'Bradesco Saude',
 *     procedures: ['Cleaning', 'X-Ray'],
 *     claimedAmount: { value: 800, currency: 'BRL' },
 *     approvedAmount: { value: 600, currency: 'BRL' },
 *     status: 'approved',
 *     submittedDate: '2026-02-01',
 *     resolvedDate: '2026-02-10',
 *     createdAt: '2026-02-01',
 *     updatedAt: '2026-02-10',
 *   }}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon, StatusBadge } from '@parisgroup-ai/pageshell/primitives';

import type { InsuranceClaimInfo } from './types';
import type { ClaimStatus } from '../shared';

// =============================================================================
// Types
// =============================================================================

export interface PageInsuranceClaimProps {
  /** Insurance claim data to display */
  claim: InsuranceClaimInfo;
  /** Callback when the card is selected */
  onSelect?: (id: string) => void;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const CLAIM_STATUS_VARIANT: Record<ClaimStatus, 'muted' | 'warning' | 'accent' | 'destructive' | 'outline'> = {
  draft: 'muted',
  submitted: 'warning',
  approved: 'accent',
  denied: 'destructive',
  appealed: 'outline',
};

const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = {
  draft: tPageShell('domain.odonto.billing.claim.statusDraft', 'Draft'),
  submitted: tPageShell('domain.odonto.billing.claim.statusSubmitted', 'Submitted'),
  approved: tPageShell('domain.odonto.billing.claim.statusApproved', 'Approved'),
  denied: tPageShell('domain.odonto.billing.claim.statusDenied', 'Denied'),
  appealed: tPageShell('domain.odonto.billing.claim.statusAppealed', 'Appealed'),
};

function formatCurrency(amount: { value: number; currency: string }): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: amount.currency }).format(amount.value);
}

// =============================================================================
// Component
// =============================================================================

export function PageInsuranceClaim({ claim, onSelect, className }: PageInsuranceClaimProps) {
  return (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors',
        onSelect && 'hover:bg-accent/5 cursor-pointer',
        className,
      )}
      onClick={() => onSelect?.(claim.id)}
      onKeyDown={(e) => {
        if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect(claim.id);
        }
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PageIcon name="shield" className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">{claim.claimNumber}</span>
        </div>
        <StatusBadge
          variant={CLAIM_STATUS_VARIANT[claim.status]}
          label={CLAIM_STATUS_LABEL[claim.status]}
        />
      </div>

      {/* Patient & Provider */}
      <div className="text-sm">
        <p className="font-medium truncate">{claim.patientName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {claim.insuranceProvider}
        </p>
      </div>

      {/* Procedures */}
      <div className="flex flex-wrap gap-1">
        {claim.procedures.map((proc) => (
          <span
            key={proc}
            className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
          >
            {proc}
          </span>
        ))}
      </div>

      {/* Amounts & Dates */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2">
        <div className="flex items-center gap-3">
          <span>
            {tPageShell('domain.odonto.billing.claim.claimed', 'Claimed')}: {formatCurrency(claim.claimedAmount)}
          </span>
          {claim.approvedAmount && (
            <span className="text-accent-foreground font-medium">
              {tPageShell('domain.odonto.billing.claim.approved', 'Approved')}: {formatCurrency(claim.approvedAmount)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <PageIcon name="calendar" className="w-3 h-3" />
          {tPageShell('domain.odonto.billing.claim.submitted', 'Submitted')}: {claim.submittedDate}
        </span>
        {claim.resolvedDate && (
          <span className="flex items-center gap-1">
            <PageIcon name="check-circle" className="w-3 h-3" />
            {tPageShell('domain.odonto.billing.claim.resolved', 'Resolved')}: {claim.resolvedDate}
          </span>
        )}
      </div>
    </div>
  );
}
