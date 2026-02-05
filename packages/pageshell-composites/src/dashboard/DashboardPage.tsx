/**
 * DashboardPage Composite
 *
 * Declarative dashboard page with stats, modules, and quick actions.
 *
 * @module dashboard/DashboardPage
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import {
  Button,
  resolveIcon,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@pageshell/primitives';
import { PageTabs, PageTab } from '@pageshell/layouts';
import type { DashboardPageProps, HeroConfig, WeeklyChartConfig, GoalsConfig, DashboardTab } from './types';
import { resolveDescription } from '../shared/types';
import { getContainerClasses } from '../shared/styles';
import { dashboardPageDefaults } from './defaults';
import {
  DashboardPageSkeleton,
  DashboardModuleCard,
  DashboardQuickActions,
  DashboardStats,
  DashboardHero,
  DashboardChart,
  DashboardGoals,
} from './components';

// =============================================================================
// Helpers
// =============================================================================

/**
 * Merges multiple query results into a single data object.
 * Each query's data is accessible via its key prefix.
 */
function mergeQueriesData(
  queries: Record<string, { data?: unknown; isLoading?: boolean }> | undefined
): { data: Record<string, unknown> | undefined; isLoading: boolean } {
  if (!queries) return { data: undefined, isLoading: false };

  const isLoading = Object.values(queries).some((q) => q.isLoading);

  if (isLoading) {
    return { data: undefined, isLoading: true };
  }

  const data: Record<string, unknown> = {};
  for (const [key, query] of Object.entries(queries)) {
    data[key] = query.data;
  }

  return { data, isLoading: false };
}

// =============================================================================
// Dashboard Page Component
// =============================================================================

/**
 * Declarative dashboard page composite.
 *
 * @example
 * ```tsx
 * <DashboardPage
 *   title="Dashboard"
 *   query={dashboardQuery}
 *   stats={[
 *     { key: 'revenue', label: 'Revenue', format: 'currency' },
 *     { key: 'users', label: 'Users', format: 'number' },
 *   ]}
 *   modules={[
 *     { id: 'courses', title: 'Courses', icon: 'book', href: '/courses' },
 *     { id: 'users', title: 'Users', icon: 'users', href: '/users' },
 *   ]}
 *   quickActions={[
 *     { label: 'Create Course', href: '/courses/new', featured: true },
 *   ]}
 * />
 * ```
 */
