/**
 * ItemCardSections Types
 *
 * Reusable section components for ItemCard and similar card components.
 *
 * @module item-card-sections/types
 */

import type { IconName } from '@pageshell/primitives';
import type { ReactNode } from 'react';

/**
 * Currency display configuration
 */
export interface CurrencyConfig {
  /** Currency code (e.g., 'USD', 'BRL') */
  currency?: string;
  /** Locale for formatting (e.g., 'en-US', 'pt-BR') */
  locale?: string;
}

/**
 * Props for PricingSection component
 */
export interface PricingSectionProps {
  /** Price in cents */
  priceCents: number;
  /** Optional original price for showing discounts */
  originalPriceCents?: number;
  /** Price period label (e.g., 'per session', 'per month') */
  period?: string;
  /** Discount percentage to display */
  discountPercent?: number;
  /** Label for the price (e.g., 'Total', 'Per session') */
  priceLabel?: string;
  /** Currency configuration */
  currency?: CurrencyConfig;
  /** Custom price formatter */
  formatPrice?: (cents: number) => string;
  /** Additional className */
  className?: string;
  /** Layout variant */
  variant?: 'default' | 'compact' | 'inline';
}

/**
 * Individual metric item configuration
 */
export interface MetricItem {
  /** Display label */
  label: string;
  /** Value (string or number) */
  value: string | number;
  /** Optional icon */
  icon?: IconName;
  /** Optional trend indicator */
  trend?: 'up' | 'down' | 'neutral';
  /** Optional suffix (e.g., '%', 'users') */
  suffix?: string;
}

/**
 * Props for MetricsSection component
 */
export interface MetricsSectionProps {
  /** Metric items to display */
  items: MetricItem[];
  /** Section title */
  title?: string;
  /** Layout columns */
  columns?: 1 | 2 | 3 | 4;
  /** Additional className */
  className?: string;
  /** Compact display mode */
  compact?: boolean;
}

/**
 * Props for StatusToggleSection component
 */
export interface StatusToggleSectionProps {
  /** Current status */
  status: 'active' | 'inactive';
  /** Toggle handler */
  onToggle: () => void;
  /** Whether toggle is disabled */
  disabled?: boolean;
  /** Whether toggle is loading */
  loading?: boolean;
  /** Label for active state */
  activeLabel?: string;
  /** Label for inactive state */
  inactiveLabel?: string;
  /** Additional className */
  className?: string;
  /** Aria label for the toggle */
  ariaLabel?: string;
}

/**
 * Savings display configuration
 */
export interface SavingsDisplayProps {
  /** Original price in cents */
  originalCents: number;
  /** Discounted price in cents */
  discountedCents: number;
  /** Custom savings label */
  label?: string;
  /** Currency configuration */
  currency?: CurrencyConfig;
  /** Custom price formatter */
  formatPrice?: (cents: number) => string;
  /** Additional className */
  className?: string;
}

/**
 * Props for ValiditySection component
 */
export interface ValiditySectionProps {
  /** Validity in months */
  months: number;
  /** Label text */
  label?: string;
  /** Additional className */
  className?: string;
}
