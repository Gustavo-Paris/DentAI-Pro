import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { syncSubscription } from '@/data/subscriptions';
import type { SubscriptionPlan } from '@/data/subscriptions';
import { logger } from '@/lib/logger';
import { trackEvent } from '@/lib/analytics';
import {
  PricingPage,
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
  const unlimited = t('components.pricing.comparison.unlimited');

  return [
    { featureId: 'creditsMonth', value: String(plan.credits_per_month) },
    {
      featureId: 'caseAnalyses',
      value:
        plan.cases_per_month === -1
          ? unlimited
          : String(plan.cases_per_month),
    },
    {
      featureId: 'dsdSimulations',
      value:
        plan.dsd_simulations_per_month === -1
          ? unlimited
          : String(plan.dsd_simulations_per_month),
    },
    { featureId: 'creditRollover', value: plan.allows_rollover },
    {
      featureId: 'maxRollover',
      value: plan.rollover_max
        ? String(plan.rollover_max)
        : plan.allows_rollover
          ? unlimited
          : false,
    },
    { featureId: 'users', value: String(plan.max_users) },
    { featureId: 'prioritySupport', value: plan.priority_support },
    { featureId: 'resinRecommendations', value: true },
    { featureId: 'cementationProtocols', value: plan.sort_order >= 1 },
    { featureId: 'pdfExport', value: plan.sort_order >= 1 },
    { featureId: 'dedicatedSupport', value: plan.sort_order >= 3 },
    { featureId: 'personalOnboarding', value: plan.sort_order >= 3 },
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
      monthly: plan.price_monthly,
      annual: plan.price_yearly ?? plan.price_monthly * 12,
    },
    cta,
    featured: opts.isPopular && !opts.isCurrentPlan,
    badge,
    features: buildFeatureValues(plan, t),
  };
}

// =============================================================================
// Page Adapter
// =============================================================================

export default function Pricing() {
  const { t } = useTranslation();
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

  // Wire onSelectPlan to existing Stripe checkout
  const handleSelectPlan = useCallback(
    (planId: string, _cycle: BillingCycle) => {
      // Find the original plan to check if it's free or current
      const plan = plans.find((p) => p.id === planId);
      if (!plan) return;
      const isFree = plan.price_monthly === 0;
      const isCurrent = subscription?.plan_id === planId;
      if (isFree || isCurrent) return;

      checkout(planId);
    },
    [plans, subscription?.plan_id, checkout],
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <PricingPage
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
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader className="items-center">
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 dark:bg-success/20">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <DialogTitle className="text-xl font-display">
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
    </div>
  );
}
