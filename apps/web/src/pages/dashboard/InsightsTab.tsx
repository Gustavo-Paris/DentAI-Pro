import type { ClinicalInsights, WeeklyTrendPoint } from '@/hooks/domain/useDashboard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from 'recharts';
import { useScrollReveal } from '@/hooks/useScrollReveal';

// ---------------------------------------------------------------------------
// Weekly Trends — AreaChart
// ---------------------------------------------------------------------------

function WeeklyTrendsChart({ data, loading }: { data: WeeklyTrendPoint[]; loading: boolean }) {
  const containerRef = useScrollReveal();
  const chartConfig: ChartConfig = {
    value: { label: 'Avaliações', color: 'hsl(var(--primary))' },
  };

  const totalPeriod = data.reduce((sum, d) => sum + d.value, 0);

  if (loading) return <Skeleton className="h-[200px] w-full rounded-xl" />;

  return (
    <div ref={containerRef} className="scroll-reveal">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold font-display uppercase tracking-wider text-muted-foreground">
          Tendência semanal
        </h2>
        <Badge variant="secondary" className="text-xs">
          {totalPeriod} avaliações no período
        </Badge>
      </div>
      <Card className="p-4 shadow-sm rounded-xl">
        <ChartContainer config={chartConfig} className="aspect-auto h-[200px] w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
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
              strokeWidth={2}
              fill="url(#areaFill)"
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
  const containerRef = useScrollReveal();
  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (items.length === 0) return null;

  return (
    <div ref={containerRef} className="scroll-reveal">
      <Card className="p-4 shadow-sm rounded-xl">
        <h3 className="text-sm font-semibold font-display text-muted-foreground mb-3">
          Distribuição de Tratamentos
        </h3>
        <div className="flex flex-col items-center">
          <div className="relative w-[180px] h-[180px]">
            <PieChart width={180} height={180}>
              <Pie
                data={items}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="80%"
                strokeWidth={2}
                stroke="hsl(var(--card))"
              >
                {items.map((item, i) => (
                  <Cell key={i} fill={item.color} />
                ))}
              </Pie>
            </PieChart>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-semibold tabular-nums">{total}</span>
              <span className="text-[10px] text-muted-foreground">total</span>
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
  const containerRef = useScrollReveal();

  if (resins.length === 0) return null;

  const chartConfig: ChartConfig = {
    count: { label: 'Usos', color: 'hsl(var(--chart-1))' },
  };

  return (
    <div ref={containerRef} className="scroll-reveal">
      <Card className="p-4 shadow-sm rounded-xl">
        <h3 className="text-sm font-semibold font-display text-muted-foreground mb-3">
          Resinas mais usadas
        </h3>
        <ChartContainer config={chartConfig} className="aspect-auto h-[180px] w-full">
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
              barSize={20}
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
  const containerRef = useScrollReveal();
  const totalWeeklyEvals = weeklyTrends.reduce((sum, w) => sum + w.value, 0);
  const avgPerWeek = weeklyTrends.length > 0 ? (totalWeeklyEvals / weeklyTrends.length).toFixed(1) : '0';

  return (
    <div ref={containerRef} className="scroll-reveal">
      <Card className="p-4 space-y-3 shadow-sm rounded-xl">
        <h3 className="text-sm font-semibold font-display text-muted-foreground">Resumo clínico</h3>

        {insights.topResin && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Resina mais usada</span>
            <Badge variant="secondary" className="text-xs">{insights.topResin}</Badge>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Uso do inventário</span>
          <div className="flex items-center gap-2">
            <Progress value={insights.inventoryRate} className="w-20 h-2" />
            <span className="text-xs font-medium tabular-nums">{insights.inventoryRate}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Total de casos</span>
          <span className="text-xs font-medium tabular-nums">{insights.totalEvaluated}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Média por semana</span>
          <span className="text-xs font-medium tabular-nums">{avgPerWeek}</span>
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
}: {
  clinicalInsights: ClinicalInsights | null;
  weeklyTrends: WeeklyTrendPoint[];
  loading: boolean;
}) {
  return (
    <div className="space-y-4">
      <WeeklyTrendsChart data={weeklyTrends} loading={loading} />

      {clinicalInsights && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TreatmentDonut items={clinicalInsights.treatmentDistribution} />
          <TopResinsChart resins={clinicalInsights.topResins} />
        </div>
      )}

      {clinicalInsights && (
        <ClinicalStatsCard insights={clinicalInsights} weeklyTrends={weeklyTrends} />
      )}
    </div>
  );
}
