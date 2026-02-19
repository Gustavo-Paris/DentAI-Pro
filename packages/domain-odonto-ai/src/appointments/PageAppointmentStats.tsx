'use client';

/**
 * PageAppointmentStats
 *
 * Stats cards displaying today's appointment count, completed count,
 * weekly total, no-show rate, and average duration.
 *
 * @example
 * ```tsx
 * <PageAppointmentStats
 *   stats={{
 *     todayTotal: 12,
 *     todayCompleted: 8,
 *     weekTotal: 56,
 *     noShowRate: 0.05,
 *     averageDuration: 35,
 *   }}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon } from '@parisgroup-ai/pageshell/primitives';
import type { AppointmentStatsData } from './types';

// =============================================================================
// Props
// =============================================================================

/** Props for {@link PageAppointmentStats} */
export interface PageAppointmentStatsProps {
  /** Aggregated stats data */
  stats: AppointmentStatsData;
  /** Stagger animation delay in ms */
  animationDelay?: number;
  /** Additional CSS classes */
  className?: string;
  /** i18n override: today's appointments label */
  i18nTodayLabel?: string;
  /** i18n override: completed label */
  i18nCompletedLabel?: string;
  /** i18n override: weekly label */
  i18nWeeklyLabel?: string;
  /** i18n override: no-show rate label */
  i18nNoShowLabel?: string;
  /** i18n override: average duration label */
  i18nDurationLabel?: string;
}

// =============================================================================
// Internal stat card
// =============================================================================

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  subtitle?: string;
  className?: string;
}

function StatCard({ icon, label, value, subtitle, className }: StatCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-4 shadow-sm', className)}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <PageIcon name={icon} className="h-4 w-4" aria-hidden />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
      {subtitle && (
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

/**
 * Grid of stat cards for appointment KPIs.
 */
export function PageAppointmentStats({
  stats,
  animationDelay,
  className,
  i18nTodayLabel,
  i18nCompletedLabel,
  i18nWeeklyLabel,
  i18nNoShowLabel,
  i18nDurationLabel,
}: PageAppointmentStatsProps) {
  const todayLabel =
    i18nTodayLabel ??
    tPageShell('domain.odonto.appointments.stats.today', "Today's Appointments");
  const completedLabel =
    i18nCompletedLabel ??
    tPageShell('domain.odonto.appointments.stats.completed', 'Completed Today');
  const weeklyLabel =
    i18nWeeklyLabel ??
    tPageShell('domain.odonto.appointments.stats.weekly', 'This Week');
  const noShowLabel =
    i18nNoShowLabel ??
    tPageShell('domain.odonto.appointments.stats.noShow', 'No-Show Rate');
  const durationLabel =
    i18nDurationLabel ??
    tPageShell('domain.odonto.appointments.stats.duration', 'Avg. Duration');
  const minutesUnit = tPageShell(
    'domain.odonto.appointments.stats.minutes',
    'min',
  );

  const noShowPercent = `${Math.round(stats.noShowRate * 100)}%`;

  return (
    <div
      className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-5', className)}
      style={animationDelay ? { animationDelay: `${animationDelay}ms` } : undefined}
    >
      <StatCard
        icon="calendar"
        label={todayLabel}
        value={stats.todayTotal}
      />
      <StatCard
        icon="check-circle"
        label={completedLabel}
        value={stats.todayCompleted}
        subtitle={`${stats.todayTotal > 0 ? Math.round((stats.todayCompleted / stats.todayTotal) * 100) : 0}%`}
      />
      <StatCard
        icon="calendar-range"
        label={weeklyLabel}
        value={stats.weekTotal}
      />
      <StatCard
        icon="user-x"
        label={noShowLabel}
        value={noShowPercent}
      />
      <StatCard
        icon="timer"
        label={durationLabel}
        value={`${stats.averageDuration} ${minutesUnit}`}
      />
    </div>
  );
}
