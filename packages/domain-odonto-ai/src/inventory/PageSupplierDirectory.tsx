'use client';

/**
 * PageSupplierDirectory - Supplier listing with search
 *
 * Displays a searchable directory of suppliers with name, contact person,
 * phone, email, category badges, and active status.
 *
 * @example
 * ```tsx
 * <PageSupplierDirectory
 *   suppliers={[
 *     {
 *       id: '1',
 *       name: 'DentalCorp',
 *       contactPerson: 'Carlos Mendes',
 *       phone: '(11) 3333-4444',
 *       email: 'contato@dentalcorp.com',
 *       categories: ['Restorative', 'Endodontics'],
 *       active: true,
 *       createdAt: '2025-01-01',
 *       updatedAt: '2026-02-10',
 *     },
 *   ]}
 *   onSelect={(id) => console.log(id)}
 * />
 * ```
 */

import { useState } from 'react';
import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon, StatusBadge } from '@parisgroup-ai/pageshell/primitives';

import type { SupplierInfo } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PageSupplierDirectoryProps {
  /** List of suppliers to display */
  suppliers: SupplierInfo[];
  /** Callback when a supplier is selected */
  onSelect?: (id: string) => void;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function PageSupplierDirectory({
  suppliers,
  onSelect,
  className,
}: PageSupplierDirectoryProps) {
  const [search, setSearch] = useState('');

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Search */}
      <div className="relative">
        <PageIcon
          name="search"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tPageShell('domain.odonto.inventory.supplier.searchPlaceholder', 'Search suppliers...')}
          className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          {tPageShell('domain.odonto.inventory.supplier.noResults', 'No suppliers found')}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((supplier) => (
            <div
              key={supplier.id}
              role="button"
              tabIndex={0}
              className="flex items-start gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/5 cursor-pointer"
              onClick={() => onSelect?.(supplier.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect?.(supplier.id);
                }
              }}
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <PageIcon name="building" className="w-5 h-5" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm truncate">{supplier.name}</h3>
                  <StatusBadge
                    variant={supplier.active ? 'accent' : 'muted'}
                    label={
                      supplier.active
                        ? tPageShell('domain.odonto.inventory.supplier.active', 'Active')
                        : tPageShell('domain.odonto.inventory.supplier.inactive', 'Inactive')
                    }
                  />
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                  {supplier.contactPerson && (
                    <span className="flex items-center gap-1">
                      <PageIcon name="user" className="w-3 h-3" />
                      {supplier.contactPerson}
                    </span>
                  )}
                  {supplier.phone && (
                    <span className="flex items-center gap-1">
                      <PageIcon name="phone" className="w-3 h-3" />
                      {supplier.phone}
                    </span>
                  )}
                  {supplier.email && (
                    <span className="flex items-center gap-1">
                      <PageIcon name="mail" className="w-3 h-3" />
                      {supplier.email}
                    </span>
                  )}
                </div>

                {/* Categories */}
                {supplier.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {supplier.categories.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