export const DashboardPage = React.forwardRef<HTMLElement, DashboardPageProps>(
  function DashboardPage(props, ref) {
    const {
      // Base
      theme = dashboardPageDefaults.theme,
      containerVariant = dashboardPageDefaults.containerVariant,
      title,
      description,
      label,
      className,
      // Data
      query,
      queries,
      // Tabs
      tabs,
      defaultTab,
      // New sections
      hero,
      weeklyChart,
      goals,
      // Content
      stats,
      modules,
      secondaryModules,
      quickActions,
      breakdownCards,
      // Actions
      headerAction,
      headerActions,
      dateRange,
      // Slots
      slots,
      skeleton,
      children,
      renderContent,
    } = props;

    // Handle multi-query or single query
    const mergedQueries = queries ? mergeQueriesData(queries) : null;
    const isLoading = mergedQueries?.isLoading ?? query?.isLoading ?? false;

    // Container classes (defined early for loading state)
    const loadingClasses = getContainerClasses(containerVariant);

    // Loading state
    if (isLoading) {
      return (
        <main ref={ref} className={cn(loadingClasses.container, className)} data-theme={theme}>
          {skeleton || <DashboardPageSkeleton />}
        </main>
      );
    }

    // Resolve data from queries or single query
    const data = mergedQueries?.data ?? (query?.data as Record<string, unknown> | undefined);

    // Resolve slot content
    const resolveSlot = (
      slot: React.ReactNode | ((data: unknown) => React.ReactNode) | undefined
    ) => {
      if (!slot) return null;
      if (typeof slot === 'function') return slot(data);
      return slot;
    };

    const classes = getContainerClasses(containerVariant);

    return (
      <main
        ref={ref}
        className={cn(classes.container, 'flex flex-col gap-6', className)}
        data-theme={theme}
      >
        {/* Custom Header Slot */}
        {resolveSlot(slots?.header)}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            {label && (
              <p className="text-sm text-muted-foreground mb-1">{label}</p>
            )}
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">
                {resolveDescription(description, query?.data)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {dateRange && (
              <Button variant="outline" size="sm">
                {dateRange.start.toLocaleDateString()} -{' '}
                {dateRange.end.toLocaleDateString()}
              </Button>
            )}
            {headerAction}
            {headerActions?.map((action, i) => {
              const ActionIcon = resolveIcon(action.icon);
              return (
                <Button
                  key={i}
                  variant={action.variant || 'outline'}
                  onClick={action.onClick}
                >
                  {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                  {action.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* After Header Slot (works in both tabbed and standard modes) */}
        {resolveSlot(slots?.afterHeader)}

        {/* Tabbed Mode */}
        {tabs && tabs.length > 0 && (
          <>
            <PageTabs defaultTab={defaultTab || tabs[0]?.id} className="mt-6">
              {tabs.map((tab) => (
                <PageTab key={tab.id} id={tab.id} label={tab.label} icon={tab.icon}>
                  {tab.content}
                </PageTab>
              ))}
            </PageTabs>
            {/* After Tabs Slot (only in tabbed mode) */}
            {resolveSlot(slots?.afterTabs)}
          </>
        )}

        {/* Standard Mode (when no tabs) */}
        {!tabs && (
          <>
            {/* Before Stats Slot */}
            {resolveSlot(slots?.beforeStats)}

            {/* Hero Section */}
            {hero && <DashboardHero config={hero} data={data} />}

            {/* Stats */}
            {slots?.stats ? (
              resolveSlot(slots.stats)
            ) : stats && stats.length > 0 ? (
              <DashboardStats stats={stats} data={data} />
            ) : null}

            {/* After Stats Slot */}
            {resolveSlot(slots?.afterStats)}

            {/* Quick Actions */}
            {quickActions && quickActions.length > 0 && (
              <DashboardQuickActions actions={quickActions} />
            )}

            {/* Weekly Chart Section */}
            {weeklyChart && <DashboardChart config={weeklyChart} data={data} />}

            {/* Before Breakdown Slot */}
            {resolveSlot(slots?.beforeBreakdown)}

            {/* Breakdown Cards */}
            {slots?.breakdown ? (
              resolveSlot(slots.breakdown)
            ) : breakdownCards && breakdownCards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {breakdownCards.map((card) => {
                  const items = card.dataKey
                    ? (data?.[card.dataKey] as Array<{ label: string; value: number; color?: string }>) || []
                    : card.items || [];
                  const total = items.reduce((sum, item) => sum + item.value, 0);

                  return (
                    <Card key={card.id}>
                      <CardHeader>
                        <CardTitle className="text-base">{card.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {items.map((item, index) => {
                            const percentage = total > 0 ? (item.value / total) * 100 : 0;
                            return (
                              <div key={index} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>{item.label}</span>
                                  <span className="text-muted-foreground">
                                    {item.value}
                                    {card.showPercentage && ` (${percentage.toFixed(0)}%)`}
                                  </span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-primary"
                                    style={{
                                      width: `${percentage}%`,
                                      backgroundColor: item.color,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : null}

            {/* After Breakdown Slot */}
            {resolveSlot(slots?.afterBreakdown)}

            {/* Before Modules Slot */}
            {resolveSlot(slots?.beforeModules)}

            {/* Modules */}
            {slots?.modules ? (
              resolveSlot(slots.modules)
            ) : modules && modules.length > 0 ? (
              <div
                className={cn(
                  'grid gap-4 auto-rows-fr',
                  // Responsive: 1 col mobile, 2 cols for 2 items, 3 cols for 3+ items
                  modules.length === 2
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : modules.length >= 3
                      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                      : 'grid-cols-1'
                )}
                role="region"
                aria-label="Dashboard modules"
              >
                {modules.map((module) => (
                  <DashboardModuleCard key={module.id} module={module} data={data} />
                ))}
              </div>
            ) : null}

            {/* Secondary Modules */}
            {secondaryModules && secondaryModules.length > 0 && (
              <div
                className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 auto-rows-fr gap-3"
                role="region"
                aria-label="Secondary modules"
              >
                {secondaryModules.map((module) => (
                  <DashboardModuleCard key={module.id} module={module} data={data} />
                ))}
              </div>
            )}

            {/* After Modules Slot */}
            {resolveSlot(slots?.afterModules)}

            {/* Goals Section */}
            {goals && <DashboardGoals config={goals} data={data} />}

            {/* Custom content */}
            {renderContent && data && renderContent(data as unknown)}
            {typeof children === 'function' ? children(data as unknown) : children}

            {/* Footer Slot */}
            {resolveSlot(slots?.footer)}
          </>
        )}
      </main>
    );
  }
) as (<TData = unknown, TQueries extends Record<string, unknown> = Record<string, unknown>>(
  props: DashboardPageProps<TData, TQueries> & { ref?: React.Ref<HTMLElement> }
) => React.ReactElement) & { displayName?: string };

DashboardPage.displayName = 'DashboardPage';
