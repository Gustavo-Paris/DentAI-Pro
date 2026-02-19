'use client';

/**
 * PageMedicationList - Medication list display
 *
 * Displays a numbered list of medications with name, dosage,
 * frequency, duration, and optional instructions.
 *
 * @example
 * ```tsx
 * <PageMedicationList
 *   medications={[
 *     { id: 'm1', name: 'Amoxicillin', dosage: '500mg', frequency: '8/8h', duration: '7 days', instructions: 'Take with food' },
 *     { id: 'm2', name: 'Ibuprofen', dosage: '400mg', frequency: '12/12h', duration: '5 days' },
 *   ]}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon } from '@parisgroup-ai/pageshell/primitives';

import type { MedicationItem } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PageMedicationListProps {
  /** List of medications to display */
  medications: MedicationItem[];
  /** Additional CSS class names */
  className?: string;
  /** Override empty state label */
  emptyLabel?: string;
}

// =============================================================================
// Component
// =============================================================================

export function PageMedicationList({
  medications,
  className,
  emptyLabel = tPageShell('domain.odonto.prescriptions.medicationList.empty', 'No medications'),
}: PageMedicationListProps) {
  if (medications.length === 0) {
    return (
      <p className={cn('text-sm text-muted-foreground text-center py-4', className)}>
        {emptyLabel}
      </p>
    );
  }

  return (
    <ol className={cn('space-y-3', className)}>
      {medications.map((med, index) => (
        <li key={med.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
          {/* Number */}
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
            {index + 1}
          </span>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">{med.name}</div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <PageIcon name="pill" className="w-3 h-3" />
                {tPageShell('domain.odonto.prescriptions.medicationList.dosage', 'Dosage')}: {med.dosage}
              </span>
              <span className="flex items-center gap-1">
                <PageIcon name="clock" className="w-3 h-3" />
                {tPageShell('domain.odonto.prescriptions.medicationList.frequency', 'Frequency')}: {med.frequency}
              </span>
              <span className="flex items-center gap-1">
                <PageIcon name="calendar" className="w-3 h-3" />
                {tPageShell('domain.odonto.prescriptions.medicationList.duration', 'Duration')}: {med.duration}
              </span>
            </div>
            {med.instructions && (
              <p className="text-xs text-muted-foreground mt-1 italic">
                {med.instructions}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
