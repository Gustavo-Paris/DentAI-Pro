'use client';

/**
 * PricingSection Component
 *
 * Reusable pricing display for cards with price, original price,
 * and discount information.
 *
 * @module item-card-sections
 */

import { cn } from '@pageshell/core';
import type { PricingSectionProps } from './types';

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
 * PricingSection - Displays pricing information
 *
 * @example
 * ```tsx
 * <PricingSection
 *   priceCents={4999}
 *   originalPriceCents={5999}
 *   discountPercent={15}
 *   priceLabel="Total"
 * />
 * ```
 */
export function PricingSection({
  priceCents,
  originalPriceCents,
  period,
  discountPercent,
  priceLabel,
  currency,
  formatPrice,
  className,
  variant = 'default',
}: PricingSectionProps) {
  const format = formatPrice ?? ((cents: number) =>
    defaultFormatPrice(cents, currency?.currency, currency?.locale));

  const hasDiscount = originalPriceCents && originalPriceCents > priceCents;

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {priceLabel && (
          <span className="text-sm text-muted-foreground">{priceLabel}</span>
        )}
        {hasDiscount && (
          <span className="line-through text-muted-foreground text-sm">
            {format(originalPriceCents)}
          </span>
        )}
        <span className="font-semibold">{format(priceCents)}</span>
        {period && (
          <span className="text-sm text-muted-foreground">/{period}</span>
        )}
        {discountPercent && (
          <span className="text-xs font-medium text-success">
            -{discountPercent}%
          </span>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('space-y-1', className)}>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold">{format(priceCents)}</span>
          {period && (
            <span className="text-xs text-muted-foreground">/{period}</span>
          )}
        </div>
        {hasDiscount && (
          <div className="flex items-center gap-2 text-sm">
            <span className="line-through text-muted-foreground">
              {format(originalPriceCents)}
            </span>
            {discountPercent && (
              <span className="text-success font-medium">-{discountPercent}%</span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('space-y-2', className)}>
      {priceLabel && (
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-muted-foreground">{priceLabel}</span>
          <span className="text-2xl font-bold">{format(priceCents)}</span>
        </div>
      )}

      {hasDiscount && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Original</span>
          <div className="flex items-center gap-2">
            <span className="line-through text-muted-foreground">
              {format(originalPriceCents)}
            </span>
            <span className="font-medium text-success">
              {format(priceCents)}
            </span>
          </div>
        </div>
      )}

      {discountPercent && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Discount</span>
          <span className="font-medium text-success">-{discountPercent}%</span>
        </div>
      )}
    </div>
  );
}

PricingSection.displayName = 'PricingSection';
