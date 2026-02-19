'use client';

/**
 * PagePaymentMethodBadge - Compact payment method badge
 *
 * Shows a compact badge with an icon and label for the given payment method.
 *
 * @example
 * ```tsx
 * <PagePaymentMethodBadge method="pix" />
 * <PagePaymentMethodBadge method="credit-card" />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon } from '@parisgroup-ai/pageshell/primitives';

import type { PaymentMethod } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PagePaymentMethodBadgeProps {
  /** Payment method to display */
  method: PaymentMethod;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const METHOD_CONFIG: Record<PaymentMethod, { icon: string; label: string }> = {
  cash: {
    icon: 'banknote',
    label: tPageShell('domain.odonto.billing.method.cash', 'Cash'),
  },
  'credit-card': {
    icon: 'credit-card',
    label: tPageShell('domain.odonto.billing.method.creditCard', 'Credit Card'),
  },
  'debit-card': {
    icon: 'credit-card',
    label: tPageShell('domain.odonto.billing.method.debitCard', 'Debit Card'),
  },
  pix: {
    icon: 'zap',
    label: tPageShell('domain.odonto.billing.method.pix', 'Pix'),
  },
  'bank-transfer': {
    icon: 'building',
    label: tPageShell('domain.odonto.billing.method.bankTransfer', 'Bank Transfer'),
  },
  insurance: {
    icon: 'shield',
    label: tPageShell('domain.odonto.billing.method.insurance', 'Insurance'),
  },
};

// =============================================================================
// Component
// =============================================================================

export function PagePaymentMethodBadge({ method, className }: PagePaymentMethodBadgeProps) {
  const config = METHOD_CONFIG[method];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground',
        className,
      )}
    >
      <PageIcon name={config.icon} className="w-3 h-3" />
      {config.label}
    </span>
  );
}
