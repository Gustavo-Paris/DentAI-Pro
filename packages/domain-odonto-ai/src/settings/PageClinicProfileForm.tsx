'use client';

/**
 * PageClinicProfileForm - Clinic profile editing form
 *
 * Displays a form for editing clinic information including name, address,
 * phone, email, website, logo upload placeholder, and registration number.
 *
 * @example
 * ```tsx
 * <PageClinicProfileForm
 *   profile={{
 *     id: '1',
 *     name: 'Dental Care Clinic',
 *     address: 'Rua Principal, 100',
 *     phone: '(11) 3000-0000',
 *     email: 'contato@dentalcare.com',
 *     registrationNumber: 'CRO-SP 12345',
 *     createdAt: '2025-01-01',
 *     updatedAt: '2026-02-10',
 *   }}
 *   onSubmit={(data) => console.log(data)}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { Button, PageIcon } from '@parisgroup-ai/pageshell/primitives';

import type { ClinicProfile } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PageClinicProfileFormProps {
  /** Current clinic profile data */
  profile: ClinicProfile;
  /** Callback when the form is submitted */
  onSubmit?: (profile: ClinicProfile) => void;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Sub-components
// =============================================================================

function FormField({
  label,
  value,
  icon,
  type = 'text',
  required,
}: {
  label: string;
  value?: string;
  icon: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <PageIcon name={icon} className="w-3.5 h-3.5 text-muted-foreground" />
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      <input
        type={type}
        defaultValue={value}
        required={required}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={label}
      />
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function PageClinicProfileForm({
  profile,
  onSubmit,
  className,
}: PageClinicProfileFormProps) {
  return (
    <form
      className={cn('space-y-6', className)}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(profile);
      }}
    >
      {/* Logo placeholder */}
      <div className="flex items-center gap-4">
        {profile.logoUrl ? (
          <img
            src={profile.logoUrl}
            alt={profile.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <PageIcon name="building" className="w-8 h-8" />
          </div>
        )}
        <div>
          <p className="text-sm font-medium">{tPageShell('domain.odonto.settings.clinicProfile.logo', 'Clinic Logo')}</p>
          <p className="text-xs text-muted-foreground">
            {tPageShell('domain.odonto.settings.clinicProfile.logoHint', 'Upload a logo for your clinic')}
          </p>
        </div>
      </div>

      {/* Fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label={tPageShell('domain.odonto.settings.clinicProfile.name', 'Clinic Name')}
          value={profile.name}
          icon="building"
          required
        />
        <FormField
          label={tPageShell('domain.odonto.settings.clinicProfile.registrationNumber', 'Registration Number')}
          value={profile.registrationNumber}
          icon="hash"
          required
        />
        <div className="sm:col-span-2">
          <FormField
            label={tPageShell('domain.odonto.settings.clinicProfile.address', 'Address')}
            value={profile.address}
            icon="map-pin"
            required
          />
        </div>
        <FormField
          label={tPageShell('domain.odonto.settings.clinicProfile.phone', 'Phone')}
          value={profile.phone}
          icon="phone"
          type="tel"
          required
        />
        <FormField
          label={tPageShell('domain.odonto.settings.clinicProfile.email', 'Email')}
          value={profile.email}
          icon="mail"
          type="email"
          required
        />
        <FormField
          label={tPageShell('domain.odonto.settings.clinicProfile.website', 'Website')}
          value={profile.website}
          icon="globe"
          type="url"
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit">
          <PageIcon name="save" className="w-4 h-4 mr-2" />
          {tPageShell('domain.odonto.settings.clinicProfile.save', 'Save Profile')}
        </Button>
      </div>
    </form>
  );
}
