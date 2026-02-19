'use client';

/**
 * PageRevenueChart - Revenue chart placeholder
 *
 * Displays a placeholder bar chart visualization using div bars (no chart
 * library). Includes summary stats above and a period selector for
 * daily, weekly, or monthly views.
 *
 * @example
 * ```tsx
 * <PageRevenueChart
 *   data={[
 *     { period: 'Jan', revenue: { value: 12000, currency: 'BRL' }, expenses: { value: 5000, currency: 'BRL' } },
 *     { period: 'Feb', revenue: { value: 15000, currency: 'BRL' } },
 *   ]}
 *   activePeriod="monthly"
 *   onPeriodChange={(p) => setPeriod(p)}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { Button, PageIcon } from '@parisgroup-ai/pageshell/primitives';

import type { RevenueChartData } from './types';

// =============================================================================
// Types
// =============================================================================

export type ChartPeriod = 'daily' | 'weekly' | 'monthly';

export interface PageRevenueChartProps {
  /** Revenue data points */
  data: RevenueChartData[];
  /** Currently selected period */
  activePeriod?: ChartPeriod;
  /** Callback when period changes */
  onPeriodChange?: (period: ChartPeriod) => void;
  /** Currency symbol for display */
  currencySymbol?: string;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const PERIOD_LABELS: Record<ChartPeriod, string> = {
  daily: tPageShell('domain.odonto.dashboard.revenue.daily', 'Daily'),
  weekly: tPageShell('domain.odonto.dashboard.revenue.weekly', 'Weekly'),
  monthly: tPageShell('domain.odonto.dashboard.revenue.monthly', 'Monthly'),
};

function formatValue(value: number, symbol: string): string {
  return `${symbol} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;
}

// =============================================================================
// Component
// =============================================================================

export function PageRevenueChart({
  data,
  activePeriod = 'monthly',
  onPeriodChange,
  currencySymbol = 'R$',
  className,
}: PageRevenueChartProps) {
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue.value, 0);
  const totalExpenses = data.reduce((sum, d) => sum + (d.expenses?.value ?? 0), 0);
  const maxValue = Math.max(...data.map((d) => Math.max(d.revenue.value, d.expenses?.value ?? 0)), 1);

  return (
    <div className={cn('rounded-lg border border-border bg-card', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <PageIcon name="bar-chart-2" className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">
            {tPageShell('domain.odonto.dashboard.revenue.title', 'Revenue')}
          </h3>
        </div>

        {/* Period selector */}
        <div className="flex gap-1">
          {(['daily', 'weekly', 'monthly'] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => onPeriodChange?.(period)}
              className={cn(
                'px-2 py-1 text-xs rounded-md transition-colors',
                activePeriod === period
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent/10',
              )}
            >
              {PERIOD_LABELS[period]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="flex gap-6 px-4 pt-4 pb-2">
        <div>
          <span className="text-xs text-muted-foreground">
            {tPageShell('domain.odonto.dashboard.revenue.totalRevenue', 'Total Revenue')}
          </span>
          <p className="text-lg font-bold text-emerald-600">
            {formatValue(totalRevenue, currencySymbol)}
          </p>
        </div>
        {totalExpenses > 0 && (
          <div>
            <span className="text-xs text-muted-foreground">
              {tPageShell('domain.odonto.dashboard.revenue.totalExpenses', 'Total Expenses')}
            </span>
            <p className="text-lg font-bold text-red-500">
              {formatValue(totalExpenses, currencySymbol)}
            </p>
          </div>
        )}
      </div>

      {/* Bar chart */}
      <div className="px-4 pb-4">
        {data.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {tPageShell('domain.odonto.dashboard.revenue.empty', 'No data available')}
          </div>
        ) : (
          <div className="flex items-end gap-2 h-40 mt-2">
            {data.map((d, index) => {
              const revenueHeight = (d.revenue.value / maxValue) * 100;
              const expenseHeight = d.expenses ? (d.expenses.value / maxValue) * 100 : 0;

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex items-end gap-0.5 h-32 w-full justify-center">
                    {/* Revenue bar */}
                    <div
                      className="w-full max-w-[20px] bg-emerald-400 rounded-t transition-all"
                      style={{ height: `${revenueHeight}%` }}
                      title={`${tPageShell('domain.odonto.dashboard.revenue.revenueLabel', 'Revenue')}: ${formatValue(d.revenue.value, currencySymbol)}`}
                    />
                    {/* Expenses bar */}
                    {d.expenses && (
                      <div
                        className="w-full max-w-[20px] bg-red-300 rounded-t transition-all"
                        style={{ height: `${expenseHeight}%` }}
                        title={`${tPageShell('domain.odonto.dashboard.revenue.expensesLabel', 'Expenses')}: ${formatValue(d.expenses.value, currencySymbol)}`}
                      />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground truncate max-w-full">
                    {d.period}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        {data.some((d) => d.expenses) && (
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" aria-hidden="true" />
              {tPageShell('domain.odonto.dashboard.revenue.revenueLabel', 'Revenue')}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-300" aria-hidden="true" />
              {tPageShell('domain.odonto.dashboard.revenue.expensesLabel', 'Expenses')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
