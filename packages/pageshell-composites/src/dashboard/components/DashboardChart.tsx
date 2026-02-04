/**
 * DashboardChart Component
 *
 * Renders a weekly activity bar chart for DashboardPage.
 *
 * @module dashboard/components/DashboardChart
 */

'use client';

import * as React from 'react';
import { StatusBadge, PageIcon } from '@pageshell/primitives';
import type { WeeklyChartConfig } from '../types';
import { resolveNestedValue } from '../../shared/utils/resolveNestedValue';

// =============================================================================
// Types
// =============================================================================

export interface DashboardChartProps {
  /** Chart configuration */
  config: WeeklyChartConfig;
  /** Data object to resolve values from */
  data: Record<string, unknown> | undefined;
}

interface ChartItem {
  day: string;
  hours: number;
  [key: string]: unknown;
}

// =============================================================================
// Component
// =============================================================================

/**
 * DashboardChart renders a weekly activity bar chart.
 * Resolves data from the provided data object using dot-notation keys.
 *
 * @example
 * ```tsx
 * <DashboardChart
 *   config={{
 *     title: "Weekly Activity",
 *     dataKey: "weekly.weeklyActivity",
 *     showTotal: true,
 *     totalKey: "weekly.totalWeeklyHours",
 *   }}
 *   data={queryData}
 * />
 * ```
 */
export function DashboardChart({ config, data }: DashboardChartProps) {
  const {
    title,
    dataKey,
    bars,
    showTotal = false,
    totalKey,
    totalLabel = 'Total',
    badge,
  } = config;

  const dayKey = bars?.dayKey ?? 'day';
  const valueKey = bars?.valueKey ?? 'hours';

  // Resolve chart data array
  const chartData = resolveNestedValue<ChartItem[]>(data, dataKey) ?? [];

  // Calculate max value for scaling
  const maxValue = Math.max(...chartData.map((item) => Number(item[valueKey]) || 0), 1);

  // Resolve or calculate total
  const total = totalKey
    ? resolveNestedValue<number>(data, totalKey) ?? 0
    : chartData.reduce((sum, item) => sum + (Number(item[valueKey]) || 0), 0);

  return (
    <div className="portal-section-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="portal-heading portal-heading-sm flex items-center gap-2">
          <PageIcon name="bar-chart" className="w-5 h-5 text-primary" />
          {title}
        </h2>
        {badge && <StatusBadge variant="primary">{badge}</StatusBadge>}
      </div>

      {/* Bar Chart */}
      <div className="portal-bar-chart">
        {chartData.map((item, index) => {
          const value = Number(item[valueKey]) || 0;
          const heightPercent = (value / maxValue) * 100;
          const isToday = index === chartData.length - 1;
          const dayLabel = String(item[dayKey] ?? '');

          return (
            <div
              key={`${dayLabel}-${index}`}
              className="portal-bar-item"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="portal-bar-container">
                <div
                  className="portal-bar"
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="portal-bar-value">{value}h</span>
              </div>
              <span
                className={`portal-bar-label ${isToday ? 'text-primary font-semibold' : ''}`}
              >
                {dayLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* Chart Summary */}
      {showTotal && (
        <div className="portal-chart-summary">
          <div className="portal-chart-legend">
            <div className="portal-chart-legend-item">
              <div className="portal-chart-legend-dot" />
              <span>Study Hours</span>
            </div>
          </div>
          <div className="portal-chart-total">
            <span className="portal-chart-total-label">{totalLabel}</span>
            <span className="portal-chart-total-value">{total}h</span>
          </div>
        </div>
      )}
    </div>
  );
}

DashboardChart.displayName = 'DashboardChart';
