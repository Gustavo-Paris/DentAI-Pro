'use client';

/**
 * PagePrescriptionHistory - Prescription history timeline
 *
 * Displays a timeline of prescriptions, each showing date, prescription number,
 * medication count, status badge, and professional name.
 *
 * @example
 * ```tsx
 * <PagePrescriptionHistory
 *   prescriptions={[
 *     {
 *       id: '1',
 *       prescriptionNumber: 'RX-2026-001',
 *       patientName: 'Maria Silva',
 *       patientId: 'p1',
 *       professionalName: 'Dr. Carlos',
 *       professionalRegistration: 'CRO-12345',
 *       medications: [{ id: 'm1', name: 'Amoxicillin', dosage: '500mg', frequency: '8/8h', duration: '7 days' }],
 *       status: 'signed',
 *       issuedDate: '2026-02-18',
 *       validUntil: '2026-03-18',
 *       createdAt: '2026-02-18',
 *       updatedAt: '2026-02-18',
 *     },
 *   ]}
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

export interface PagePrescriptionHistoryProps {
  /** List of prescriptions to display */
  prescriptions: PrescriptionInfo[];
  /** Callback when a prescription is selected */
  onSelect?: (id: string) => void;
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

const STATUS_VARIANT: Record<PrescriptionStatus, 'muted' | 'accent' | 'default' | 'destructive'> = {
  draft: 'muted',
  signed: 'accent',
  dispensed: 'default',
  expired: 'destructive',
};

const STATUS_LABEL: Record<PrescriptionStatus, string> = {
  draft: tPageShell('domain.odonto.prescriptions.history.statusDraft', 'Draft'),
  signed: tPageShell('domain.odonto.prescriptions.history.statusSigned', 'Signed'),
  dispensed: tPageShell('domain.odonto.prescriptions.history.statusDispensed', 'Dispensed'),
  expired: tPageShell('domain.odonto.prescriptions.history.statusExpired', 'Expired'),
};

// =============================================================================
// Component
// =============================================================================

export function PagePrescriptionHistory({
  prescriptions,
  onSelect,
  className,
  titleLabel = tPageShell('domain.odonto.prescriptions.history.title', 'Prescription History'),
  emptyLabel = tPageShell('domain.odonto.prescriptions.history.empty', 'No prescriptions found'),
}: PagePrescriptionHistoryProps) {
  const sortedPrescriptions = [...prescriptions].sort(
    (a, b) => new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime(),
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <PageIcon name="history" className="w-4 h-4 text-muted-foreground" />
        {titleLabel}
      </h3>

      {/* Timeline */}
      {sortedPrescriptions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">{emptyLabel}</p>
      ) : (
        <div className="relative space-y-0">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          {sortedPrescriptions.map((rx) => (
            <div
              key={rx.id}
              role={onSelect ? 'button' : undefined}
              tabIndex={onSelect ? 0 : undefined}
              className={cn(
                'relative flex items-start gap-4 py-3 pl-10',
                onSelect && 'cursor-pointer hover:bg-accent/5 rounded-lg transition-colors',
              )}
              onClick={() => onSelect?.(rx.id)}
              onKeyDown={(e) => {
                if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onSelect(rx.id);
                }
              }}
            >
              {/* Timeline dot */}
              <div className="absolute left-2.5 top-4 w-3 h-3 rounded-full border-2 border-primary bg-background" />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{rx.prescriptionNumber}</span>
                  <StatusBadge
                    variant={STATUS_VARIANT[rx.status]}
                    label={STATUS_LABEL[rx.status]}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <PageIcon name="calendar" className="w-3 h-3" />
                    {rx.issuedDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <PageIcon name="pill" className="w-3 h-3" />
                    {rx.medications.length} {tPageShell('domain.odonto.prescriptions.history.medications', 'medication(s)')}
                  </span>
                  <span className="flex items-center gap-1">
                    <PageIcon name="user" className="w-3 h-3" />
                    {rx.professionalName}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
