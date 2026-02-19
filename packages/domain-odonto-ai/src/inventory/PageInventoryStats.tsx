'use client';

/**
 * PageInventoryStats - Inventory statistics overview
 *
 * Displays stats cards for total items, low stock count, critical count,
 * expiring this month, and total inventory value.
 *
 * @example
 * ```tsx
 * <PageInventoryStats
 *   stats={{
 *     totalItems: 245,
 *     lowStockItems: 12,
 *     criticalItems: 3,
 *     expiringThisMonth: 8,
 *     totalValue: { value: 45000, currency: 'BRL' },
 *   }}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon } from '@parisgroup-ai/pageshell/primitives';

import type { InventoryStatsData } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PageInventoryStatsProps {
  /** Inventory statistics data */
  stats: InventoryStatsData;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

function formatCurrency(amount: { value: number; currency: string }): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: amount.currency }).format(amount.value);
}

// =============================================================================
// Component
// =============================================================================

export function PageInventoryStats({ stats, className }: PageInventoryStatsProps) {
  const cards = [
    {
      label: tPageShell('domain.odonto.inventory.stats.totalItems', 'Total Items'),
      value: String(stats.totalItems),
      icon: 'package',
      color: 'text-primary',
    },
    {
      label: tPageShell('domain.odonto.inventory.stats.lowStock', 'Low Stock'),
      value: String(stats.lowStockItems),
      icon: 'alert-triangle',
      color: 'text-warning',
    },
    {
      label: tPageShell('domain.odonto.inventory.stats.critical', 'Critical'),
      value: String(stats.criticalItems),
      icon: 'alert-circle',
      color: 'text-destructive',
    },
    {
      label: tPageShell('domain.odonto.inventory.stats.expiringThisMonth', 'Expiring This Month'),
      value: String(stats.expiringThisMonth),
      icon: 'clock',
      color: 'text-warning',
    },
    {
      label: tPageShell('domain.odonto.inventory.stats.totalValue', 'Total Value'),
      value: formatCurrency(stats.totalValue),
      icon: 'dollar-sign',
      color: 'text-accent',
    },
  ];

  return (
    <div className={cn('grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5', className)}>
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2">
            <PageIcon name={card.icon} className={cn('w-4 h-4', card.color)} />
            <span className="text-xs text-muted-foreground">{card.label}</span>
          </div>
          <span className="text-lg font-semibold">{card.value}</span>
        </div>
      ))}
    </div>
  );
}
