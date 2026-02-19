'use client';

/**
 * PageDigitalSignature - Digital signature display
 *
 * Shows signed by, registration number, signed date, verification status badge,
 * truncated signature hash preview, and verification icon.
 *
 * @example
 * ```tsx
 * <PageDigitalSignature
 *   signature={{
 *     signedBy: 'Dr. Carlos Mendes',
 *     registration: 'CRO-SP 12345',
 *     signedAt: '2026-02-18T14:30:00Z',
 *     verified: true,
 *     signatureHash: 'a1b2c3d4e5f6...',
 *   }}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon, StatusBadge } from '@parisgroup-ai/pageshell/primitives';

import type { DigitalSignatureData } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PageDigitalSignatureProps {
  /** Digital signature data */
  signature: DigitalSignatureData;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

function truncateHash(hash: string, maxLength = 16): string {
  if (hash.length <= maxLength) return hash;
  return `${hash.slice(0, maxLength)}...`;
}

// =============================================================================
// Component
// =============================================================================

export function PageDigitalSignature({
  signature,
  className,
}: PageDigitalSignatureProps) {
  return (
    <div className={cn('rounded-lg border border-border p-4 space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <PageIcon name="shield" className="w-4 h-4 text-muted-foreground" />
        <h4 className="text-sm font-semibold">
          {tPageShell('domain.odonto.prescriptions.digitalSignature.title', 'Digital Signature')}
        </h4>
        <StatusBadge
          variant={signature.verified ? 'accent' : 'destructive'}
          label={
            signature.verified
              ? tPageShell('domain.odonto.prescriptions.digitalSignature.verified', 'Verified')
              : tPageShell('domain.odonto.prescriptions.digitalSignature.unverified', 'Unverified')
          }
        />
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-xs text-muted-foreground">
            {tPageShell('domain.odonto.prescriptions.digitalSignature.signedBy', 'Signed by')}
          </span>
          <p className="font-medium">{signature.signedBy}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">
            {tPageShell('domain.odonto.prescriptions.digitalSignature.registration', 'Registration')}
          </span>
          <p className="font-medium">{signature.registration}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">
            {tPageShell('domain.odonto.prescriptions.digitalSignature.signedAt', 'Signed at')}
          </span>
          <p className="font-medium">{signature.signedAt}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">
            {tPageShell('domain.odonto.prescriptions.digitalSignature.status', 'Status')}
          </span>
          <div className="flex items-center gap-1 font-medium">
            <PageIcon
              name={signature.verified ? 'check-circle' : 'x-circle'}
              className={cn('w-4 h-4', signature.verified ? 'text-green-600' : 'text-destructive')}
            />
            {signature.verified
              ? tPageShell('domain.odonto.prescriptions.digitalSignature.valid', 'Valid')
              : tPageShell('domain.odonto.prescriptions.digitalSignature.invalid', 'Invalid')
            }
          </div>
        </div>
      </div>

      {/* Hash */}
      {signature.signatureHash && (
        <div className="pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {tPageShell('domain.odonto.prescriptions.digitalSignature.hash', 'Signature hash')}
          </span>
          <p className="font-mono text-xs text-muted-foreground mt-0.5">
            {truncateHash(signature.signatureHash)}
          </p>
        </div>
      )}
    </div>
  );
}
