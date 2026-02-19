/**
 * Inventory subdomain
 *
 * Dental supplies, materials tracking, stock alerts, and purchase orders.
 *
 * @example
 * ```tsx
 * import { PageSupplyCard, PageStockAlertBanner } from '@parisgroup-ai/domain-odonto-ai/inventory';
 * ```
 */

// Types
export type {
  SupplyItem,
  StockAlert,
  InventoryStatsData,
  PurchaseOrder,
  PurchaseOrderItem,
  ExpiryItem,
  SupplierInfo,
} from './types';

// Components
export { PageSupplyCard } from './PageSupplyCard';
export type { PageSupplyCardProps } from './PageSupplyCard';

export { PageStockAlertBanner } from './PageStockAlertBanner';
export type { PageStockAlertBannerProps } from './PageStockAlertBanner';

export { PageInventoryStats } from './PageInventoryStats';
export type { PageInventoryStatsProps } from './PageInventoryStats';

export { PagePurchaseOrderCard } from './PagePurchaseOrderCard';
export type { PagePurchaseOrderCardProps } from './PagePurchaseOrderCard';

export { PageExpiryTracker } from './PageExpiryTracker';
export type { PageExpiryTrackerProps } from './PageExpiryTracker';

export { PageSupplierDirectory } from './PageSupplierDirectory';
export type { PageSupplierDirectoryProps } from './PageSupplierDirectory';
