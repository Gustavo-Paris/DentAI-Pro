import { useTranslation } from 'react-i18next';
import type { DashboardMetrics, WeeklyTrendPoint } from '@/hooks/domain/useDashboard';
import { Card, Skeleton, Tooltip, TooltipContent, TooltipTrigger } from '@parisgroup-ai/pageshell/primitives';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import {
  FileText, Users, TrendingUp, CheckCircle2,
} from 'lucide-react';
import { useScrollRevealChildren } from '@/hooks/useScrollReveal';
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
    <svg width={size} height={size} className="shrink-0 -rotate-90">
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
    <div className="shrink-0 w-14 sm:w-20">
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
  iconBg: string;
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
    iconBg: 'bg-primary/10 text-primary dark:bg-primary/15',
    getValueColor: () => 'text-foreground',
  },
  {
    key: 'totalPatients',
    labelKey: 'dashboard.stats.patients',
    unitKey: 'dashboard.stats.patientsUnit',
    icon: Users,
    tooltipKey: 'dashboard.stats.patientsTooltip',
    iconBg: 'bg-info/10 text-info',
    getValueColor: () => 'text-foreground',
  },
  {
    key: 'weeklySessions',
    labelKey: 'dashboard.stats.thisWeek',
    unitKey: 'dashboard.stats.thisWeekUnit',
    icon: TrendingUp,
    tooltipKey: 'dashboard.stats.thisWeekTooltip',
    iconBg: 'bg-accent/10 text-accent',
    getValueColor: () => 'text-foreground',
    extra: 'sparkline',
  },
  {
    key: 'completionRate',
    labelKey: 'dashboard.stats.completion',
    unitKey: 'dashboard.stats.completionUnit',
    icon: CheckCircle2,
    tooltipKey: 'dashboard.stats.completionTooltip',
    iconBg: 'bg-success/10 text-success',
    getValueColor: () => 'text-foreground',
    suffix: '%',
    extra: 'progress-ring',
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
    <div ref={containerRef} className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger-enter">
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
                className={`scroll-reveal scroll-reveal-delay-${i + 1} group relative overflow-hidden p-3 sm:p-4 cursor-default shadow-sm hover:shadow-md rounded-xl border border-border/50 hover:border-border transition-all duration-300 dark:bg-gradient-to-br dark:from-card dark:to-card/80 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 glow-card`}
              >
                {/* Glass top-edge highlight — subtle depth cue in dark mode */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/[0.06] to-transparent dark:block hidden pointer-events-none" />
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.iconBg} transition-transform duration-200 group-hover:scale-110 glow-icon`}>
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <p className="text-[11px] font-semibold text-muted-foreground tracking-wide uppercase leading-tight">
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
