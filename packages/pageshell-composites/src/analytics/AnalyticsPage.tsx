/**
 * AnalyticsPage Composite
 *
 * Analytics dashboard with date range selector, KPIs, and chart slots.
 * Designed for pages that display metrics over time with configurable periods.
 * Framework-agnostic implementation.
 *
 * @module analytics/AnalyticsPage
 */

'use client';

import * as React from 'react';
import { cn, useHandlerMap } from '@pageshell/core';
import { Button } from '@pageshell/primitives';
import { RefreshCw, Download } from 'lucide-react';

import type { AnalyticsPageProps } from './types';
import { analyticsPageDefaults } from './defaults';
import { getContainerClasses } from '../shared/styles';
import { calculateDateRange, getNestedValue } from './utils';
import {
  AnalyticsSkeleton,
  AnalyticsEmptyState,
  AnalyticsErrorState,
  KPICard,
  DateRangeTabs,
} from './components';

// =============================================================================
// AnalyticsPage Component
// =============================================================================

/**
 * AnalyticsPage - Analytics dashboard composite
 *
 * Displays KPIs, date range selector, and charts for analytics data.
 * Supports controlled and uncontrolled date range selection.
 *
 * @template TData - The query data type
 *
 * @example Basic usage
 * ```tsx
 * <AnalyticsPage
 *   title="Dashboard de Vendas"
 *   description="Métricas de vendas do período"
 *   dateRanges={[
 *     { id: '7d', label: '7 dias', days: 7 },
 *     { id: '30d', label: '30 dias', days: 30 },
 *     { id: '90d', label: '90 dias', days: 90 },
 *   ]}
 *   useQuery={(dateRange) => api.analytics.sales.useQuery({
 *     start: dateRange.start,
 *     end: dateRange.end,
 *   })}
 *   kpis={[
 *     { key: 'totalSales', label: 'Vendas', format: 'currency', icon: 'coins' },
 *     { key: 'orders', label: 'Pedidos', format: 'number', icon: 'shopping-cart' },
 *   ]}
 *   renderChart={(data) => <SalesChart data={data.chartData} />}
 * />
 * ```
 *
 * @example With slots for customization
 * ```tsx
 * <AnalyticsPage
 *   title="Analytics"
 *   dateRanges={ranges}
 *   useQuery={useAnalyticsQuery}
 *   kpis={kpiConfig}
 *   slots={{
 *     beforeKpis: <CustomAlert />,
 *     afterCharts: <ExportSection />,
 *   }}
 * />
 * ```
 */
