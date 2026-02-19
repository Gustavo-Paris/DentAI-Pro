'use client';

/**
 * PageInsuranceProviderList - Insurance provider listing
 *
 * Displays a searchable list of insurance provider cards showing name,
 * code, contact info, active status, and associated plans.
 *
 * @example
 * ```tsx
 * <PageInsuranceProviderList
 *   providers={[
 *     {
 *       id: '1',
 *       name: 'Unimed',
 *       code: 'UNI-001',
 *       contactPhone: '(11) 3000-0000',
 *       contactEmail: 'contato@unimed.com',
 *       active: true,
 *       plans: ['Basic', 'Premium'],
 *       createdAt: '2025-01-01',
 *       updatedAt: '2026-02-10',
 *     },
 *   ]}
 *   onSelect={(id) => console.log(id)}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon, StatusBadge } from '@parisgroup-ai/pageshell/primitives';

import type { InsuranceProvider } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PageInsuranceProviderListProps {
  /** List of insurance providers */
  providers: InsuranceProvider[];
  /** Callback when a provider is selected */
  onSelect?: (id: string) => void;
  /** Search query for filtering */
  searchQuery?: string;
  /** Callback when search query changes */
  onSearchChange?: (query: string) => void;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function PageInsuranceProviderList({
  providers,
  onSelect,
  searchQuery = '',
  onSearchChange,
  className,
}: PageInsuranceProviderListProps) {
  const filtered = searchQuery
    ? providers.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.code.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : providers;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search */}
      <div className="relative">
        <PageIcon
          name="search"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
        />
        <input
          type="text"
          defaultValue={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={tPageShell('domain.odonto.settings.insurance.searchPlaceholder', 'Search providers...')}
          className="w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={tPageShell('domain.odonto.settings.insurance.searchLabel', 'Search insurance providers')}
        />
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((provider) => (
          <div
            key={provider.id}
            role="button"
            tabIndex={0}
            className={cn(
              'rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/5 cursor-pointer',
              !provider.active && 'opacity-60',
            )}
            onClick={() => onSelect?.(provider.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect?.(provider.id);
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">{provider.name}</h4>
                <span className="text-xs text-muted-foreground font-mono">{provider.code}</span>
              </div>
              <StatusBadge
                variant={provider.active ? 'accent' : 'outline'}
                label={
                  provider.active
                    ? tPageShell('domain.odonto.settings.insurance.active', 'Active')
                    : tPageShell('domain.odonto.settings.insurance.inactive', 'Inactive')
                }
              />
            </div>

            {/* Contact Info */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
              {provider.contactPhone && (
                <span className="flex items-center gap-1">
                  <PageIcon name="phone" className="w-3 h-3" />
                  {provider.contactPhone}
                </span>
              )}
              {provider.contactEmail && (
                <span className="flex items-center gap-1">
                  <PageIcon name="mail" className="w-3 h-3" />
                  {provider.contactEmail}
                </span>
              )}
            </div>

            {/* Plans */}
            {provider.plans && provider.plans.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-xs text-muted-foreground">
                  {tPageShell('domain.odonto.settings.insurance.plans', 'Plans')}:
                </span>
                {provider.plans.map((plan) => (
                  <span
                    key={plan}
                    className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {plan}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            {tPageShell('domain.odonto.settings.insurance.empty', 'No insurance providers found')}
          </p>
        )}
      </div>
    </div>
  );
}
