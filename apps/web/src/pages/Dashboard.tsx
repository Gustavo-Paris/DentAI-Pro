import { Link } from 'react-router-dom';
import { DashboardPage, DashboardModuleCard } from '@pageshell/composites/dashboard';
import type { ModuleConfig, DashboardTab } from '@pageshell/composites/dashboard';
import { useDashboard } from '@/hooks/domain/useDashboard';
import type { DashboardSession, ClinicalInsights, WeeklyTrendPoint } from '@/hooks/domain/useDashboard';
import { WizardDraft } from '@/hooks/useWizardDraft';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis } from 'recharts';
import { getTreatmentConfig } from '@/lib/treatment-config';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus, FileText, Package, ChevronRight, FileWarning,
  TrendingUp, Users, CheckCircle2, Zap, Camera, AlertTriangle,
  X, ArrowRight, Sparkles, Sun, Moon, Sunset,
  LayoutDashboard, BarChart3,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useScrollReveal, useScrollRevealChildren } from '@/hooks/useScrollReveal';

// =============================================================================
// UI Sub-components (presentation only — no business logic)
// =============================================================================

function CreditsBanner({
  creditsRemaining,
  onDismiss,
}: {
  creditsRemaining: number;
  onDismiss: () => void;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-amber-200/60 dark:border-amber-700/40 shadow-sm scroll-reveal"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-amber-50 via-orange-50/80 to-amber-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(251,191,36,0.08),_transparent_60%)]" />

      <div className="relative flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
          <AlertTriangle className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            {creditsRemaining} crédito{creditsRemaining !== 1 ? 's' : ''} restante{creditsRemaining !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-amber-700/80 dark:text-amber-300/70 mt-0.5">
            Faça upgrade para continuar sem interrupção
          </p>
        </div>
        <Link to="/pricing">
          <Button
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-600/20 shrink-0 btn-glow-gold"
          >
            Ver planos
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </Link>
        <button
          onClick={onDismiss}
          className="p-1 rounded-md text-amber-400 hover:text-amber-600 hover:bg-amber-100/50 dark:hover:bg-amber-800/30 transition-colors shrink-0"
          aria-label="Fechar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

const statConfigs = [
  {
    key: 'pendingSessions' as const,
    label: 'Em aberto',
    unit: 'avaliações',
    icon: FileWarning,
    tooltip: 'Avaliações com dentes ainda não concluídos',
    accentColor: 'from-amber-400 to-orange-500',
    darkAccentColor: 'dark:from-amber-500 dark:to-orange-400',
    getValueColor: (v: number) =>
      v > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground',
  },
  {
    key: 'weeklySessions' as const,
    label: 'Esta semana',
    unit: 'novas avaliações',
    icon: TrendingUp,
    tooltip: '',
    accentColor: 'from-blue-400 to-cyan-500',
    darkAccentColor: 'dark:from-blue-400 dark:to-cyan-400',
    getValueColor: () => 'text-foreground',
  },
  {
    key: 'completionRate' as const,
    label: 'Conclusão',
    unit: 'das avaliações concluídas',
    icon: CheckCircle2,
    tooltip: 'Avaliações com todos os dentes concluídos',
    accentColor: 'from-emerald-400 to-teal-500',
    darkAccentColor: 'dark:from-emerald-400 dark:to-teal-400',
    getValueColor: () => 'text-primary',
    suffix: '%',
  },
  {
    key: 'pendingTeeth' as const,
    label: 'Casos pendentes',
    unit: 'dentes em aberto',
    icon: FileText,
    tooltip: 'Total de dentes aguardando conclusão',
    accentColor: 'from-violet-400 to-purple-500',
    darkAccentColor: 'dark:from-violet-400 dark:to-purple-400',
    getValueColor: (v: number) =>
      v > 0 ? 'text-violet-600 dark:text-violet-400' : 'text-foreground',
  },
] as const;

function StatsGrid({
  metrics,
  loading,
  weekRange,
}: {
  metrics: { pendingSessions: number; weeklySessions: number; completionRate: number; pendingTeeth: number };
  loading: boolean;
  weekRange: { start: string; end: string };
}) {
  const containerRef = useScrollRevealChildren();

  return (
    <div ref={containerRef} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {statConfigs.map((stat, i) => {
        const Icon = stat.icon;
        const value = metrics[stat.key];
        const tooltipText =
          stat.key === 'weeklyEvaluations'
            ? `${weekRange.start} – ${weekRange.end}`
            : stat.tooltip;

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
                    {stat.label}
                  </p>
                </div>
                {loading ? (
                  <Skeleton className="h-10 w-14" />
                ) : (
                  <>
                    <p className={`text-3xl sm:text-4xl font-semibold tracking-tight tabular-nums ${stat.getValueColor(value)}`}>
                      {value}{'suffix' in stat ? stat.suffix : ''}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-tight">
                      {stat.unit}
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

function OnboardingCards() {
  const containerRef = useScrollRevealChildren();

  const steps = [
    {
      href: '/inventory',
      icon: Package,
      step: '1',
      title: 'Cadastre seu inventário',
      description: 'Adicione suas resinas para recomendações personalizadas',
      gradient: 'from-blue-500/10 to-cyan-500/10 dark:from-blue-500/5 dark:to-cyan-500/5',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    },
    {
      href: '/new-case',
      icon: Camera,
      step: '2',
      title: 'Crie sua primeira avaliação',
      description: 'Tire uma foto e receba análise com IA',
      gradient: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    },
    {
      href: '/patients',
      icon: Users,
      step: '3',
      title: 'Cadastre pacientes',
      description: 'Organize seus pacientes e históricos',
      gradient: 'from-violet-500/10 to-purple-500/10 dark:from-violet-500/5 dark:to-purple-500/5',
      iconBg: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400',
    },
  ];

  return (
    <div ref={containerRef}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Primeiros passos
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <Link key={step.href} to={step.href}>
              <Card className={`scroll-reveal scroll-reveal-delay-${i + 1} group relative overflow-hidden p-4 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 rounded-xl transition-all duration-300 cursor-pointer h-full`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${step.iconBg} transition-transform duration-200 group-hover:scale-110`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[10px] font-bold text-gradient-gold uppercase tracking-widest">
                      Passo {step.step}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-0.5">{step.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function DraftCard({
  draft,
  onDiscard,
}: {
  draft: WizardDraft;
  onDiscard: () => void;
}) {
  return (
    <Card className="relative overflow-hidden p-3 sm:p-4 animate-scale-in">
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-amber-400 to-orange-500" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <FileWarning className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <p className="font-semibold text-sm sm:text-base">
              {draft.formData?.patientName || 'Paciente sem nome'}
            </p>
            <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 font-semibold uppercase tracking-wider">
              Rascunho
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {draft.selectedTeeth?.length || 0} dente{(draft.selectedTeeth?.length || 0) !== 1 ? 's' : ''} selecionado{(draft.selectedTeeth?.length || 0) !== 1 ? 's' : ''}
            </p>
            <span className="text-muted-foreground/40" aria-hidden="true">·</span>
            <p className="text-xs text-muted-foreground">
              Salvo {formatDistanceToNow(new Date(draft.lastSavedAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 dark:text-amber-300 dark:hover:text-amber-100 dark:hover:bg-amber-900/50 text-xs"
            onClick={onDiscard}
            aria-label="Descartar rascunho"
          >
            Descartar
          </Button>
          <Link to="/new-case">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 text-white text-xs shadow-sm" aria-label="Continuar avaliação">
              Continuar
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

function WeeklyTrendsChart({ data, loading }: { data: WeeklyTrendPoint[]; loading: boolean }) {
  const containerRef = useScrollReveal();
  const chartConfig: ChartConfig = {
    value: { label: 'Avaliações', color: 'hsl(var(--primary))' },
  };
  if (loading) return <Skeleton className="h-[200px] w-full rounded-xl" />;
  return (
    <div ref={containerRef} className="scroll-reveal">
      <h2 className="text-sm font-semibold font-display uppercase tracking-wider text-muted-foreground mb-3">
        Tendência semanal
      </h2>
      <Card className="p-4 shadow-sm rounded-xl">
        <ChartContainer config={chartConfig} className="aspect-auto h-[180px] w-full">
          <BarChart data={data}>
            <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis hide allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </Card>
    </div>
  );
}

function ClinicalStatsCard({ insights }: { insights: ClinicalInsights }) {
  const containerRef = useScrollReveal();
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
      </Card>
    </div>
  );
}

function TreatmentDistribution({ items }: { items: Array<{ label: string; value: number; color: string }> }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return (
    <Card className="p-4 shadow-sm rounded-xl">
      <h3 className="text-base font-semibold mb-4">Distribuição de Tratamentos</h3>
      <div className="space-y-3">
        {items.map((item, i) => {
          const pct = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{item.label}</span>
                <span className="text-muted-foreground">{item.value} ({pct.toFixed(0)}%)</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: item.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function SessionCard({ session }: { session: DashboardSession }) {
  const isCompleted = session.completedCount === session.evaluationCount;
  const progressPercent = session.evaluationCount > 0
    ? (session.completedCount / session.evaluationCount) * 100
    : 0;

  return (
    <Link to={`/evaluation/${session.session_id}`}>
      <Card className="group relative overflow-hidden p-3 sm:p-4 shadow-sm hover:shadow-md rounded-xl transition-all duration-300 cursor-pointer">
        <div
          className={`absolute left-0 top-0 bottom-0 w-[3px] ${
            isCompleted
              ? 'bg-gradient-to-b from-emerald-400 to-teal-500'
              : 'bg-gradient-to-b from-amber-400 to-orange-400'
          }`}
        />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-sm sm:text-base truncate">
                {session.patient_name || 'Paciente sem nome'}
              </p>
              <Badge
                variant="outline"
                className={`text-[10px] font-semibold uppercase tracking-wider shrink-0 ${
                  isCompleted
                    ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                    : 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30'
                }`}
              >
                {isCompleted ? 'Concluído' : 'Em progresso'}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {session.evaluationCount} dente{session.evaluationCount > 1 ? 's' : ''}
              </p>
              <span className="text-muted-foreground/40 hidden sm:inline">·</span>
              <div className="flex gap-1 flex-wrap">
                {session.teeth.slice(0, 2).map((tooth) => (
                  <Badge key={tooth} variant="outline" className="text-[10px] font-mono px-1.5">
                    {tooth}
                  </Badge>
                ))}
                {session.teeth.length > 2 && (
                  <Badge variant="outline" className="text-[10px] px-1.5">
                    +{session.teeth.length - 2}
                  </Badge>
                )}
              </div>
              {session.treatmentTypes.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {session.treatmentTypes.map(type => {
                    const config = getTreatmentConfig(type);
                    return (
                      <Badge key={type} variant="outline" className="text-[10px] px-1.5 gap-1">
                        <config.icon className="w-2.5 h-2.5" />
                        {config.shortLabel}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground self-end sm:self-center">
            <span className="hidden sm:inline">
              {format(new Date(session.created_at), "d 'de' MMM", { locale: ptBR })}
              {session.patientAge && <span> · {session.patientAge} anos</span>}
            </span>
            <span className="sm:hidden">
              {format(new Date(session.created_at), 'dd/MM', { locale: ptBR })}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </Card>
    </Link>
  );
}

function RecentSessions({
  sessions,
  loading,
  pendingDraft,
  onDiscardDraft,
}: {
  sessions: DashboardSession[];
  loading: boolean;
  pendingDraft: WizardDraft | null;
  onDiscardDraft: () => void;
}) {
  const containerRef = useScrollReveal();

  return (
    <div ref={containerRef} className="scroll-reveal">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold font-display uppercase tracking-wider text-muted-foreground">
          Avaliações recentes
        </h2>
        <Link to="/evaluations">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" aria-label="Ver todas as avaliações">
            <span className="hidden sm:inline">Ver todas</span>
            <span className="sm:hidden">Todas</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" aria-hidden="true" />
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
          ))}
        </div>
      ) : sessions.length === 0 && !pendingDraft ? (
        <Card className="grain-overlay p-8 sm:p-10 text-center">
          <div className="relative flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileText className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium font-display text-sm mb-1 text-gradient-gold">Nenhuma avaliação ainda</p>
              <p className="text-xs text-muted-foreground mb-4">Comece criando sua primeira avaliação com IA</p>
            </div>
            <Link to="/new-case">
              <Button size="sm" aria-label="Criar primeira avaliação">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Criar avaliação
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {pendingDraft && (
            <DraftCard draft={pendingDraft} onDiscard={onDiscardDraft} />
          )}
          {sessions.map((session) => (
            <SessionCard key={session.session_id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Page Adapter — maps domain hook → DashboardPage composite
// =============================================================================

export default function Dashboard() {
  const dashboard = useDashboard();

  const modules: ModuleConfig[] = [
    {
      id: 'new-case',
      title: 'Nova Avaliação',
      description: 'Análise com IA',
      icon: Sparkles,
      href: '/new-case',
      variant: 'primary',
      render: () => (
        <div className="flex items-center gap-1.5 text-xs font-medium text-primary/80">
          <Zap className="w-3 h-3" />
          <span>3 créditos por avaliação</span>
        </div>
      ),
    },
    {
      id: 'patients',
      title: 'Meus Pacientes',
      description: 'Gerenciar pacientes',
      icon: Users,
      href: '/patients',
    },
    {
      id: 'inventory',
      title: 'Meu Inventário',
      description: 'Resinas disponíveis',
      icon: Package,
      href: '/inventory',
    },
  ];

  const isTabbed = !dashboard.isNewUser;

  const tabsConfig: DashboardTab[] | undefined = isTabbed
    ? [
        {
          id: 'principal',
          label: 'Principal',
          icon: LayoutDashboard,
          content: (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {modules.map((mod) => (
                  <DashboardModuleCard key={mod.id} module={mod} />
                ))}
              </div>
              <RecentSessions
                sessions={dashboard.sessions}
                loading={dashboard.loading}
                pendingDraft={dashboard.pendingDraft}
                onDiscardDraft={dashboard.requestDiscardDraft}
              />
            </>
          ),
        },
        {
          id: 'insights',
          label: 'Insights',
          icon: BarChart3,
          content: (
            <div className="space-y-4">
              <WeeklyTrendsChart data={dashboard.weeklyTrends} loading={dashboard.loading} />
              {dashboard.clinicalInsights && (
                <TreatmentDistribution items={dashboard.clinicalInsights.treatmentDistribution} />
              )}
              {dashboard.clinicalInsights && (
                <ClinicalStatsCard insights={dashboard.clinicalInsights} />
              )}
            </div>
          ),
        },
      ]
    : undefined;

  return (
    <TooltipProvider>
      <div id="main-content" className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <DashboardPage
          title=""
          containerVariant="shell"
          modules={isTabbed ? undefined : modules}
          tabs={tabsConfig}
          slots={{
            header: (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                  {(() => {
                    const hour = new Date().getHours();
                    if (hour >= 6 && hour < 12) return <Sun className="w-5 h-5 text-amber-500" />;
                    if (hour >= 12 && hour < 18) return <Sunset className="w-5 h-5 text-orange-500" />;
                    return <Moon className="w-5 h-5 text-indigo-400" />;
                  })()}
                  <h1 className="text-2xl sm:text-3xl font-semibold font-display tracking-tight">
                    {dashboard.greeting}, <span className="text-gradient-gold">{dashboard.firstName}</span>
                  </h1>
                </div>
                <p className="text-sm text-muted-foreground ml-8">
                  {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase())}
                </p>
              </div>
            ),
            afterHeader: (
              <>
                {dashboard.showCreditsBanner && (
                  <CreditsBanner
                    creditsRemaining={dashboard.creditsRemaining}
                    onDismiss={dashboard.dismissCreditsBanner}
                  />
                )}
                {isTabbed && (
                  <StatsGrid
                    metrics={dashboard.metrics}
                    loading={dashboard.loading}
                    weekRange={dashboard.weekRange}
                  />
                )}
              </>
            ),
            ...(!isTabbed
              ? {
                  stats: (
                    <StatsGrid
                      metrics={dashboard.metrics}
                      loading={dashboard.loading}
                      weekRange={dashboard.weekRange}
                    />
                  ),
                  afterStats: <OnboardingCards />,
                  afterModules: (
                    <RecentSessions
                      sessions={dashboard.sessions}
                      loading={dashboard.loading}
                      pendingDraft={dashboard.pendingDraft}
                      onDiscardDraft={dashboard.requestDiscardDraft}
                    />
                  ),
                }
              : {}),
          }}
        />

        <AlertDialog
          open={dashboard.showDiscardConfirm}
          onOpenChange={dashboard.cancelDiscardDraft}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Descartar rascunho?</AlertDialogTitle>
              <AlertDialogDescription>
                O rascunho será apagado permanentemente. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={dashboard.confirmDiscardDraft}>
                Descartar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
