import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { CheckCircle2 } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { syncSubscription } from '@/data/subscriptions';
import type { SubscriptionPlan } from '@/data/subscriptions';
import { logger } from '@/lib/logger';
import { trackEvent } from '@/lib/analytics';
import {
  PricingPage,
  GenericErrorState,
  type PricingPlan,
  type PricingFeature,
  type BillingCycle,
  type PlanFeatureValue,
} from '@parisgroup-ai/pageshell/composites';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
} from '@parisgroup-ai/pageshell/primitives';

// =============================================================================
// Feature Definitions (mirrors PlanComparisonTable rows)
// =============================================================================

const FEATURE_DEFINITIONS: PricingFeature[] = [
  { id: 'creditsMonth', label: '' },
  { id: 'caseAnalyses', label: '' },
  { id: 'dsdSimulations', label: '' },
  { id: 'creditRollover', label: '' },
  { id: 'maxRollover', label: '' },
  { id: 'users', label: '' },
  { id: 'prioritySupport', label: '' },
  { id: 'resinRecommendations', label: '' },
  { id: 'cementationProtocols', label: '' },
  { id: 'pdfExport', label: '' },
  { id: 'dedicatedSupport', label: '' },
  { id: 'personalOnboarding', label: '' },
];

// =============================================================================
// Helpers: Map SubscriptionPlan -> PricingPlan
// =============================================================================

function buildFeatureValues(
  plan: SubscriptionPlan,
  t: (key: string) => string,
): PlanFeatureValue[] {
  const label = (id: string) => t(`components.pricing.comparison.${id}`);
  const unlimited = t('components.pricing.comparison.unlimited');

  // Build all features with descriptive string values for included features,
  // and boolean false for excluded ones (composite renders ✓/— accordingly).
  return [
    { featureId: 'creditsMonth', value: t('pricing.creditsPerMonth', { defaultValue: `${plan.credits_per_month} créditos/mês`, count: plan.credits_per_month }) },
    {
      featureId: 'caseAnalyses',
      value:
        plan.cases_per_month === -1
          ? t('pricing.unlimitedCaseAnalyses', { defaultValue: `${unlimited} análises de caso` })
          : t('pricing.caseAnalyses', { defaultValue: `~${plan.cases_per_month} análises de caso`, count: plan.cases_per_month }),
    },
    {
      featureId: 'dsdSimulations',
      value:
        plan.dsd_simulations_per_month === -1
          ? t('pricing.unlimitedDsdSimulations', { defaultValue: `${unlimited} simulações DSD` })
          : t('pricing.dsdSimulations', { defaultValue: `~${plan.dsd_simulations_per_month} simulações DSD`, count: plan.dsd_simulations_per_month }),
    },
    {
      featureId: 'creditRollover',
      value: plan.allows_rollover ? label('creditRollover') : false,
    },
    {
      featureId: 'maxRollover',
      value: plan.rollover_max
        ? `${label('maxRollover')}: ${plan.rollover_max}`
        : plan.allows_rollover
          ? `${label('maxRollover')}: ${unlimited}`
          : false,
    },
    { featureId: 'users', value: t('pricing.users', { defaultValue: `${plan.max_users} ${plan.max_users === 1 ? 'usuário' : 'usuários'}`, count: plan.max_users }) },
    {
      featureId: 'prioritySupport',
      value: plan.priority_support ? label('prioritySupport') : false,
    },
    { featureId: 'resinRecommendations', value: label('resinRecommendations') },
    {
      featureId: 'cementationProtocols',
      value: plan.sort_order >= 1 ? label('cementationProtocols') : false,
    },
    {
      featureId: 'pdfExport',
      value: plan.sort_order >= 1 ? label('pdfExport') : false,
    },
    {
      featureId: 'dedicatedSupport',
      value: plan.sort_order >= 3 ? label('dedicatedSupport') : false,
    },
    {
      featureId: 'personalOnboarding',
      value: plan.sort_order >= 3 ? label('personalOnboarding') : false,
    },
  ];
}

function mapToPricingPlan(
  plan: SubscriptionPlan,
  t: (key: string, opts?: Record<string, unknown>) => string,
  opts: {
    isCurrentPlan: boolean;
    isPopular: boolean;
    currentPlanSortOrder?: number;
  },
): PricingPlan {
  const isFree = plan.price_monthly === 0;
  const isDowngrade =
    opts.currentPlanSortOrder !== undefined &&
    plan.sort_order < opts.currentPlanSortOrder;
  const isUpgrade =
    opts.currentPlanSortOrder !== undefined &&
    plan.sort_order > opts.currentPlanSortOrder;

  // Determine CTA label
  let cta: string;
  if (opts.isCurrentPlan) {
    cta = t('components.pricing.card.currentPlanBtn');
  } else if (isFree) {
    cta = t('components.pricing.card.freePlanBtn');
  } else if (isDowngrade) {
    cta = t('components.pricing.card.changePlan');
  } else if (isUpgrade) {
    cta = t('components.pricing.card.upgrade');
  } else {
    cta = t('components.pricing.card.subscribe');
  }

  // Determine badge
  let badge: string | undefined;
  if (opts.isCurrentPlan) {
    badge = t('components.pricing.card.currentPlan');
  } else if (opts.isPopular) {
    badge = t('components.pricing.card.mostPopular');
  }

  return {
    id: plan.id,
    label: plan.name,
    description: plan.description,
    price: {
      monthly: plan.price_monthly / 100,
      annual: (plan.price_yearly ?? plan.price_monthly * 12) / 100,
    },
    cta,
    featured: opts.isPopular && !opts.isCurrentPlan,
    badge,
    features: buildFeatureValues(plan, t).filter((f) => f.value !== false),
  };
}

