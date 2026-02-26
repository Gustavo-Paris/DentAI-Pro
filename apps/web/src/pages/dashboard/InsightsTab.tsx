import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ClinicalInsights, WeeklyTrendPoint } from '@/hooks/domain/useDashboard';
import { Card, Badge, Button, Progress, Skeleton } from '@parisgroup-ai/pageshell/primitives';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, Tooltip as RechartsTooltip,
  BarChart, Bar,
} from 'recharts';
import { BarChart3, Plus } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { cn } from '@/lib/utils';

const BAR_SIZE = 20;

// ---------------------------------------------------------------------------
// Weekly Trends — AreaChart
// ---------------------------------------------------------------------------

function WeeklyTrendsChart({ data, loading }: { data: WeeklyTrendPoint[]; loading: boolean }) {
  const { t } = useTranslation();
  const containerRef = useScrollReveal();
  const chartConfig: ChartConfig = {
    value: { label: t('dashboard.insights.evaluationsLabel'), color: 'var(--color-primary)' },
  };

  const totalPeriod = data.reduce((sum, d) => sum + d.value, 0);

  if (loading) return <Skeleton className="h-52 w-full rounded-xl" />;

  return (
    <div ref={containerRef} className="scroll-reveal">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold font-display uppercase tracking-wider text-muted-foreground">
          {t('dashboard.insights.weeklyTrend')}
        </h2>
        <Badge variant="secondary" className="text-xs">
          {t('dashboard.insights.evaluationsInPeriod', { count: totalPeriod })}
        </Badge>
      </div>
      <Card className="p-4 shadow-sm rounded-xl">
        <ChartContainer config={chartConfig} className="aspect-auto h-52 w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis hide allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-value)"
              strokeWidth={2.5}
              fill="url(#areaFill)"
              dot={{ fill: 'var(--color-primary)', r: 3 }}
              activeDot={{ r: 5, strokeWidth: 2 }}
            />
          </AreaChart>
        </ChartContainer>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Treatment Distribution — Donut Chart
// ---------------------------------------------------------------------------

function TreatmentDonut({ items }: { items: Array<{ label: string; value: number; color: string }> }) {
  const { t } = useTranslation();
  const containerRef = useScrollReveal();
  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (items.length === 0) return null;

  return (
    <div ref={containerRef} className="scroll-reveal">
      <Card className="p-4 shadow-sm rounded-xl">
        <h3 className="text-sm font-semibold font-display text-muted-foreground mb-3">
          {t('dashboard.insights.treatmentDistribution')}
        </h3>
        <div className="flex flex-col items-center">
          <div className="relative w-44 h-44">
            <PieChart width={176} height={176}>
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const { label, value, color } = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-mono font-medium tabular-nums text-foreground">{value}</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Pie
                data={items}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="80%"
                strokeWidth={2}
                stroke="var(--color-card)"
                label={false}
                isAnimationActive={false}
              >
                {items.map((item, i) => (
                  <Cell key={i} fill={item.color} />
                ))}
              </Pie>
            </PieChart>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-semibold tabular-nums">{total}</span>
              <span className="text-[10px] text-muted-foreground">{t('dashboard.insights.total')}</span>
            </div>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top Resins — Horizontal Bar Chart
// ---------------------------------------------------------------------------

function TopResinsChart({ resins }: { resins: Array<{ name: string; count: number }> }) {
  const { t } = useTranslation();
  const containerRef = useScrollReveal();

  if (resins.length === 0) return null;

  const chartConfig: ChartConfig = {
    count: { label: t('dashboard.insights.usesLabel'), color: 'var(--chart-1)' },
  };

  return (
    <div ref={containerRef} className="scroll-reveal">
      <Card className="p-4 shadow-sm rounded-xl">
        <h3 className="text-sm font-semibold font-display text-muted-foreground mb-3">
          {t('dashboard.insights.topResins')}
        </h3>
        <ChartContainer config={chartConfig} className="aspect-auto h-44 w-full">
          <BarChart layout="vertical" data={resins} margin={{ left: 0, right: 16 }}>
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <XAxis type="number" hide />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[0, 4, 4, 0]}
              barSize={BAR_SIZE}
            />
          </BarChart>
        </ChartContainer>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Clinical Stats Card — Expanded
// ---------------------------------------------------------------------------

function ClinicalStatsCard({
  insights,
  weeklyTrends,
}: {
  insights: ClinicalInsights;
  weeklyTrends: WeeklyTrendPoint[];
}) {
  const { t } = useTranslation();
  const containerRef = useScrollReveal();
  const totalWeeklyEvals = weeklyTrends.reduce((sum, w) => sum + w.value, 0);
  const avgPerWeek = weeklyTrends.length > 0 ? (totalWeeklyEvals / weeklyTrends.length).toFixed(1) : '0';

  return (
    <div ref={containerRef} className="scroll-reveal">
      <Card className="p-4 space-y-3 shadow-sm rounded-xl">
        <h3 className="text-sm font-semibold font-display text-muted-foreground">{t('dashboard.insights.clinicalSummary')}</h3>

        {insights.topResin && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('dashboard.insights.topResin')}</span>
            <Badge variant="secondary" className="text-xs">{insights.topResin}</Badge>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t('dashboard.insights.inventoryUsage')}</span>
          <div className="flex items-center gap-2">
            <Progress value={insights.inventoryRate} className="w-20 h-2" />
            <span className="text-xs font-medium tabular-nums">{insights.inventoryRate}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t('dashboard.insights.totalCases')}</span>
          <span className="text-xs font-medium tabular-nums">{insights.totalEvaluated}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t('dashboard.insights.weeklyAverage')}</span>
          <span className="text-xs font-medium tabular-nums">{avgPerWeek}</span>
        </div>

        {insights.avgCompletionHours !== null && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {t('dashboard.insights.avgCompletionTime')}
            </span>
            <span className="text-xs font-medium tabular-nums">
              {insights.avgCompletionHours < 24
                ? `${insights.avgCompletionHours}h`
                : `${Math.round(insights.avgCompletionHours / 24)}d`}
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Patient Growth Card
// ---------------------------------------------------------------------------

function PatientGrowthCard({
  patientsThisMonth,
  patientGrowth,
}: {
  patientsThisMonth: number;
  patientGrowth: number | null;
}) {
  const { t } = useTranslation();
  const containerRef = useScrollReveal();

  return (
    <div ref={containerRef} className="scroll-reveal">
      <Card className="p-4 shadow-sm rounded-xl">
        <h3 className="text-sm font-semibold font-display text-muted-foreground mb-3">
          {t('dashboard.insights.patientGrowth')}
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-semibold tabular-nums">{patientsThisMonth}</p>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.insights.thisMonth')}
            </p>
          </div>
          {patientGrowth !== null && (
            <Badge variant={patientGrowth >= 0 ? 'secondary' : 'destructive'} className="text-xs">
              {patientGrowth >= 0 ? '+' : ''}{patientGrowth}%
            </Badge>
          )}
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// InsightsTab
// ---------------------------------------------------------------------------

export function InsightsTab({
  clinicalInsights,
  weeklyTrends,
  loading,
  patientsThisMonth,
  patientGrowth,
}: {
  clinicalInsights: ClinicalInsights | null;
  weeklyTrends: WeeklyTrendPoint[];
  loading: boolean;
  patientsThisMonth: number;
  patientGrowth: number | null;
}) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<number>(8);

  if (!loading && !clinicalInsights && weeklyTrends.length === 0) {
    return (
      <Card className="p-8 sm:p-10 text-center">
        <BarChart3 className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
        <p className="font-medium font-display text-sm mb-1">{t('dashboard.insights.noData')}</p>
        <p className="text-xs text-muted-foreground">
          {t('dashboard.insights.noDataDescription')}
        </p>
        <Link to="/new-case">
          <Button size="sm" variant="outline" className="mt-4">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            {t('dashboard.insights.createFirstCase')}
          </Button>
        </Link>
      </Card>
    );
  }

  const filteredTrends = weeklyTrends.slice(-period);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 mb-3" role="group" aria-label={t('dashboard.insights.periodFilter')}>
        {[8, 12, 26].map((w) => (
          <button
            key={w}
            onClick={() => setPeriod(w)}
            aria-pressed={period === w}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              period === w
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {w === 26 ? '6 meses' : `${w} sem`}
          </button>
        ))}
      </div>

      <WeeklyTrendsChart data={filteredTrends} loading={loading} />

      {clinicalInsights && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TreatmentDonut items={clinicalInsights.treatmentDistribution} />
          <TopResinsChart resins={clinicalInsights.topResins} />
        </div>
      )}

      {clinicalInsights && (
        <ClinicalStatsCard insights={clinicalInsights} weeklyTrends={filteredTrends} />
      )}

      <PatientGrowthCard
        patientsThisMonth={patientsThisMonth}
        patientGrowth={patientGrowth}
      />
    </div>
  );
}