export function AnalyticsPage<TData>(props: AnalyticsPageProps<TData>) {
  const {
    // Base
    theme = analyticsPageDefaults.theme,
    containerVariant = analyticsPageDefaults.containerVariant,
    title,
    description,
    className,
    // Date Range
    dateRanges,
    defaultRange,
    activeRange: controlledRange,
    onRangeChange,
    // Data
    useQuery: useQueryHook,
    // KPIs
    kpis,
    kpiColumns = 4,
    // Charts
    charts,
    renderChart,
    chartTitle,
    // Empty State
    emptyState,
    emptyCheck,
    // Actions
    onRefresh,
    onExport,
    // Slots
    slots,
    // Skeleton
    skeleton,
    // Children
    children,
  } = props;

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [internalRange, setInternalRange] = React.useState(
    defaultRange || dateRanges[0]?.id || ''
  );

  const rangeId = controlledRange ?? internalRange;

  const handleRangeChange = React.useCallback(
    (newRangeId: string) => {
      if (!controlledRange) {
        setInternalRange(newRangeId);
      }
      onRangeChange?.(newRangeId);
    },
    [controlledRange, onRangeChange]
  );

  // Memoized handler for export - stable reference per format
  const { getHandler: getExportHandler } = useHandlerMap((format: string) => {
    onExport?.(format as 'csv' | 'json');
  });

  // ---------------------------------------------------------------------------
  // Date Range Calculation
  // ---------------------------------------------------------------------------

  const dateRange = React.useMemo(() => {
    const config = dateRanges.find((r) => r.id === rangeId) || dateRanges[0];
    return config ? calculateDateRange(config) : calculateDateRange(dateRanges[0]!);
  }, [dateRanges, rangeId]);

  // ---------------------------------------------------------------------------
  // Query
  // ---------------------------------------------------------------------------

  const query = useQueryHook(dateRange);

  // ---------------------------------------------------------------------------
  // Container Classes
  // ---------------------------------------------------------------------------

  const classes = getContainerClasses(containerVariant);
  const containerClasses = containerVariant === 'shell' ? '' : 'max-w-7xl mx-auto';
  const cardContainerClasses = containerVariant === 'shell' ? '' : 'bg-card rounded-xl border border-border overflow-hidden';
  const headerSectionClasses = classes.header || 'p-4 sm:p-6 border-b border-border bg-muted/30';
  const contentSectionClasses = classes.content || 'p-4 sm:p-6 space-y-5 sm:space-y-6';

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (query.isLoading) {
    return (
      <div
        className={cn(containerClasses, className)}
        data-theme={theme}
        data-testid={`${theme}-analytics`}
      >
        {skeleton ?? <AnalyticsSkeleton kpiCount={kpis?.length} />}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error State
  // ---------------------------------------------------------------------------

  if (query.error) {
    return (
      <div
        className={cn(containerClasses, className)}
        data-theme={theme}
        data-testid={`${theme}-analytics`}
      >
        <AnalyticsErrorState error={query.error} retry={query.refetch} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty State
  // ---------------------------------------------------------------------------

  const data = query.data;

  if (!data || (emptyCheck && emptyCheck(data))) {
    return (
      <div
        className={cn(containerClasses, className)}
        data-theme={theme}
        data-testid={`${theme}-analytics`}
      >
        <AnalyticsEmptyState
          title={emptyState?.title || 'Sem dados'}
          description={emptyState?.description}
          action={emptyState?.action}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // Custom children render
  if (children) {
    return (
      <div
        className={cn(containerClasses, className)}
        data-theme={theme}
        data-testid={`${theme}-analytics`}
      >
        {children(data, rangeId)}
      </div>
    );
  }

  return (
    <div
      className={cn(containerClasses, className)}
      data-theme={theme}
      data-testid={`${theme}-analytics`}
    >
      <div className={cardContainerClasses}>
        {/* Header Section */}
        <div className={headerSectionClasses}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {description && (
                <p className="text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <DateRangeTabs
                ranges={dateRanges}
                activeRange={rangeId}
                onChange={handleRangeChange}
              />
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              {onExport && (
                <Button variant="outline" size="sm" onClick={getExportHandler('csv')}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              )}
            </div>
          </div>

          {/* Header slot */}
          {slots?.header &&
            (typeof slots.header === 'function' ? slots.header(data) : slots.header)}

          {/* Before date selector slot */}
          {slots?.beforeDateSelector}

          {/* After date selector slot */}
          {slots?.afterDateSelector}
        </div>

        {/* Content Section */}
        <div className={contentSectionClasses}>
          {/* Before KPIs slot */}
          {slots?.beforeKpis}

          {/* KPIs */}
          {kpis && kpis.length > 0 && (
            <div
              className={cn(
                'grid gap-4',
                kpiColumns === 2 && 'grid-cols-1 sm:grid-cols-2',
                kpiColumns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
                kpiColumns === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              )}
            >
              {kpis.map((kpi) => {
                const value = getNestedValue(data, kpi.key);
                return (
                  <KPICard
                    key={kpi.key}
                    kpi={kpi}
                    value={value}
                    data={data}
                  />
                );
              })}
            </div>
          )}

          {/* After KPIs slot */}
          {slots?.afterKpis}

          {/* Before charts slot */}
          {slots?.beforeCharts}

          {/* Single chart shorthand */}
          {renderChart && !charts && (
            <div className="rounded-lg border border-border bg-background p-6">
              {chartTitle && (
                <h2 className="text-lg font-semibold mb-4">{chartTitle}</h2>
              )}
              {renderChart(data, rangeId)}
            </div>
          )}

          {/* Custom charts */}
          {charts &&
            charts.map((chart, index) => (
              <div key={index} className="rounded-lg border border-border bg-background p-6">
                {chart.title && (
                  <h2 className="text-lg font-semibold mb-2">{chart.title}</h2>
                )}
                {chart.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {chart.description}
                  </p>
                )}
                {chart.render(data, rangeId)}
              </div>
            ))}

          {/* After charts slot */}
          {slots?.afterCharts}

          {/* Footer slot */}
          {slots?.footer &&
            (typeof slots.footer === 'function' ? slots.footer(data) : slots.footer)}
        </div>
      </div>
    </div>
  );
}

AnalyticsPage.displayName = 'AnalyticsPage';
