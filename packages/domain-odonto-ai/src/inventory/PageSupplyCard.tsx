'use client';

/**
 * PageSupplyCard - Supply item card
 *
 * Displays a dental supply item with name, SKU, category, stock levels,
 * stock-level badge (color coded), unit price, and expiry date.
 *
 * @example
 * ```tsx
 * <PageSupplyCard
 *   item={{
 *     id: '1',
 *     name: 'Composite Resin A2',
 *     sku: 'MAT-001',
 *     category: 'Restorative',
 *     currentStock: 25,
 *     minimumStock: 10,
 *     unit: 'tubes',
 *     stockLevel: 'adequate',
 *     unitPrice: { value: 89.9, currency: 'BRL' },
 *     expiryDate: '2026-12-31',
 *     createdAt: '2025-01-01',
 *     updatedAt: '2026-02-10',
 *   }}
 *   onSelect={(id) => console.log(id)}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon, StatusBadge } from '@parisgroup-ai/pageshell/primitives';

import type { SupplyItem } from './types';
import type { StockLevel } from '../shared';

// =============================================================================
// Types
// =============================================================================

export interface PageSupplyCardProps {
  /** Supply item data to display */
  item: SupplyItem;
  /** Callback when the card is selected */
  onSelect?: (id: string) => void;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const STOCK_VARIANT: Record<StockLevel, 'accent' | 'warning' | 'destructive'> = {
  adequate: 'accent',
  low: 'warning',
  critical: 'destructive',
  'out-of-stock': 'destructive',
};

const STOCK_LABEL: Record<StockLevel, string> = {
  adequate: tPageShell('domain.odonto.inventory.supply.stockAdequate', 'Adequate'),
  low: tPageShell('domain.odonto.inventory.supply.stockLow', 'Low'),
  critical: tPageShell('domain.odonto.inventory.supply.stockCritical', 'Critical'),
  'out-of-stock': tPageShell('domain.odonto.inventory.supply.stockOutOfStock', 'Out of Stock'),
};

function formatCurrency(amount: { value: number; currency: string }): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: amount.currency }).format(amount.value);
}

// =============================================================================
// Component
// =============================================================================

export function PageSupplyCard({ item, onSelect, className }: PageSupplyCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/5 cursor-pointer',
        className,
      )}
      onClick={() => onSelect?.(item.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(item.id);
        }
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{item.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tPageShell('domain.odonto.inventory.supply.sku', 'SKU')}: {item.sku}
          </p>
        </div>
        <StatusBadge
          variant={STOCK_VARIANT[item.stockLevel]}
          label={STOCK_LABEL[item.stockLevel]}
        />
      </div>

      {/* Stock & Category */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <PageIcon name="layers" className="w-3 h-3" />
          {item.category}
        </span>
        <span className="flex items-center gap-1">
          <PageIcon name="package" className="w-3 h-3" />
          {item.currentStock} / {item.minimumStock} {item.unit}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2">
        <div className="flex items-center gap-3">
          {item.expiryDate && (
            <span className="flex items-center gap-1">
              <PageIcon name="calendar" className="w-3 h-3" />
              {tPageShell('domain.odonto.inventory.supply.expires', 'Expires')}: {item.expiryDate}
            </span>
          )}
          {item.supplier && (
            <span className="flex items-center gap-1">
              <PageIcon name="truck" className="w-3 h-3" />
              {item.supplier}
            </span>
          )}
        </div>
        <span className="font-semibold text-sm text-foreground">
          {formatCurrency(item.unitPrice)}
        </span>
      </div>
    </div>
  );
}
