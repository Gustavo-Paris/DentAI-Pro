'use client';

/**
 * PageStockAlertBanner - Alert banner for low/critical stock items
 *
 * Displays stacked alert banners for items with low or critical stock levels.
 * Color and icon vary by severity level.
 *
 * @example
 * ```tsx
 * <PageStockAlertBanner
 *   alerts={[
 *     {
 *       id: '1',
 *       itemName: 'Composite Resin A2',
 *       itemId: 'item-1',
 *       level: 'critical',
 *       currentStock: 2,
 *       minimumStock: 10,
 *       unit: 'tubes',
 *     },
 *   ]}
 *   onDismiss={(id) => console.log('dismissed', id)}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon } from '@parisgroup-ai/pageshell/primitives';

import type { StockAlert } from './types';
import type { StockLevel } from '../shared';

// =============================================================================
// Types
// =============================================================================

export interface PageStockAlertBannerProps {
  /** List of stock alerts to display */
  alerts: StockAlert[];
  /** Callback when an alert is dismissed */
  onDismiss?: (id: string) => void;
  /** Callback when clicking the item name */
  onNavigate?: (itemId: string) => void;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const ALERT_STYLES: Record<StockLevel, { bg: string; border: string; text: string; icon: string }> = {
  critical: {
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    text: 'text-destructive',
    icon: 'alert-circle',
  },
  'out-of-stock': {
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    text: 'text-destructive',
    icon: 'x-circle',
  },
  low: {
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    text: 'text-warning',
    icon: 'alert-triangle',
  },
  adequate: {
    bg: 'bg-accent/10',
    border: 'border-accent/30',
    text: 'text-accent',
    icon: 'check-circle',
  },
};

const LEVEL_LABEL: Record<StockLevel, string> = {
  critical: tPageShell('domain.odonto.inventory.alert.critical', 'Critical'),
  'out-of-stock': tPageShell('domain.odonto.inventory.alert.outOfStock', 'Out of Stock'),
  low: tPageShell('domain.odonto.inventory.alert.low', 'Low Stock'),
  adequate: tPageShell('domain.odonto.inventory.alert.adequate', 'Adequate'),
};

// =============================================================================
// Component
// =============================================================================

export function PageStockAlertBanner({
  alerts,
  onDismiss,
  onNavigate,
  className,
}: PageStockAlertBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {alerts.map((alert) => {
        const style = ALERT_STYLES[alert.level];
        return (
          <div
            key={alert.id}
            className={cn(
              'flex items-center gap-3 rounded-lg border p-3',
              style.bg,
              style.border,
            )}
          >
            <PageIcon name={style.icon} className={cn('w-4 h-4 flex-shrink-0', style.text)} />

            <div className="flex-1 min-w-0 text-sm">
              <span className={cn('font-medium', style.text)}>
                {LEVEL_LABEL[alert.level]}:
              </span>{' '}
              <button
                type="button"
                className="font-medium underline-offset-2 hover:underline"
                onClick={() => onNavigate?.(alert.itemId)}
              >
                {alert.itemName}
              </button>
              <span className="text-muted-foreground">
                {' '}&mdash; {alert.currentStock} / {alert.minimumStock} {alert.unit}
              </span>
            </div>

            {onDismiss && (
              <button
                type="button"
                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => onDismiss(alert.id)}
                aria-label={tPageShell('domain.odonto.inventory.alert.dismiss', 'Dismiss')}
              >
                <PageIcon name="x" className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
