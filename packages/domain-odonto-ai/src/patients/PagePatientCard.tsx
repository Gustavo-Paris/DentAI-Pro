'use client';

/**
 * PagePatientCard - Patient summary card
 *
 * Displays a compact patient card with photo avatar (initials fallback),
 * status badge, last visit date, next appointment, and phone number.
 *
 * @example
 * ```tsx
 * <PagePatientCard
 *   patient={{
 *     id: '1',
 *     name: 'Maria Silva',
 *     status: 'active',
 *     birthDate: '1990-01-15',
 *     phone: '(11) 99999-0000',
 *     lastVisit: '2026-02-10',
 *     nextAppointment: '2026-03-10',
 *     createdAt: '2025-01-01',
 *     updatedAt: '2026-02-10',
 *   }}
 *   onSelect={(id) => console.log(id)}
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

export interface PagePatientCardProps {
  /** Patient data to display */
  patient: PatientInfo;
  /** Callback when the card is selected */
  onSelect?: (id: string) => void;
  /** Animation delay index for staggered animations */
  animationDelay?: number;
  /** Additional CSS class names */
  className?: string;
  /** Override label for last visit */
  lastVisitLabel?: string;
  /** Override label for next appointment */
  nextAppointmentLabel?: string;
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
  active: tPageShell('domain.odonto.patients.card.statusActive', 'Active'),
  inactive: tPageShell('domain.odonto.patients.card.statusInactive', 'Inactive'),
  archived: tPageShell('domain.odonto.patients.card.statusArchived', 'Archived'),
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
// Component
// =============================================================================

export function PagePatientCard({
  patient,
  onSelect,
  animationDelay = 0,
  className,
  lastVisitLabel = tPageShell('domain.odonto.patients.card.lastVisit', 'Last visit'),
  nextAppointmentLabel = tPageShell('domain.odonto.patients.card.nextAppointment', 'Next appt'),
}: PagePatientCardProps) {
  const initials = getInitials(patient.name);

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/5 cursor-pointer',
        className,
      )}
      style={{ animationDelay: animationDelay > 0 ? `${animationDelay * 100}ms` : undefined }}
      onClick={() => onSelect?.(patient.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(patient.id);
        }
      }}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {patient.photoUrl ? (
          <img
            src={patient.photoUrl}
            alt={patient.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
            {initials}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm truncate">{patient.name}</h3>
          <StatusBadge
            variant={STATUS_VARIANT[patient.status]}
            label={STATUS_LABEL[patient.status]}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
          {patient.phone && (
            <span className="flex items-center gap-1">
              <PageIcon name="phone" className="w-3 h-3" />
              {patient.phone}
            </span>
          )}
          {patient.lastVisit && (
            <span className="flex items-center gap-1">
              <PageIcon name="clock" className="w-3 h-3" />
              {lastVisitLabel}: {patient.lastVisit}
            </span>
          )}
          {patient.nextAppointment && (
            <span className="flex items-center gap-1">
              <PageIcon name="calendar" className="w-3 h-3" />
              {nextAppointmentLabel}: {patient.nextAppointment}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
