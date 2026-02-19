'use client';

/**
 * PagePatientProfile - Full patient profile view
 *
 * Displays comprehensive patient information including photo, contact details,
 * birth date, insurance info, status badge, and notes section.
 *
 * @example
 * ```tsx
 * <PagePatientProfile
 *   patient={{
 *     id: '1',
 *     name: 'Maria Silva',
 *     email: 'maria@example.com',
 *     phone: '(11) 99999-0000',
 *     birthDate: '1990-01-15',
 *     status: 'active',
 *     insuranceProvider: 'Unimed',
 *     insuranceNumber: '123456',
 *     createdAt: '2025-01-01',
 *     updatedAt: '2026-02-10',
 *   }}
 *   notes="Patient prefers morning appointments."
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon, StatusBadge } from '@parisgroup-ai/pageshell/primitives';

import type { PatientInfo } from './types';
import type { PatientStatus } from '../shared';

// =============================================================================
// Types
// =============================================================================

export interface PagePatientProfileProps {
  /** Patient data to display */
  patient: PatientInfo;
  /** Free-text notes about the patient */
  notes?: string;
  /** Additional CSS class names */
  className?: string;
  /** Override section header for contact info */
  contactLabel?: string;
  /** Override section header for insurance */
  insuranceLabel?: string;
  /** Override section header for notes */
  notesLabel?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const STATUS_VARIANT: Record<PatientStatus, 'accent' | 'muted' | 'outline'> = {
  active: 'accent',
  inactive: 'muted',
  archived: 'outline',
};

const STATUS_LABEL: Record<PatientStatus, string> = {
  active: tPageShell('domain.odonto.patients.profile.statusActive', 'Active'),
  inactive: tPageShell('domain.odonto.patients.profile.statusInactive', 'Inactive'),
  archived: tPageShell('domain.odonto.patients.profile.statusArchived', 'Archived'),
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

// =============================================================================
// Sub-components
// =============================================================================

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
      <PageIcon name={icon} className="w-4 h-4 text-muted-foreground" />
      {label}
    </h4>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-muted-foreground min-w-[100px]">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function PagePatientProfile({
  patient,
  notes,
  className,
  contactLabel = tPageShell('domain.odonto.patients.profile.contact', 'Contact Information'),
  insuranceLabel = tPageShell('domain.odonto.patients.profile.insurance', 'Insurance'),
  notesLabel = tPageShell('domain.odonto.patients.profile.notes', 'Notes'),
}: PagePatientProfileProps) {
  const initials = getInitials(patient.name);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center gap-4">
        {patient.photoUrl ? (
          <img
            src={patient.photoUrl}
            alt={patient.name}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-lg">
            {initials}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{patient.name}</h2>
            <StatusBadge
              variant={STATUS_VARIANT[patient.status]}
              label={STATUS_LABEL[patient.status]}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {tPageShell('domain.odonto.patients.profile.birthDate', 'Birth date')}: {patient.birthDate}
          </p>
        </div>
      </div>

      {/* Contact Info */}
      <div className="rounded-lg border border-border p-4">
        <SectionHeader icon="user" label={contactLabel} />
        <div className="space-y-2">
          <InfoRow
            label={tPageShell('domain.odonto.patients.profile.email', 'Email')}
            value={patient.email}
          />
          <InfoRow
            label={tPageShell('domain.odonto.patients.profile.phone', 'Phone')}
            value={patient.phone}
          />
          <InfoRow
            label={tPageShell('domain.odonto.patients.profile.birthDate', 'Birth date')}
            value={patient.birthDate}
          />
        </div>
      </div>

      {/* Insurance */}
      {(patient.insuranceProvider || patient.insuranceNumber) && (
        <div className="rounded-lg border border-border p-4">
          <SectionHeader icon="shield" label={insuranceLabel} />
          <div className="space-y-2">
            <InfoRow
              label={tPageShell('domain.odonto.patients.profile.provider', 'Provider')}
              value={patient.insuranceProvider}
            />
            <InfoRow
              label={tPageShell('domain.odonto.patients.profile.number', 'Number')}
              value={patient.insuranceNumber}
            />
          </div>
        </div>
      )}

      {/* Notes */}
      {notes && (
        <div className="rounded-lg border border-border p-4">
          <SectionHeader icon="file-text" label={notesLabel} />
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes}</p>
        </div>
      )}
    </div>
  );
}
