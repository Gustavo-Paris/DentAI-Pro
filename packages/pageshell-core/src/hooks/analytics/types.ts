/**
 * Analytics Logic Types
 *
 * @module hooks/analytics
 */

import type { ComponentType, SVGProps } from 'react';

// =============================================================================
// Icon Types
// =============================================================================

/**
 * Icon component type (compatible with Lucide icons)
 */
export type AnalyticsIconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;

// =============================================================================
// Date Range Types
// =============================================================================

/**
 * Date range configuration
 */
export interface AnalyticsDateRangeConfig {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Number of days (omit for "all time") */
  days?: number;
  /** Custom start date function */
  getStartDate?: () => Date;
  /** Custom end date function */
  getEndDate?: () => Date;
}

/**
 * Computed date range result
 */
export interface AnalyticsDateRangeResult {
  /** Range ID */
  rangeId: string;
  /** Start date */
  start: Date;
  /** End date */
  end: Date;
  /** Range label */
  label: string;
  /** Number of days in range */
  dayCount: number;
}

// =============================================================================
// KPI Types
// =============================================================================

/**
 * KPI configuration
 */
export interface AnalyticsKPIConfig<TData = unknown> {
  /** Key in data to extract value (used if getValue not provided) */
  key: string;
  /** Display label */
  label: string;
  /** Icon */
  icon?: AnalyticsIconComponent;
  /** Icon color */
  iconColor?: 'violet' | 'emerald' | 'amber' | 'blue' | 'cyan' | 'red';
  /** Value format */
  format?: 'number' | 'currency' | 'percent' | 'duration' | 'custom';
  /** Custom format function */
  formatValue?: (value: unknown) => string;
  /** Helper text (can reference data) */
  helper?: string | ((value: unknown, data: TData) => string);
  /** Get icon color dynamically */
  getIconColor?: (value: unknown, data: TData) => string;
  /** Custom value extractor (overrides key-based extraction) */
  getValue?: (data: TData) => unknown;
  /** Get comparison value from previous period data */
  getComparisonValue?: (data: TData) => unknown;
  /** Card variant */
  cardVariant?: 'default' | 'glow' | 'outline';
}

/**
 * Trend information for KPI comparison
 */
export interface AnalyticsTrend {
  value: number;
  direction: 'up' | 'down' | 'neutral';
  formatted: string;
}

/**
 * Computed KPI with value and formatting
 */
export interface AnalyticsKPIComputed {
  /** KPI key */
  key: string;
  /** Display label */
  label: string;
  /** Raw value */
  value: unknown;
  /** Formatted value string */
  formattedValue: string;
  /** Icon */
  icon?: AnalyticsIconComponent;
  /** Icon color */
  iconColor?: string;
  /** Helper text */
  helper?: string;
  /** Card variant */
  cardVariant?: 'default' | 'glow' | 'outline';
  /** Trend information (if comparison enabled) */
  trend?: AnalyticsTrend;
  /** Animation delay index */
  animationDelay: number;
}

// =============================================================================
// Hook Options
// =============================================================================

/**
 * useAnalyticsLogic options
 */
export interface UseAnalyticsLogicOptions<TData = unknown> {
  // Date ranges
  /** Available date ranges */
  dateRanges: AnalyticsDateRangeConfig[];
  /** Default range ID */
  defaultRange?: string;
  /** Controlled range ID */
  activeRange?: string;
  /** Range change callback */
  onRangeChange?: (rangeId: string) => void;

  // KPIs
  /** KPI configurations */
  kpis?: AnalyticsKPIConfig<TData>[];

  // Data
  /** Current data */
  data?: TData | null;
  /** Comparison data (previous period) */
  comparisonData?: TData | null;

  // Comparison
  /** Enable comparison with previous period */
  enableComparison?: boolean;

  // Formatting
  /** Locale for number formatting */
  locale?: string;
  /** Currency code */
  currency?: string;
}

// =============================================================================
// Hook Return Type
// =============================================================================

/**
 * useAnalyticsLogic return value
 */
export interface UseAnalyticsLogicReturn<TData> {
  // Date range state
  /** Current range ID */
  rangeId: string;
  /** Available ranges */
  ranges: AnalyticsDateRangeConfig[];
  /** Current computed date range */
  dateRange: AnalyticsDateRangeResult;
  /** Comparison date range (if enabled) */
  comparisonDateRange: AnalyticsDateRangeResult | null;

  // KPIs
  /** Computed KPIs with values */
  computedKpis: AnalyticsKPIComputed[];

  // Actions
  /** Set date range */
  setRange: (rangeId: string) => void;

  // Utilities
  /** Get value from data by key path */
  getDataValue: (key: string) => unknown;
  /** Format value based on type */
  formatValue: (value: unknown, format?: AnalyticsKPIConfig['format'], customFormatter?: (v: unknown) => string) => string;
  /** Calculate trend between two values */
  calculateTrend: (current: number, previous: number) => AnalyticsTrend;

  // Data setter (for external query integration)
  /** Set data for KPI computation */
  setData: (data: TData | null) => void;
  /** Set comparison data */
  setComparisonData: (data: TData | null) => void;

  // Configuration
  /** Is comparison enabled */
  isComparisonEnabled: boolean;
  /** Current locale */
  locale: string;
  /** Current currency */
  currency: string;
}
