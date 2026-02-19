'use client';

/**
 * PageExpiryTracker - Expiring items tracker
 *
 * Displays a sorted list of items approaching their expiry date. Each item
 * shows name, batch, expiry date, quantity, and days until expiry with
 * color coding: red if 7 days or less, yellow if 30 days or less, green otherwise.
 *
 * @example
 * ```tsx
 * <PageExpiryTracker
 *   items={[
 *     {
 *       id: '1',
 *       name: 'Composite Resin A2',
 *       batch: 'LOT-2025-A',
 *       expiryDate: '2026-03-01',
 *       quantity: 5,
 *       unit: 'tubes',
 *       daysUntilExpiry: 11,
 *     },
 *   ]}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon } from '@parisgroup-ai/pageshell/primitives';

import type { ExpiryItem } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PageExpiryTrackerProps {
  /** List of items approaching expiry */
  items: ExpiryItem[];
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

function getExpiryColor(days: number): { text: string; bg: string; dot: string } {
  if (days <= 7) {
    return { text: 'text-destructive', bg: 'bg-destructive/10', dot: 'bg-destructive' };
  }
  if (days <= 30) {
    return { text: 'text-warning', bg: 'bg-warning/10', dot: 'bg-warning' };
  }
  return { text: 'text-accent', bg: 'bg-accent/10', dot: 'bg-accent' };
}

function getExpiryLabel(days: number): string {
  if (days <= 0) {
    return tPageShell('domain.odonto.inventory.expiry.expired', 'Expired');
  }
  if (days === 1) {
    return tPageShell('domain.odonto.inventory.expiry.oneDay', '1 day');
  }
  return `${days} ${tPageShell('domain.odonto.inventory.expiry.days', 'days')}`;
}

// =============================================================================
// Component
// =============================================================================

export function PageExpiryTracker({ items, className }: PageExpiryTrackerProps) {
  const sorted = [...items].sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

  if (sorted.length === 0) {
    return (
      <div className={cn('rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground', className)}>
        <PageIcon name="check-circle" className="w-8 h-8 mx-auto mb-2 text-accent" />
        {tPageShell('domain.odonto.inventory.expiry.noItems', 'No items expiring soon')}
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border border-border bg-card divide-y divide-border', className)}>
      {/* Header */}
      <div className="px-4 py-3 text-xs font-medium text-muted-foreground grid grid-cols-[1fr_auto_auto_auto] gap-4">
        <span>{tPageShell('domain.odonto.inventory.expiry.item', 'Item')}</span>
        <span className="text-right">{tPageShell('domain.odonto.inventory.expiry.quantity', 'Qty')}</span>
        <span className="text-right">{tPageShell('domain.odonto.inventory.expiry.expiryDate', 'Expiry')}</span>
        <span className="text-right w-20">{tPageShell('domain.odonto.inventory.expiry.remaining', 'Remaining')}</span>
      </div>

      {sorted.map((item) => {
        const color = getExpiryColor(item.daysUntilExpiry);
        return (
          <div
            key={item.id}
            className="px-4 py-3 grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center text-sm"
          >
            <div className="min-w-0">
              <p className="font-medium truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tPageShell('domain.odonto.inventory.expiry.batch', 'Batch')}: {item.batch}
              </p>
            </div>
            <span className="text-muted-foreground text-right">
              {item.quantity} {item.unit}
            </span>
            <span className="text-muted-foreground text-right">{item.expiryDate}</span>
            <span className={cn('text-right w-20 inline-flex items-center justify-end gap-1.5 font-medium text-xs', color.text)}>
              <span className={cn('w-2 h-2 rounded-full flex-shrink-0', color.dot)} />
              {getExpiryLabel(item.daysUntilExpiry)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
