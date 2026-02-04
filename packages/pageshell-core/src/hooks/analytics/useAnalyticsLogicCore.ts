/**
 * useAnalyticsLogic - Headless Analytics Logic Hook
 *
 * Encapsulates analytics dashboard state management: date range selection,
 * KPI calculations, and chart data preparation.
 * Can be used independently for custom UIs or with AnalyticsPage.
 *
 * @module hooks/analytics
 *
 * @example Basic usage
 * ```tsx
 * const analytics = useAnalyticsLogic({
 *   dateRanges: [
 *     { id: '7d', label: 'Last 7 days', days: 7 },
 *     { id: '30d', label: 'Last 30 days', days: 30 },
 *   ],
 *   defaultRange: '7d',
 *   kpis: [
 *     { key: 'totalRevenue', label: 'Revenue', format: 'currency' },
 *     { key: 'totalUsers', label: 'Users', format: 'number' },
 *   ],
 * });
 *
 * // Pass dateRange to your query
 * const { data } = api.analytics.getStats.useQuery(analytics.dateRange);
 *
 * // Use computed KPIs
 * analytics.setData(data);
 * {analytics.computedKpis.map(kpi => (
 *   <div key={kpi.key}>
 *     <span>{kpi.label}</span>
 *     <span>{kpi.formattedValue}</span>
 *   </div>
 * ))}
 * ```
 *
 * @example With comparison
 * ```tsx
 * const analytics = useAnalyticsLogic({
 *   dateRanges: [...],
 *   enableComparison: true,
 * });
 *
 * // Shows trends based on previous period
 * {analytics.computedKpis.map(kpi => (
 *   <KPICard
 *     value={kpi.formattedValue}
 *     trend={kpi.trend}
 *   />
 * ))}
 * ```
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { subDays, daysBetween } from '../../utils/dateUtils';
import { getNestedValue } from '../../formatters/value';
import { formatAnalyticsValue, calculateAnalyticsTrend } from './utils';
import type {
  UseAnalyticsLogicOptions,
  UseAnalyticsLogicReturn,
  AnalyticsDateRangeResult,
  AnalyticsKPIComputed,
  AnalyticsTrend,
} from './types';

// =============================================================================
// Hook Implementation
// =============================================================================

export function useAnalyticsLogic<TData = unknown>(
  options: UseAnalyticsLogicOptions<TData>
): UseAnalyticsLogicReturn<TData> {
  const {
    dateRanges,
    defaultRange = dateRanges[0]?.id ?? '30d',
    activeRange: controlledRange,
    onRangeChange,
    kpis = [],
    data: initialData = null,
    comparisonData: initialComparisonData = null,
    enableComparison = false,
    locale = 'pt-BR',
    currency = 'BRL',
  } = options;

  // State
  const [internalRange, setInternalRange] = useState(defaultRange);
  const [data, setData] = useState<TData | null>(initialData);
  const [comparisonData, setComparisonData] = useState<TData | null>(initialComparisonData);

  // Controlled/uncontrolled range
  const rangeId = controlledRange ?? internalRange;

  // Set range action
  const setRange = useCallback((newRangeId: string) => {
    if (onRangeChange) {
      onRangeChange(newRangeId);
    } else {
      setInternalRange(newRangeId);
    }
  }, [onRangeChange]);

  // Compute date range
  const dateRange = useMemo<AnalyticsDateRangeResult>(() => {
    const rangeConfig = dateRanges.find((r) => r.id === rangeId) ?? dateRanges[0];
    if (!rangeConfig) {
      const now = new Date();
      return {
        rangeId: 'default',
        start: subDays(now, 30),
        end: now,
        label: 'Last 30 days',
        dayCount: 30,
      };
    }

    const end = rangeConfig.getEndDate?.() ?? new Date();
    let start: Date;
    let dayCount: number;

    if (rangeConfig.getStartDate) {
      start = rangeConfig.getStartDate();
      dayCount = daysBetween(start, end);
    } else if (rangeConfig.days !== undefined) {
      start = subDays(end, rangeConfig.days);
      dayCount = rangeConfig.days;
    } else {
      // "All time" - use a very old date
      start = new Date(2020, 0, 1);
      dayCount = daysBetween(start, end);
    }

    return {
      rangeId: rangeConfig.id,
      start,
      end,
      label: rangeConfig.label,
      dayCount,
    };
  }, [dateRanges, rangeId]);

  // Compute comparison date range
  const comparisonDateRange = useMemo<AnalyticsDateRangeResult | null>(() => {
    if (!enableComparison) return null;

    const { start, end, dayCount } = dateRange;
    const compStart = subDays(start, dayCount);
    const compEnd = subDays(end, dayCount);

    return {
      rangeId: `${dateRange.rangeId}_comparison`,
      start: compStart,
      end: compEnd,
      label: `Previous ${dayCount} days`,
      dayCount,
    };
  }, [enableComparison, dateRange]);

  // Get data value by key
  const getDataValue = useCallback((key: string): unknown => {
    if (!data) return undefined;
    return getNestedValue(data, key);
  }, [data]);

  // Format value
  const formatValueFn = useCallback((
    value: unknown,
    format?: 'number' | 'currency' | 'percent' | 'duration' | 'custom',
    customFormatter?: (v: unknown) => string
  ): string => {
    return formatAnalyticsValue(value, format, locale, currency, customFormatter);
  }, [locale, currency]);

  // Calculate trend
  const calculateTrend = useCallback((
    current: number,
    previous: number
  ): AnalyticsTrend => {
    return calculateAnalyticsTrend(current, previous);
  }, []);

  // Compute KPIs
  const computedKpis = useMemo<AnalyticsKPIComputed[]>(() => {
    return kpis.map((kpi, index) => {
      // Get value
      let value: unknown;
      if (kpi.getValue && data) {
        value = kpi.getValue(data);
      } else {
        value = getDataValue(kpi.key);
      }

      // Format value
      const formattedValue = formatValueFn(value, kpi.format, kpi.formatValue);

      // Get helper
      let helper: string | undefined;
      if (typeof kpi.helper === 'function' && data) {
        helper = kpi.helper(value, data);
      } else if (typeof kpi.helper === 'string') {
        helper = kpi.helper;
      }

      // Get icon color
      let iconColor = kpi.iconColor;
      if (kpi.getIconColor && data) {
        iconColor = kpi.getIconColor(value, data) as typeof iconColor;
      }

      // Calculate trend if comparison enabled
      let trend: AnalyticsKPIComputed['trend'] | undefined;
      if (enableComparison && comparisonData) {
        let compValue: unknown;
        if (kpi.getComparisonValue) {
          compValue = kpi.getComparisonValue(comparisonData);
        } else if (kpi.getValue) {
          compValue = kpi.getValue(comparisonData);
        } else {
          compValue = getNestedValue(comparisonData, kpi.key);
        }

        const currentNum = typeof value === 'number' ? value : Number(value);
        const previousNum = typeof compValue === 'number' ? compValue : Number(compValue);

        if (!isNaN(currentNum) && !isNaN(previousNum)) {
          trend = calculateTrend(currentNum, previousNum);
        }
      }

      return {
        key: kpi.key,
        label: kpi.label,
        value,
        formattedValue,
        icon: kpi.icon,
        iconColor,
        helper,
        cardVariant: kpi.cardVariant,
        trend,
        animationDelay: index + 1,
      };
    });
  }, [kpis, data, comparisonData, enableComparison, getDataValue, formatValueFn, calculateTrend]);

  return useMemo(() => ({
    // Date range state
    rangeId,
    ranges: dateRanges,
    dateRange,
    comparisonDateRange,

    // KPIs
    computedKpis,

    // Actions
    setRange,

    // Utilities
    getDataValue,
    formatValue: formatValueFn,
    calculateTrend,

    // Data setters
    setData,
    setComparisonData,

    // Configuration
    isComparisonEnabled: enableComparison,
    locale,
    currency,
  }), [
    rangeId,
    dateRanges,
    dateRange,
    comparisonDateRange,
    computedKpis,
    setRange,
    getDataValue,
    formatValueFn,
    calculateTrend,
    setData,
    setComparisonData,
    enableComparison,
    locale,
    currency
  ]);
}
