'use client';

/**
 * PagePaymentTracker - Payment tracking view
 *
 * Shows total amount, paid amount, remaining balance, a progress bar,
 * and a list of payment records.
 *
 * @example
 * ```tsx
 * <PagePaymentTracker
 *   totalAmount={{ value: 1000, currency: 'BRL' }}
 *   payments={[
 *     { id: '1', date: '2026-02-01', amount: { value: 500, currency: 'BRL' }, method: 'pix' },
 *   ]}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon } from '@parisgroup-ai/pageshell/primitives';

import type { PaymentRecord } from './types';
import type { MoneyAmount } from '../shared';

// =============================================================================
// Types
// =============================================================================

export interface PagePaymentTrackerProps {
  /** Total amount due */
  totalAmount: MoneyAmount;
  /** List of payment records */
  payments: PaymentRecord[];
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

function formatCurrency(amount: MoneyAmount): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: amount.currency }).format(amount.value);
}

const METHOD_ICON: Record<string, string> = {
  cash: 'banknote',
  'credit-card': 'credit-card',
  'debit-card': 'credit-card',
  pix: 'zap',
  'bank-transfer': 'building',
  insurance: 'shield',
};

// =============================================================================
// Component
// =============================================================================

export function PagePaymentTracker({ totalAmount, payments, className }: PagePaymentTrackerProps) {
  const paidTotal = payments.reduce((sum, p) => sum + p.amount.value, 0);
  const remaining = totalAmount.value - paidTotal;
  const progressPercent = totalAmount.value > 0 ? Math.min((paidTotal / totalAmount.value) * 100, 100) : 0;

  return (
    <div className={cn('rounded-lg border border-border bg-card p-4', className)}>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground">
            {tPageShell('domain.odonto.billing.tracker.total', 'Total')}
          </p>
          <p className="font-semibold text-sm">{formatCurrency(totalAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            {tPageShell('domain.odonto.billing.tracker.paid', 'Paid')}
          </p>
          <p className="font-semibold text-sm text-accent-foreground">
            {formatCurrency({ value: paidTotal, currency: totalAmount.currency })}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            {tPageShell('domain.odonto.billing.tracker.remaining', 'Remaining')}
          </p>
          <p className={cn('font-semibold text-sm', remaining > 0 ? 'text-destructive' : 'text-accent-foreground')}>
            {formatCurrency({ value: Math.max(remaining, 0), currency: totalAmount.currency })}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${progressPercent}%` }}
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={tPageShell('domain.odonto.billing.tracker.progress', 'Payment progress')}
        />
      </div>

      {/* Payment list */}
      {payments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {tPageShell('domain.odonto.billing.tracker.history', 'Payment History')}
          </h4>
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-2">
                <PageIcon
                  name={METHOD_ICON[payment.method] ?? 'circle'}
                  className="w-3.5 h-3.5 text-muted-foreground"
                />
                <span className="text-muted-foreground">{payment.date}</span>
                {payment.reference && (
                  <span className="text-xs text-muted-foreground">({payment.reference})</span>
                )}
              </div>
              <span className="font-medium">{formatCurrency(payment.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {payments.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          {tPageShell('domain.odonto.billing.tracker.noPayments', 'No payments recorded')}
        </p>
      )}
    </div>
  );
}