// =============================================================================
// Page Adapter
// =============================================================================

export default function Pricing() {
  const { t } = useTranslation();
  useDocumentTitle(t('pageTitle.pricing', { defaultValue: 'Planos' }));
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    plans,
    subscription,
    currentPlan,
    isLoading,
    checkout,
    isCheckingOut,
    refreshSubscription,
  } = useSubscription();
  const [showSuccess, setShowSuccess] = useState(false);

  // Track subscription page view
  useEffect(() => {
    trackEvent('subscription_viewed');
  }, []);

  // Handle redirect from Stripe
  useEffect(() => {
    const status = searchParams.get('subscription');

    if (status === 'success') {
      setShowSuccess(true);
      let cancelled = false;
      // Sync subscription from Stripe with retry (bypasses webhook timing issues)
      const syncWithRetry = async (attempts = 3, delay = 2000) => {
        for (let i = 0; i < attempts; i++) {
          if (cancelled) return;
          try {
            const data = await syncSubscription();
            if (cancelled) return;
            if (data?.synced) {
              refreshSubscription();
              return;
            }
          } catch (e) {
            logger.error(`Sync attempt ${i + 1} failed:`, e);
          }
          if (i < attempts - 1 && !cancelled) {
            await new Promise<void>((r) => setTimeout(r, delay));
          }
        }
        if (!cancelled) refreshSubscription();
      };
      syncWithRetry();
      navigate('/pricing', { replace: true });
      return () => { cancelled = true; };
    } else if (status === 'canceled') {
      navigate('/pricing', { replace: true });
    }
  }, [searchParams, navigate, refreshSubscription]);

  // Resolve i18n labels for feature definitions
  const features: PricingFeature[] = useMemo(
    () =>
      FEATURE_DEFINITIONS.map((f) => ({
        ...f,
        label: t(`components.pricing.comparison.${f.id}`),
      })),
    [t],
  );

  const currentPlanSortOrder = currentPlan?.sort_order;
  const popularPlanId = 'price_pro_monthly_v2';

  // Map DB plans -> PricingPlan[]
  const pricingPlans: PricingPlan[] = useMemo(
    () =>
      plans.map((plan) =>
        mapToPricingPlan(plan, t, {
          isCurrentPlan: subscription?.plan_id === plan.id,
          isPopular: plan.id === popularPlanId,
          currentPlanSortOrder,
        }),
      ),
    [plans, subscription?.plan_id, currentPlanSortOrder, t],
  );

  // Wire onSelectPlan to existing Stripe checkout, forwarding billing cycle
  const handleSelectPlan = useCallback(
    (planId: string, cycle: BillingCycle) => {
      // Find the original plan to check if it's free or current
      const plan = plans.find((p) => p.id === planId);
      if (!plan) return;
      const isFree = plan.price_monthly === 0;
      const isCurrent = subscription?.plan_id === planId;
      if (isFree || isCurrent) return;

      trackEvent('checkout_started', { planId, billingCycle: cycle });
      checkout(planId, cycle);
    },
    [plans, subscription?.plan_id, checkout],
  );

  // Error state — plans failed to load
  if (!isLoading && plans.length === 0) {
    return (
      <GenericErrorState
        title={t('pricing.loadError', { defaultValue: 'Não foi possível carregar os planos. Tente novamente.' })}
        description={t('errors.tryReloadPage')}
        action={{ label: t('common.tryAgain', { defaultValue: 'Tentar novamente' }), onClick: () => window.location.reload() }}
      />
    );
  }

  return (
    <>
      <PricingPage
        className="max-w-6xl mx-auto py-6 sm:py-8"
        title={t('pricing.title')}
        description={t('components.pricing.section.subtitle')}
        plans={pricingPlans}
        features={features}
        onSelectPlan={handleSelectPlan}
        defaultCycle="monthly"
        currency="R$"
        discountLabel="-16%"
        loading={isLoading || isCheckingOut}
      />

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md text-center" aria-labelledby="pricing-success-title">
          <DialogHeader className="items-center">
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 dark:bg-success/20">
              <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
            </div>
            <DialogTitle id="pricing-success-title" className="text-xl font-display">
              {t('pricing.subscriptionActivated')}
            </DialogTitle>
            <DialogDescription>
              {t('pricing.subscriptionActivatedDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              onClick={() => {
                setShowSuccess(false);
                navigate('/dashboard');
              }}
            >
              {t('pricing.goToDashboard')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
