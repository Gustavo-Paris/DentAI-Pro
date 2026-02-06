import { DashboardPage } from '@pageshell/composites/dashboard';
import type { ModuleConfig, DashboardTab } from '@pageshell/composites/dashboard';
import { useDashboard } from '@/hooks/domain/useDashboard';
import {
  TooltipProvider,
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
  Sparkles, Users, Package, Sun, Moon, Sunset,
  LayoutDashboard, BarChart3,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { StatsGrid } from './dashboard/StatsGrid';
import { PrincipalTab } from './dashboard/PrincipalTab';
import { InsightsTab } from './dashboard/InsightsTab';
import { CreditsBanner } from './dashboard/CreditsBanner';
import { OnboardingCards } from './dashboard/OnboardingCards';

// =============================================================================
// Module Config
// =============================================================================

const modules: ModuleConfig[] = [
  {
    id: 'new-case',
    title: 'Nova Avaliação',
    description: 'Análise com IA · 3 créditos',
    icon: Sparkles,
    href: '/new-case',
    variant: 'primary',
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

// =============================================================================
// Page Adapter — maps domain hook → DashboardPage composite
// =============================================================================

export default function Dashboard() {
  const dashboard = useDashboard();
  const isTabbed = !dashboard.isNewUser;

  const tabsConfig: DashboardTab[] | undefined = isTabbed
    ? [
        {
          id: 'principal',
          label: 'Principal',
          icon: LayoutDashboard,
          content: (
            <PrincipalTab
              modules={modules}
              sessions={dashboard.sessions}
              loading={dashboard.loading}
              pendingDraft={dashboard.pendingDraft}
              pendingSessions={dashboard.metrics.pendingSessions}
              onDiscardDraft={dashboard.requestDiscardDraft}
            />
          ),
        },
        {
          id: 'insights',
          label: 'Insights',
          icon: BarChart3,
          content: (
            <InsightsTab
              clinicalInsights={dashboard.clinicalInsights}
              weeklyTrends={dashboard.weeklyTrends}
              loading={dashboard.loading}
            />
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
                    if (hour >= 6 && hour < 12) return <Sun className="w-5 h-5 text-primary" />;
                    if (hour >= 12 && hour < 18) return <Sunset className="w-5 h-5 text-primary/80" />;
                    return <Moon className="w-5 h-5 text-muted-foreground" />;
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
                    weeklyTrends={dashboard.weeklyTrends}
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
                      weeklyTrends={dashboard.weeklyTrends}
                    />
                  ),
                  afterStats: <OnboardingCards />,
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
