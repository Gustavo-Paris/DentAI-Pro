import { lazy, Suspense, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardPage } from '@parisgroup-ai/pageshell/composites';
import type { ModuleConfig, DashboardTab } from '@parisgroup-ai/pageshell/composites';
import { useDashboard } from '@/hooks/domain/useDashboard';
import {
  TooltipProvider,
} from '@/components/ui/tooltip';
import { PageConfirmDialog } from '@parisgroup-ai/pageshell/interactions';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles, Users, Package, Sun, Moon, Sunset,
  LayoutDashboard, BarChart3,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const StatsGrid = lazy(() => import('./dashboard/StatsGrid').then(m => ({ default: m.StatsGrid })));
import { PrincipalTab } from './dashboard/PrincipalTab';
const InsightsTab = lazy(() => import('./dashboard/InsightsTab').then(m => ({ default: m.InsightsTab })));
import { CreditsBanner } from './dashboard/CreditsBanner';
import { PageClinicAlerts } from '@parisgroup-ai/domain-odonto-ai/dashboard';
import type { ClinicAlert } from '@parisgroup-ai/domain-odonto-ai/dashboard';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { WelcomeModal } from '@/components/onboarding/WelcomeModal';

function StatsGridFallback() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[88px] rounded-xl" />
      ))}
    </div>
  );
}

// =============================================================================
// Module Config
// =============================================================================

// =============================================================================
// Page Adapter — maps domain hook → DashboardPage composite
// =============================================================================

export default function Dashboard() {
  const { t } = useTranslation();
  const dashboard = useDashboard();
  const navigate = useNavigate();
  const isTabbed = !dashboard.isNewUser;

  // Handle return-to-origin after Google OAuth redirect
  useEffect(() => {
    const returnTo = sessionStorage.getItem('returnTo');
    if (returnTo) {
      sessionStorage.removeItem('returnTo');
      navigate(returnTo, { replace: true });
    }
  }, [navigate]);

  const modules: ModuleConfig[] = useMemo(() => [
    {
      id: 'new-case',
      title: t('dashboard.newEvaluation'),
      description: t('dashboard.newEvaluationDescription'),
      icon: Sparkles,
      href: '/new-case',
      variant: 'primary',
    },
    {
      id: 'patients',
      title: t('dashboard.myPatients'),
      description: t('dashboard.managePatients'),
      icon: Users,
      href: '/patients',
    },
    {
      id: 'inventory',
      title: t('dashboard.myInventory'),
      description: t('dashboard.availableResins'),
      icon: Package,
      href: '/inventory',
    },
  ], [t]);

  const clinicAlerts = useMemo((): ClinicAlert[] => {
    const alerts: ClinicAlert[] = [];

    // Low credits alert
    if (!dashboard.loading && dashboard.isActive && !dashboard.isFree && dashboard.creditsRemaining <= 5) {
      alerts.push({
        id: 'low-credits',
        type: dashboard.creditsRemaining <= 1 ? 'error' : 'warning',
        title: t('dashboard.alerts.lowCreditsTitle', { defaultValue: 'Créditos baixos' }),
        description: t('dashboard.alerts.lowCreditsDescription', {
          count: dashboard.creditsRemaining,
          defaultValue: `Você tem ${dashboard.creditsRemaining} créditos restantes.`,
        }),
        action: { label: t('dashboard.alerts.upgrade', { defaultValue: 'Ver planos' }), href: '/pricing' },
      });
    }

    return alerts;
  }, [dashboard.loading, dashboard.isActive, dashboard.isFree, dashboard.creditsRemaining, t]);

  const tabsConfig: DashboardTab[] | undefined = isTabbed
    ? [
        {
          id: 'principal',
          label: t('dashboard.principal'),
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
          label: t('dashboard.insightsTab'),
          icon: BarChart3,
          content: (
            <Suspense fallback={<StatsGridFallback />}>
              <InsightsTab
                clinicalInsights={dashboard.clinicalInsights}
                weeklyTrends={dashboard.weeklyTrends}
                loading={dashboard.loading}
              />
            </Suspense>
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
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-1">
                  {(() => {
                    const hour = new Date().getHours();
                    if (hour >= 6 && hour < 12) return <Sun className="w-5 h-5 text-primary" aria-hidden="true" />;
                    if (hour >= 12 && hour < 18) return <Sunset className="w-5 h-5 text-primary/80" aria-hidden="true" />;
                    return <Moon className="w-5 h-5 text-muted-foreground" aria-hidden="true" />;
                  })()}
                  <h1 className="text-2xl sm:text-3xl font-semibold font-display tracking-tight">
                    {dashboard.greeting}, <span className="text-primary">{dashboard.firstName}</span>
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
                {clinicAlerts.length > 0 && (
                  <div className="mb-4">
                    <PageClinicAlerts alerts={clinicAlerts} />
                  </div>
                )}
                {isTabbed && (
                  <Suspense fallback={<StatsGridFallback />}>
                    <StatsGrid
                      metrics={dashboard.metrics}
                      loading={dashboard.loading}
                      weekRange={dashboard.weekRange}
                      weeklyTrends={dashboard.weeklyTrends}
                    />
                  </Suspense>
                )}
              </>
            ),
            ...(!isTabbed
              ? {
                  stats: (
                    <Suspense fallback={<StatsGridFallback />}>
                      <StatsGrid
                        metrics={dashboard.metrics}
                        loading={dashboard.loading}
                        weekRange={dashboard.weekRange}
                        weeklyTrends={dashboard.weeklyTrends}
                      />
                    </Suspense>
                  ),
                  afterStats: <OnboardingProgress />,
                }
              : {}),
          }}
        />

        <PageConfirmDialog
          open={dashboard.showDiscardConfirm}
          onOpenChange={() => dashboard.cancelDiscardDraft()}
          title={t('dashboard.discardDraftTitle')}
          description={t('dashboard.discardDraftDescription')}
          confirmText={t('common.discard')}
          cancelText={t('common.cancel')}
          onConfirm={dashboard.confirmDiscardDraft}
          variant="destructive"
        />

        <WelcomeModal
          open={dashboard.showWelcome}
          onClose={dashboard.dismissWelcome}
          onTrySample={() => navigate('/new-case?sample=true')}
          onCreateCase={() => navigate('/new-case')}
        />
      </div>
    </TooltipProvider>
  );
}
