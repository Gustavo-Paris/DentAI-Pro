'use client';

/**
 * PagePrescriptionCard - Prescription summary card
 *
 * Displays a compact prescription card with prescription number, patient name,
 * professional, medication count, status badge, issued date, and valid until.
 *
 * @example
 * ```tsx
 * <PagePrescriptionCard
 *   prescription={{
 *     id: '1',
 *     prescriptionNumber: 'RX-2026-001',
 *     patientName: 'Maria Silva',
 *     patientId: 'p1',
 *     professionalName: 'Dr. Carlos',
 *     professionalRegistration: 'CRO-12345',
 *     medications: [{ id: 'm1', name: 'Amoxicillin', dosage: '500mg', frequency: '8/8h', duration: '7 days' }],
 *     status: 'signed',
 *     issuedDate: '2026-02-18',
 *     validUntil: '2026-03-18',
 *     createdAt: '2026-02-18',
 *     updatedAt: '2026-02-18',
 *   }}
 *   onSelect={(id) => console.log(id)}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon, StatusBadge } from '@parisgroup-ai/pageshell/primitives';

import type { PrescriptionInfo } from './types';
import type { PrescriptionStatus } from '../shared';

// =============================================================================
// Types
// =============================================================================

export interface PagePrescriptionCardProps {
  /** Prescription data to display */
  prescription: PrescriptionInfo;
  /** Callback when the card is selected */
  onSelect?: (id: string) => void;
  /** Animation delay index for staggered animations */
  animationDelay?: number;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const STATUS_VARIANT: Record<PrescriptionStatus, 'muted' | 'accent' | 'default' | 'destructive'> = {
  draft: 'muted',
  signed: 'accent',
  dispensed: 'default',
  expired: 'destructive',
};

const STATUS_LABEL: Record<PrescriptionStatus, string> = {
  draft: tPageShell('domain.odonto.prescriptions.card.statusDraft', 'Draft'),
  signed: tPageShell('domain.odonto.prescriptions.card.statusSigned', 'Signed'),
  dispensed: tPageShell('domain.odonto.prescriptions.card.statusDispensed', 'Dispensed'),
  expired: tPageShell('domain.odonto.prescriptions.card.statusExpired', 'Expired'),
};

// =============================================================================
// Component
// =============================================================================

export function PagePrescriptionCard({
  prescription,
  onSelect,
  animationDelay = 0,
  className,
}: PagePrescriptionCardProps) {
  const medicationCount = prescription.medications.length;

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'flex items-start gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/5 cursor-pointer',
        className,
      )}
      style={{ animationDelay: animationDelay > 0 ? `${animationDelay * 100}ms` : undefined }}
      onClick={() => onSelect?.(prescription.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(prescription.id);
        }
      }}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <PageIcon name="file-text" className="w-5 h-5" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm truncate">{prescription.prescriptionNumber}</h3>
          <StatusBadge
            variant={STATUS_VARIANT[prescription.status]}
            label={STATUS_LABEL[prescription.status]}
          />
        </div>

        <p className="text-sm text-foreground mt-1 truncate">{prescription.patientName}</p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <PageIcon name="user" className="w-3 h-3" />
            {prescription.professionalName}
          </span>
          <span className="flex items-center gap-1">
            <PageIcon name="pill" className="w-3 h-3" />
            {medicationCount} {tPageShell('domain.odonto.prescriptions.card.medications', 'medication(s)')}
          </span>
          <span className="flex items-center gap-1">
            <PageIcon name="calendar" className="w-3 h-3" />
            {tPageShell('domain.odonto.prescriptions.card.issued', 'Issued')}: {prescription.issuedDate}
          </span>
          <span className="flex items-center gap-1">
            <PageIcon name="clock" className="w-3 h-3" />
            {tPageShell('domain.odonto.prescriptions.card.validUntil', 'Valid until')}: {prescription.validUntil}
          </span>
        </div>
      </div>
    </div>
  );
}
