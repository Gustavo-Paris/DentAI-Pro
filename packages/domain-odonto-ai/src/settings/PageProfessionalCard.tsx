'use client';

/**
 * PageProfessionalCard - Professional/staff member card
 *
 * Displays a card for a dental professional with photo/avatar, name,
 * role badge, specialization, registration number, contact info, and
 * active status.
 *
 * @example
 * ```tsx
 * <PageProfessionalCard
 *   professional={{
 *     id: '1',
 *     name: 'Dr. Ana Costa',
 *     role: 'dentist',
 *     specialization: 'Orthodontics',
 *     registrationNumber: 'CRO-SP 54321',
 *     email: 'ana@clinic.com',
 *     phone: '(11) 99999-0000',
 *     active: true,
 *     createdAt: '2025-01-01',
 *     updatedAt: '2026-02-10',
 *   }}
 *   onSelect={(id) => console.log(id)}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon, StatusBadge } from '@parisgroup-ai/pageshell/primitives';

import type { ProfessionalInfo } from './types';
import type { ProfessionalRole } from '../shared';

// =============================================================================
// Types
// =============================================================================

export interface PageProfessionalCardProps {
  /** Professional data to display */
  professional: ProfessionalInfo;
  /** Callback when the card is selected */
  onSelect?: (id: string) => void;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const ROLE_VARIANT: Record<ProfessionalRole, 'accent' | 'muted' | 'outline'> = {
  dentist: 'accent',
  hygienist: 'muted',
  assistant: 'outline',
  receptionist: 'outline',
  admin: 'muted',
};

const ROLE_LABEL: Record<ProfessionalRole, string> = {
  dentist: tPageShell('domain.odonto.settings.professional.roleDentist', 'Dentist'),
  hygienist: tPageShell('domain.odonto.settings.professional.roleHygienist', 'Hygienist'),
  assistant: tPageShell('domain.odonto.settings.professional.roleAssistant', 'Assistant'),
  receptionist: tPageShell('domain.odonto.settings.professional.roleReceptionist', 'Receptionist'),
  admin: tPageShell('domain.odonto.settings.professional.roleAdmin', 'Admin'),
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

export function PageProfessionalCard({
  professional,
  onSelect,
  className,
}: PageProfessionalCardProps) {
  const initials = getInitials(professional.name);

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/5 cursor-pointer',
        !professional.active && 'opacity-60',
        className,
      )}
      onClick={() => onSelect?.(professional.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(professional.id);
        }
      }}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {professional.photoUrl ? (
          <img
            src={professional.photoUrl}
            alt={professional.name}
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
          <h3 className="font-medium text-sm truncate">{professional.name}</h3>
          <StatusBadge
            variant={ROLE_VARIANT[professional.role]}
            label={ROLE_LABEL[professional.role]}
          />
          {!professional.active && (
            <StatusBadge
              variant="outline"
              label={tPageShell('domain.odonto.settings.professional.inactive', 'Inactive')}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
          {professional.specialization && (
            <span className="flex items-center gap-1">
              <PageIcon name="stethoscope" className="w-3 h-3" />
              {professional.specialization}
            </span>
          )}
          <span className="flex items-center gap-1">
            <PageIcon name="hash" className="w-3 h-3" />
            {professional.registrationNumber}
          </span>
          <span className="flex items-center gap-1">
            <PageIcon name="mail" className="w-3 h-3" />
            {professional.email}
          </span>
          {professional.phone && (
            <span className="flex items-center gap-1">
              <PageIcon name="phone" className="w-3 h-3" />
              {professional.phone}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
