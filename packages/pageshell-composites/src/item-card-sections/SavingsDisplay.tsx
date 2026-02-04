'use client';

/**
 * SavingsDisplay Component
 *
 * Displays savings amount calculated from original and discounted prices.
 *
 * @module item-card-sections
 */

import { cn } from '@pageshell/core';
import type { SavingsDisplayProps } from './types';

/**
 * Default price formatter (cents to dollars)
 */
const defaultFormatPrice = (cents: number, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
};

/**
 * SavingsDisplay - Shows calculated savings
 *
 * @example
 * ```tsx
 * <SavingsDisplay
 *   originalCents={10000}
 *   discountedCents={8500}
 *   label="You save"
 * />
 * ```
 */
export function SavingsDisplay({
  originalCents,
  discountedCents,
  label = 'Savings',
  currency,
  formatPrice,
  className,
}: SavingsDisplayProps) {
  const savings = originalCents - discountedCents;

  if (savings <= 0) return null;

  const format = formatPrice ?? ((cents: number) =>
    defaultFormatPrice(cents, currency?.currency, currency?.locale));

  return (
    <div className={cn('flex justify-between items-center text-sm', className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-success">{format(savings)}</span>
    </div>
  );
}

SavingsDisplay.displayName = 'SavingsDisplay';
