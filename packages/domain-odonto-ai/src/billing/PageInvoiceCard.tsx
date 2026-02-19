'use client';

/**
 * PageInvoiceCard - Invoice summary card
 *
 * Displays an invoice with number, patient name, items summary, total amount,
 * due date, status badge, and payment method.
 *
 * @example
 * ```tsx
 * <PageInvoiceCard
 *   invoice={{
 *     id: '1',
 *     number: 'INV-2026-001',
 *     patientName: 'Maria Silva',
 *     patientId: 'p1',
 *     items: [{ description: 'Cleaning', quantity: 1, unitPrice: { value: 150, currency: 'BRL' }, total: { value: 150, currency: 'BRL' } }],
 *     total: { value: 150, currency: 'BRL' },
 *     status: 'pending',
 *     dueDate: '2026-03-01',
 *     createdAt: '2026-02-01',
 *     updatedAt: '2026-02-01',
 *   }}
 *   onSelect={(id) => console.log(id)}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon, StatusBadge } from '@parisgroup-ai/pageshell/primitives';

import type { InvoiceInfo } from './types';
import type { PaymentStatus } from '../shared';

// =============================================================================
// Types
// =============================================================================

export interface PageInvoiceCardProps {
  /** Invoice data to display */
  invoice: InvoiceInfo;
  /** Callback when the card is selected */
  onSelect?: (id: string) => void;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const STATUS_VARIANT: Record<PaymentStatus, 'muted' | 'warning' | 'accent' | 'destructive' | 'outline'> = {
  pending: 'muted',
  partial: 'warning',
  paid: 'accent',
  overdue: 'destructive',
  refunded: 'outline',
};

const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: tPageShell('domain.odonto.billing.invoice.statusPending', 'Pending'),
  partial: tPageShell('domain.odonto.billing.invoice.statusPartial', 'Partial'),
  paid: tPageShell('domain.odonto.billing.invoice.statusPaid', 'Paid'),
  overdue: tPageShell('domain.odonto.billing.invoice.statusOverdue', 'Overdue'),
  refunded: tPageShell('domain.odonto.billing.invoice.statusRefunded', 'Refunded'),
};

function formatCurrency(amount: { value: number; currency: string }): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: amount.currency }).format(amount.value);
}

// =============================================================================
// Component
// =============================================================================

export function PageInvoiceCard({ invoice, onSelect, className }: PageInvoiceCardProps) {
  const itemCount = invoice.items.length;

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/5 cursor-pointer',
        className,
      )}
      onClick={() => onSelect?.(invoice.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(invoice.id);
        }
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PageIcon name="file-text" className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">{invoice.number}</span>
        </div>
        <StatusBadge
          variant={STATUS_VARIANT[invoice.status]}
          label={STATUS_LABEL[invoice.status]}
        />
      </div>

      {/* Patient & Items */}
      <div className="text-sm">
        <p className="font-medium truncate">{invoice.patientName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {itemCount} {itemCount === 1
            ? tPageShell('domain.odonto.billing.invoice.item', 'item')
            : tPageShell('domain.odonto.billing.invoice.items', 'items')}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <PageIcon name="calendar" className="w-3 h-3" />
            {tPageShell('domain.odonto.billing.invoice.due', 'Due')}: {invoice.dueDate}
          </span>
          {invoice.paymentMethod && (
            <span className="flex items-center gap-1">
              <PageIcon name="credit-card" className="w-3 h-3" />
              {invoice.paymentMethod}
            </span>
          )}
        </div>
        <span className="font-semibold text-sm text-foreground">
          {formatCurrency(invoice.total)}
        </span>
      </div>
    </div>
  );
}
