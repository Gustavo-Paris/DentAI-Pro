/**
 * AnalyticsPage Types
 *
 * Type definitions for the AnalyticsPage composite.
 *
 * @module analytics/types
 */

import type { ReactNode } from 'react';
import type { IconProp } from '@pageshell/primitives';
import type {
  CompositeBaseProps,
  CompositeQueryResult,
  EmptyStateConfig,
} from '../shared/types';

// =============================================================================
// Date Range
// =============================================================================

/**
 * Date range configuration
 */
export interface AnalyticsDateRange {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Number of days (omit for "all time") */
  days?: number;
  /** Custom start date function */
  getStartDate?: () => Date;
}

/**
 * Date range result passed to query
 */
export interface DateRangeResult {
  /** Start date */
  start: Date;
  /** End date */
  end: Date;
  /** Range ID */
  rangeId: string;
  /** Range label (e.g., "Last 7 days") */
  label: string;
  /** Number of days in range */
  dayCount: number;
}

// =============================================================================
// KPI
// =============================================================================

/**
 * KPI configuration
 */
export interface AnalyticsKPI<T = unknown> {
  /** Key in data to extract value */
  key: string;
  /** Display label */
  label: string;
  /** Icon - accepts string name (e.g., 'chart', 'trending-up') or ComponentType */
  icon?: IconProp;
  /** Icon color */
  iconColor?: 'violet' | 'emerald' | 'amber' | 'blue' | 'cyan' | 'red';
  /** Value format */
  format?: 'number' | 'currency' | 'percent' | 'duration' | 'custom';
  /** Custom format function */
  formatValue?: (value: unknown) => string;
  /** Helper text */
  helper?: string | ((value: unknown, data: unknown) => string);
  /** Click handler for drill-down */
  onClick?: (value: unknown, data: T) => void;
}

// =============================================================================
// Chart
// =============================================================================

/**
 * Chart slot configuration
 */
export interface AnalyticsChartSlot<T> {
  /** Chart title */
  title?: string;
  /** Chart description */
  description?: string;
  /** Render the chart */
  render: (data: T, dateRange: string) => ReactNode;
}

// =============================================================================
// Slots
// =============================================================================

/**
 * Slots for AnalyticsPage customization
 */
export interface AnalyticsPageSlots<T> {
  /** Content before date selector */
  beforeDateSelector?: ReactNode;
  /** Content after date selector */
  afterDateSelector?: ReactNode;
  /** Content before KPIs */
  beforeKpis?: ReactNode;
  /** Content after KPIs */
  afterKpis?: ReactNode;
  /** Content before charts */
  beforeCharts?: ReactNode;
  /** Content after charts */
  afterCharts?: ReactNode;
  /** Custom header */
  header?: ReactNode | ((data: T) => ReactNode);
  /** Footer content */
  footer?: ReactNode | ((data: T) => ReactNode);
}

// =============================================================================
// AnalyticsPage Props
// =============================================================================

/**
 * AnalyticsPage component props
 *
 * @template TData - The query data type
 */
export interface AnalyticsPageProps<TData> extends Omit<CompositeBaseProps, 'title'> {
  /** Page title */
  title: string;
  /** Page description */
  description?: string;

  // ---------------------------------------------------------------------------
  // Date Range
  // ---------------------------------------------------------------------------

  /**
   * Date range options
   */
  dateRanges: AnalyticsDateRange[];

  /**
   * Default date range ID
   */
  defaultRange?: string;

  /**
   * Controlled date range
   */
  activeRange?: string;

  /**
   * Range change handler
   */
  onRangeChange?: (rangeId: string) => void;

  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------

  /**
   * Query hook factory - receives date range, returns query result
   */
  useQuery: (dateRange: DateRangeResult) => CompositeQueryResult<TData>;

  // ---------------------------------------------------------------------------
  // KPIs
  // ---------------------------------------------------------------------------

  /**
   * KPI configurations
   */
  kpis?: AnalyticsKPI<TData>[];

  /**
   * KPI grid columns
   * @default 4
   */
  kpiColumns?: 2 | 3 | 4;

  // ---------------------------------------------------------------------------
  // Charts
  // ---------------------------------------------------------------------------

  /**
   * Chart slots
   */
  charts?: AnalyticsChartSlot<TData>[];

  /**
   * Main chart render function (shorthand for single chart)
   */
  renderChart?: (data: TData, dateRange: string) => ReactNode;

  /**
   * Main chart title
   */
  chartTitle?: string;

  // ---------------------------------------------------------------------------
  // Empty State
  // ---------------------------------------------------------------------------

  /**
   * Empty state when no data
   */
  emptyState?: EmptyStateConfig;

  /**
   * Check if data is empty
   */
  emptyCheck?: (data: TData) => boolean;

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Refresh handler
   */
  onRefresh?: () => void;

  /**
   * Export handler
   */
  onExport?: (format: 'csv' | 'json') => void;

  // ---------------------------------------------------------------------------
  // Slots
  // ---------------------------------------------------------------------------

  /**
   * Slot overrides
   */
  slots?: AnalyticsPageSlots<TData>;

  // ---------------------------------------------------------------------------
  // Skeleton
  // ---------------------------------------------------------------------------

  /**
   * Custom skeleton component
   */
  skeleton?: ReactNode;

  // ---------------------------------------------------------------------------
  // Children
  // ---------------------------------------------------------------------------

  /**
   * Children render for full control
   */
  children?: (data: TData, dateRange: string) => ReactNode;
}
