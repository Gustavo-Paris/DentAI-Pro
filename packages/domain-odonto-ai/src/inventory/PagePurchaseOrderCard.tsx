'use client';

/**
 * PagePurchaseOrderCard - Purchase order summary card
 *
 * Displays a purchase order with order number, supplier, items count, total,
 * status badge, order date, and expected delivery date.
 *
 * @example
 * ```tsx
 * <PagePurchaseOrderCard
 *   order={{
 *     id: '1',
 *     orderNumber: 'PO-2026-001',
 *     supplier: 'DentalCorp',
 *     items: [{ name: 'Composite Resin', quantity: 10, unitPrice: { value: 89.9, currency: 'BRL' }, total: { value: 899, currency: 'BRL' } }],
 *     total: { value: 899, currency: 'BRL' },
 *     status: 'submitted',
 *     orderDate: '2026-02-10',
 *     expectedDelivery: '2026-02-20',
 *     createdAt: '2026-02-10',
 *     updatedAt: '2026-02-10',
 *   }}
 *   onSelect={(id) => console.log(id)}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon, StatusBadge } from '@parisgroup-ai/pageshell/primitives';

import type { PurchaseOrder } from './types';
import type { StatusVariant } from '@parisgroup-ai/pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

export interface PagePurchaseOrderCardProps {
  /** Purchase order data to display */
  order: PurchaseOrder;
  /** Callback when the card is selected */
  onSelect?: (id: string) => void;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

type OrderStatus = PurchaseOrder['status'];

const STATUS_VARIANT: Record<OrderStatus, StatusVariant> = {
  draft: 'muted',
  submitted: 'warning',
  delivered: 'accent',
  cancelled: 'destructive',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  draft: tPageShell('domain.odonto.inventory.order.statusDraft', 'Draft'),
  submitted: tPageShell('domain.odonto.inventory.order.statusSubmitted', 'Submitted'),
  delivered: tPageShell('domain.odonto.inventory.order.statusDelivered', 'Delivered'),
  cancelled: tPageShell('domain.odonto.inventory.order.statusCancelled', 'Cancelled'),
};

function formatCurrency(amount: { value: number; currency: string }): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: amount.currency }).format(amount.value);
}

// =============================================================================
// Component
// =============================================================================

export function PagePurchaseOrderCard({ order, onSelect, className }: PagePurchaseOrderCardProps) {
  const itemCount = order.items.length;

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/5 cursor-pointer',
        className,
      )}
      onClick={() => onSelect?.(order.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(order.id);
        }
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PageIcon name="clipboard-list" className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">{order.orderNumber}</span>
        </div>
        <StatusBadge
          variant={STATUS_VARIANT[order.status]}
          label={STATUS_LABEL[order.status]}
        />
      </div>

      {/* Supplier & Items */}
      <div className="text-sm">
        <p className="font-medium truncate">{order.supplier}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {itemCount} {itemCount === 1
            ? tPageShell('domain.odonto.inventory.order.item', 'item')
            : tPageShell('domain.odonto.inventory.order.items', 'items')}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <PageIcon name="calendar" className="w-3 h-3" />
            {tPageShell('domain.odonto.inventory.order.ordered', 'Ordered')}: {order.orderDate}
          </span>
          {order.expectedDelivery && (
            <span className="flex items-center gap-1">
              <PageIcon name="truck" className="w-3 h-3" />
              {tPageShell('domain.odonto.inventory.order.delivery', 'Delivery')}: {order.expectedDelivery}
            </span>
          )}
        </div>
        <span className="font-semibold text-sm text-foreground">
          {formatCurrency(order.total)}
        </span>
      </div>
    </div>
  );
}
