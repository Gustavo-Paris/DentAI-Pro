import { Link } from 'react-router-dom';
import { DashboardPage } from '@pageshell/composites/dashboard';
import type { ModuleConfig } from '@pageshell/composites/dashboard';
import { useDashboard } from '@/hooks/domain/useDashboard';
import type { DashboardSession } from '@/hooks/domain/useDashboard';
import { WizardDraft } from '@/hooks/useWizardDraft';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
  X, ArrowRight, Sparkles,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
      className="relative overflow-hidden rounded-xl border border-amber-200/60 dark:border-amber-700/40 animate-fade-in"
      style={{ animationDelay: '0.1s' }}
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
            className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-600/20 shrink-0"
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
    key: 'pendingCases' as const,
    label: 'Em aberto',
    icon: FileWarning,
    tooltip: 'Casos aguardando conclusão do checklist',
    accentColor: 'from-amber-400 to-orange-500',
    darkAccentColor: 'dark:from-amber-500 dark:to-orange-400',
    getValueColor: (v: number) =>
      v > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground',
  },
  {
    key: 'weeklyEvaluations' as const,
    label: 'Esta semana',
    icon: TrendingUp,
    tooltip: '',
    accentColor: 'from-blue-400 to-cyan-500',
    darkAccentColor: 'dark:from-blue-400 dark:to-cyan-400',
    getValueColor: () => 'text-foreground',
  },
  {
    key: 'completionRate' as const,
    label: 'Conclusão',
    icon: CheckCircle2,
    tooltip: 'Taxa de casos concluídos vs. total',
    accentColor: 'from-emerald-400 to-teal-500',
    darkAccentColor: 'dark:from-emerald-400 dark:to-teal-400',
    getValueColor: () => 'text-primary',
    suffix: '%',
  },
  {
    key: 'totalPatients' as const,
    label: 'Pacientes',
    icon: Users,
    tooltip: 'Pacientes únicos cadastrados',
    accentColor: 'from-violet-400 to-purple-500',
    darkAccentColor: 'dark:from-violet-400 dark:to-purple-400',
    getValueColor: () => 'text-foreground',
  },
] as const;

function StatsGrid({
  metrics,
  loading,
  weekRange,
}: {
  metrics: { pendingCases: number; weeklyEvaluations: number; completionRate: number; totalPatients: number };
  loading: boolean;
  weekRange: { start: string; end: string };
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                className="group relative overflow-hidden p-3 sm:p-4 cursor-default transition-all duration-200 hover:shadow-md animate-fade-in"
                style={{ animationDelay: `${0.05 + i * 0.05}s` }}
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
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className={`text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${stat.getValueColor(value)}`}>
                    {value}{'suffix' in stat ? stat.suffix : ''}
                  </p>
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
    <div className="animate-fade-in" style={{ animationDelay: '0.25s' }}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Primeiros passos
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Link key={step.href} to={step.href}>
              <Card className="group relative overflow-hidden p-4 sm:p-5 border-dashed hover:border-solid hover:shadow-md transition-all duration-200 cursor-pointer h-full">
                <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${step.iconBg} transition-transform duration-200 group-hover:scale-110`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
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

function SessionCard({ session }: { session: DashboardSession }) {
  const isCompleted = session.completedCount === session.evaluationCount;

  return (
    <Link to={`/evaluation/${session.session_id}`}>
      <Card className="group relative overflow-hidden p-3 sm:p-4 hover:shadow-md transition-all duration-200 cursor-pointer">
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
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground self-end sm:self-center">
            <span className="hidden sm:inline">
              {format(new Date(session.created_at), "d 'de' MMM", { locale: ptBR })}
            </span>
            <span className="sm:hidden">
              {format(new Date(session.created_at), 'dd/MM', { locale: ptBR })}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
          </div>
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
  return (
    <div className="animate-fade-in" style={{ animationDelay: '0.35s' }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
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
        <Card className="p-8 sm:p-10 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileText className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium text-sm mb-1">Nenhuma avaliação ainda</p>
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
      description: `${dashboard.metrics.totalPatients} cadastrados`,
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

  return (
    <TooltipProvider>
      <div id="main-content" className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <DashboardPage
          title={`${dashboard.greeting}, ${dashboard.firstName}`}
          description="Bem-vindo ao seu painel"
          containerVariant="shell"
          modules={modules}
          slots={{
            afterHeader: dashboard.showCreditsBanner ? (
              <CreditsBanner
                creditsRemaining={dashboard.creditsRemaining}
                onDismiss={dashboard.dismissCreditsBanner}
              />
            ) : undefined,
            stats: (
              <StatsGrid
                metrics={dashboard.metrics}
                loading={dashboard.loading}
                weekRange={dashboard.weekRange}
              />
            ),
            afterStats: dashboard.isNewUser ? <OnboardingCards /> : undefined,
            afterModules: (
              <RecentSessions
                sessions={dashboard.sessions}
                loading={dashboard.loading}
                pendingDraft={dashboard.pendingDraft}
                onDiscardDraft={dashboard.requestDiscardDraft}
              />
            ),
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
