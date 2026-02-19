import type { BaseEntity, StockLevel, MoneyAmount } from '../shared';

export interface SupplyItem extends BaseEntity {
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  unit: string;
  stockLevel: StockLevel;
  unitPrice: MoneyAmount;
  expiryDate?: string;
  supplier?: string;
}

export interface StockAlert {
  id: string;
  itemName: string;
  itemId: string;
  level: StockLevel;
  currentStock: number;
  minimumStock: number;
  unit: string;
}

export interface InventoryStatsData {
  totalItems: number;
  lowStockItems: number;
  criticalItems: number;
  expiringThisMonth: number;
  totalValue: MoneyAmount;
}

export interface PurchaseOrder extends BaseEntity {
  orderNumber: string;
  supplier: string;
  items: PurchaseOrderItem[];
  total: MoneyAmount;
  status: 'draft' | 'submitted' | 'delivered' | 'cancelled';
  orderDate: string;
  expectedDelivery?: string;
}

export interface PurchaseOrderItem {
  name: string;
  quantity: number;
  unitPrice: MoneyAmount;
  total: MoneyAmount;
}

export interface ExpiryItem {
  id: string;
  name: string;
  batch: string;
  expiryDate: string;
  quantity: number;
  unit: string;
  daysUntilExpiry: number;
}

export interface SupplierInfo extends BaseEntity {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  categories: string[];
  active: boolean;
}
