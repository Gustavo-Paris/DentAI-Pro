'use client';

/**
 * PageBillingStats - Billing statistics cards
 *
 * Displays key financial metrics: total revenue, pending payments, overdue
 * amount, insurance claims count, and collection rate percentage.
 *
 * @example
 * ```tsx
 * <PageBillingStats
 *   stats={{
 *     totalRevenue: { value: 50000, currency: 'BRL' },
 *     pendingPayments: { value: 8000, currency: 'BRL' },
 *     overduePayments: { value: 2000, currency: 'BRL' },
 *     insuranceClaims: 12,
 *     collectionRate: 92.5,
 *   }}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon } from '@parisgroup-ai/pageshell/primitives';

import type { BillingStatsData } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PageBillingStatsProps {
  /** Billing statistics data */
  stats: BillingStatsData;
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

export function PageBillingStats({ stats, className }: PageBillingStatsProps) {
  const cards = [
    {
      label: tPageShell('domain.odonto.billing.stats.totalRevenue', 'Total Revenue'),
      value: formatCurrency(stats.totalRevenue),
      icon: 'dollar-sign' as const,
      color: 'text-accent-foreground',
    },
    {
      label: tPageShell('domain.odonto.billing.stats.pendingPayments', 'Pending Payments'),
      value: formatCurrency(stats.pendingPayments),
      icon: 'clock' as const,
      color: 'text-warning',
    },
    {
      label: tPageShell('domain.odonto.billing.stats.overduePayments', 'Overdue Payments'),
      value: formatCurrency(stats.overduePayments),
      icon: 'alert-triangle' as const,
      color: 'text-destructive',
    },
    {
      label: tPageShell('domain.odonto.billing.stats.insuranceClaims', 'Insurance Claims'),
      value: String(stats.insuranceClaims),
      icon: 'shield' as const,
      color: 'text-primary',
    },
    {
      label: tPageShell('domain.odonto.billing.stats.collectionRate', 'Collection Rate'),
      value: `${stats.collectionRate.toFixed(1)}%`,
      icon: 'trending-up' as const,
      color: stats.collectionRate >= 90 ? 'text-accent-foreground' : 'text-warning',
    },
  ];

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4', className)}>
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <PageIcon name={card.icon} className="w-4 h-4" />
            <span className="text-xs">{card.label}</span>
          </div>
          <p className={cn('text-lg font-semibold', card.color)}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
