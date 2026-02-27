import { lazy, Suspense, useEffect, useMemo } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardPage, GenericErrorState } from '@parisgroup-ai/pageshell/composites';
import type { ModuleConfig, DashboardTab } from '@parisgroup-ai/pageshell/composites';
import { useDashboard } from '@/hooks/domain/useDashboard';
import { TooltipProvider, Skeleton } from '@parisgroup-ai/pageshell/primitives';
import { PageConfirmDialog } from '@parisgroup-ai/pageshell/interactions';
import {
  Sparkles, Users, Package, Sun, Moon, Sunset,
  LayoutDashboard, BarChart3,
} from 'lucide-react';
import { format } from 'date-fns';
import { getDateLocale, getDateFormat } from '@/lib/date-utils';

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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
  useDocumentTitle(t('pageTitle.dashboard'));
  const dashboard = useDashboard();
  const navigate = useNavigate();
  const isTabbed = !dashboard.isNewUser;

  // Handle return-to-origin after Google OAuth redirect
  useEffect(() => {
    const returnTo = sessionStorage.getItem('returnTo');
    if (returnTo) {
      sessionStorage.removeItem('returnTo');
      // Validate: must be a relative path (starts with /, not //)
      if (returnTo.startsWith('/') && !returnTo.startsWith('//')) {
        navigate(returnTo, { replace: true });
      }
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
        title: t('dashboard.alerts.lowCreditsTitle'),
        description: t('dashboard.alerts.lowCreditsDescription', { count: dashboard.creditsRemaining }),
        action: { label: t('dashboard.alerts.upgrade'), href: '/pricing' },
      });
    }

    return alerts;
  }, [dashboard.loading, dashboard.isActive, dashboard.isFree, dashboard.creditsRemaining, t]);

  const tabsConfig: DashboardTab[] | undefined = useMemo(() => isTabbed
    ? [
        {
          id: 'principal',
          label: t('dashboard.principal'),
          icon: LayoutDashboard,
          content: (
            <PrincipalTab
              modules={modules}
              sessions={dashboard.sessions}
              loading={dashboard.loadingSessions}
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
                loading={dashboard.loadingInsights}
                patientsThisMonth={dashboard.patientsThisMonth}
                patientGrowth={dashboard.patientGrowth}
              />
            </Suspense>
          ),
        },
      ]
    : undefined, [isTabbed, t, modules, dashboard.sessions, dashboard.loadingSessions, dashboard.loadingInsights, dashboard.pendingDraft, dashboard.metrics.pendingSessions, dashboard.requestDiscardDraft, dashboard.clinicalInsights, dashboard.weeklyTrends]);

  const hour = new Date().getHours();

  const TimeIcon = useMemo(() => {
    if (hour >= 6 && hour < 12) return <Sun className="w-5 h-5 text-primary" aria-hidden="true" />;
    if (hour >= 12 && hour < 18) return <Sunset className="w-5 h-5 text-primary/80" aria-hidden="true" />;
    return <Moon className="w-5 h-5 text-muted-foreground" aria-hidden="true" />;
  }, [hour]);

  const slotsConfig = useMemo(() => ({
    header: (
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-1">
          {TimeIcon}
          <h2 className="text-2xl sm:text-3xl font-semibold font-display tracking-tight">
            {dashboard.greeting},{' '}
            {dashboard.loadingProfile ? (
              <Skeleton className="inline-block h-7 w-32 align-middle rounded-lg" />
            ) : (
              <span className="text-primary">{dashboard.firstName}</span>
            )}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground ml-8">
          {/* Portuguese date format — 'de' connector is language-specific */}
          {format(new Date(), getDateFormat('greeting'), { locale: getDateLocale() }).replace(/^\w/, (c) => c.toUpperCase())}
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
              loading={dashboard.loadingMetrics}
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
                loading={dashboard.loadingMetrics}
                weekRange={dashboard.weekRange}
                weeklyTrends={dashboard.weeklyTrends}
              />
            </Suspense>
          ),
          afterStats: <OnboardingProgress />,
        }
      : {}),
  }), [TimeIcon, dashboard.greeting, dashboard.firstName, dashboard.loadingProfile, dashboard.showCreditsBanner, dashboard.creditsRemaining, dashboard.dismissCreditsBanner, clinicAlerts, isTabbed, dashboard.metrics, dashboard.loadingMetrics, dashboard.weekRange, dashboard.weeklyTrends]);

  if (dashboard.isError) {
    return (
      <GenericErrorState
        title={t('dashboard.loadError')}
        description={t('errors.tryReloadPage')}
      />
    );
  }

  return (
    <TooltipProvider>
      <div className="relative section-glow-bg overflow-hidden">
        {/* Ambient AI grid overlay */}
        <div className="ai-grid-pattern absolute inset-0 opacity-30 dark:opacity-50 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_70%,transparent_100%)] pointer-events-none" aria-hidden="true" />
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <DashboardPage
          title={" "}
          containerVariant="shell"
          modules={isTabbed ? undefined : modules}
          tabs={tabsConfig}
          slots={slotsConfig}
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
      </div>{/* /section-glow-bg */}
    </TooltipProvider>
  );
}
