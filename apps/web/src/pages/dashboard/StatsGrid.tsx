import { useTranslation } from 'react-i18next';
import type { DashboardMetrics, WeeklyTrendPoint } from '@/hooks/domain/useDashboard';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AreaChart, Area } from 'recharts';
import {
  FileText, Users, TrendingUp, CheckCircle2,
  FileWarning, Stethoscope,
} from 'lucide-react';
import { useScrollRevealChildren } from '@/hooks/useScrollReveal';
import { useCountAnimation } from './useCountAnimation';

// ---------------------------------------------------------------------------
// Progress Ring SVG
// ---------------------------------------------------------------------------

function ProgressRing({ percent }: { percent: number }) {
  const size = 40;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const target = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--chart-2))"
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
    <div className="shrink-0">
      <AreaChart width={60} height={28} data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--primary))"
          strokeWidth={1.5}
          fill="url(#sparkFill)"
          isAnimationActive={false}
        />
      </AreaChart>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Animated Stat Value
// ---------------------------------------------------------------------------

function AnimatedValue({ value, suffix }: { value: number; suffix?: string }) {
  const animated = useCountAnimation(value);
  return (
    <span className="tabular-nums">
      {animated}{suffix}
    </span>
  );
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
  accentColor: string;
  darkAccentColor: string;
  getValueColor: (v: number) => string;
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
    accentColor: 'from-primary to-primary/70',
    darkAccentColor: 'dark:from-primary dark:to-primary/60',
    getValueColor: () => 'text-foreground',
  },
  {
    key: 'totalPatients',
    labelKey: 'dashboard.stats.patients',
    unitKey: 'dashboard.stats.patientsUnit',
    icon: Users,
    tooltipKey: 'dashboard.stats.patientsTooltip',
    accentColor: 'from-blue-400 to-cyan-500',
    darkAccentColor: 'dark:from-blue-400/80 dark:to-cyan-400/80',
    getValueColor: () => 'text-foreground',
  },
  {
    key: 'weeklySessions',
    labelKey: 'dashboard.stats.thisWeek',
    unitKey: 'dashboard.stats.thisWeekUnit',
    icon: TrendingUp,
    tooltipKey: 'dashboard.stats.thisWeekTooltip',
    accentColor: 'from-sky-400 to-teal-500',
    darkAccentColor: 'dark:from-sky-400/80 dark:to-teal-400/80',
    getValueColor: () => 'text-foreground',
    extra: 'sparkline',
  },
  {
    key: 'completionRate',
    labelKey: 'dashboard.stats.completion',
    unitKey: 'dashboard.stats.completionUnit',
    icon: CheckCircle2,
    tooltipKey: 'dashboard.stats.completionTooltip',
    accentColor: 'from-emerald-400 to-teal-500',
    darkAccentColor: 'dark:from-emerald-400/80 dark:to-teal-400/80',
    getValueColor: () => 'text-foreground',
    suffix: '%',
    extra: 'progress-ring',
  },
  {
    key: 'pendingSessions',
    labelKey: 'dashboard.stats.open',
    unitKey: 'dashboard.stats.openUnit',
    icon: FileWarning,
    tooltipKey: 'dashboard.stats.openTooltip',
    accentColor: 'from-amber-400 to-orange-500',
    darkAccentColor: 'dark:from-amber-400/80 dark:to-orange-400/80',
    getValueColor: (v: number) =>
      v > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground',
  },
  {
    key: 'pendingTeeth',
    labelKey: 'dashboard.stats.pendingCases',
    unitKey: 'dashboard.stats.pendingCasesUnit',
    icon: Stethoscope,
    tooltipKey: 'dashboard.stats.pendingCasesTooltip',
    accentColor: 'from-violet-400 to-purple-500',
    darkAccentColor: 'dark:from-violet-400/80 dark:to-purple-400/80',
    getValueColor: (v: number) =>
      v > 0 ? 'text-violet-600 dark:text-violet-400' : 'text-foreground',
  },
];

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
  const containerRef = useScrollRevealChildren();

  return (
    <div ref={containerRef} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {statConfigs.map((stat, i) => {
        const Icon = stat.icon;
        const value = metrics[stat.key];
        const tooltipText =
          stat.key === 'weeklySessions'
            ? `${weekRange.start} – ${weekRange.end}`
            : t(stat.tooltipKey);

        return (
          <Tooltip key={stat.key}>
            <TooltipTrigger asChild>
              <Card
                className={`scroll-reveal scroll-reveal-delay-${i + 1} group relative overflow-hidden p-3 sm:p-4 cursor-default shadow-sm hover:shadow-md rounded-xl transition-all duration-300`}
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b ${stat.accentColor} ${stat.darkAccentColor} opacity-60 group-hover:opacity-100 transition-opacity`}
                />
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-muted-foreground/70" aria-hidden="true" />
                  <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
                    {t(stat.labelKey)}
                  </p>
                </div>
                {loading ? (
                  <Skeleton className="h-10 w-14" />
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className={`text-3xl font-semibold tracking-tight ${stat.getValueColor(value)}`}>
                        <AnimatedValue value={value} suffix={stat.suffix} />
                      </p>
                      {stat.extra === 'sparkline' && (
                        <MiniSparkline data={weeklyTrends} />
                      )}
                      {stat.extra === 'progress-ring' && (
                        <ProgressRing percent={value} />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-tight">
                      {t(stat.unitKey)}
                    </p>
                  </>
                )}
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{tooltipText}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
