import { useTranslation } from 'react-i18next';
import type { DashboardMetrics, WeeklyTrendPoint } from '@/hooks/domain/useDashboard';
import { KPICard, KPICardGroup, Tooltip, TooltipContent, TooltipTrigger } from '@parisgroup-ai/pageshell/primitives';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import {
  FileText, Users, TrendingUp, CheckCircle2,
} from 'lucide-react';
import { useCountAnimation } from './useCountAnimation';

// ---------------------------------------------------------------------------
// Progress Ring SVG
// ---------------------------------------------------------------------------

const RING_SIZE = 40;

function ProgressRing({ percent }: { percent: number }) {
  const size = RING_SIZE;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const target = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90"
      role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}
      aria-label={`${Math.round(percent)}%`}
    >
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-muted)"
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--chart-2)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        className="progress-ring-circle"
        style={{
          '--ring-circumference': `${circumference}`,
          '--ring-target': `${target}`,
        } as React.CSSProperties}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Mini Sparkline
// ---------------------------------------------------------------------------

function MiniSparkline({ data }: { data: WeeklyTrendPoint[] }) {
  if (data.length === 0) return null;
  return (
    <div className="w-14 sm:w-20">
      <ResponsiveContainer width="100%" height={28}>
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <defs>
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.15} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-primary)"
            strokeWidth={1.5}
            fill="url(#sparkFill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Animated Stat Value — rendered via KPICard value prop
// ---------------------------------------------------------------------------

function useAnimatedValue(value: number, suffix?: string): string {
  const animated = useCountAnimation(value);
  return `${animated}${suffix ?? ''}`;
}

// ---------------------------------------------------------------------------
// Stat Card Config
// ---------------------------------------------------------------------------

interface StatConfig {
  key: keyof DashboardMetrics;
  labelKey: string;
  unitKey: string;
  icon: typeof FileText;
  tooltipKey: string;
  color: string;
  suffix?: string;
  extra?: 'sparkline' | 'progress-ring';
}

const statConfigs: StatConfig[] = [
  {
    key: 'totalCases',
    labelKey: 'dashboard.stats.totalCases',
    unitKey: 'dashboard.stats.totalCasesUnit',
    icon: FileText,
    tooltipKey: 'dashboard.stats.totalCasesTooltip',
    color: 'var(--color-primary)',
  },
  {
    key: 'totalPatients',
    labelKey: 'dashboard.stats.patients',
    unitKey: 'dashboard.stats.patientsUnit',
    icon: Users,
    tooltipKey: 'dashboard.stats.patientsTooltip',
    color: 'var(--color-info)',
  },
  {
    key: 'weeklySessions',
    labelKey: 'dashboard.stats.thisWeek',
    unitKey: 'dashboard.stats.thisWeekUnit',
    icon: TrendingUp,
    tooltipKey: 'dashboard.stats.thisWeekTooltip',
    color: 'var(--color-accent)',
    extra: 'sparkline',
  },
  {
    key: 'completionRate',
    labelKey: 'dashboard.stats.completion',
    unitKey: 'dashboard.stats.completionUnit',
    icon: CheckCircle2,
    tooltipKey: 'dashboard.stats.completionTooltip',
    color: 'var(--color-success)',
    suffix: '%',
    extra: 'progress-ring',
  },
];

// ---------------------------------------------------------------------------
// Individual animated KPI card
// ---------------------------------------------------------------------------

function AnimatedKPICard({
  stat,
  value,
  loading,
  tooltipText,
  weeklyTrends,
}: {
  stat: StatConfig;
  value: number;
  loading: boolean;
  tooltipText: string;
  weeklyTrends: WeeklyTrendPoint[];
}) {
  const { t } = useTranslation();
  const displayValue = useAnimatedValue(value, stat.suffix);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* KPICard renders its own card shell */}
        <div>
          <KPICard
            label={t(stat.labelKey)}
            value={loading ? 0 : displayValue}
            subtitle={t(stat.unitKey)}
            icon={stat.icon}
            iconBackground
            color={stat.color}
            isLoading={loading}
          >
            {!loading && stat.extra === 'sparkline' && (
              <MiniSparkline data={weeklyTrends} />
            )}
            {!loading && stat.extra === 'progress-ring' && (
              <ProgressRing percent={value} />
            )}
          </KPICard>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// StatsGrid Component
// ---------------------------------------------------------------------------

export function StatsGrid({
  metrics,
  loading,
  weekRange,
  weeklyTrends,
}: {
  metrics: DashboardMetrics;
  loading: boolean;
  weekRange: { start: string; end: string };
  weeklyTrends: WeeklyTrendPoint[];
}) {
  const { t } = useTranslation();

  return (
    <KPICardGroup columns={4}>
      {statConfigs.map((stat) => {
        const value = metrics[stat.key];
        const tooltipText =
          stat.key === 'weeklySessions'
            ? `${weekRange.start} – ${weekRange.end}`
            : t(stat.tooltipKey);

        return (
          <AnimatedKPICard
            key={stat.key}
            stat={stat}
            value={value}
            loading={loading}
            tooltipText={tooltipText}
            weeklyTrends={weeklyTrends}
          />
        );
      })}
    </KPICardGroup>
  );
}
