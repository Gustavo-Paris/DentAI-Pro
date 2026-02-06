import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { subscriptions, creditUsage } from '@/data';

export type { SubscriptionPlan, Subscription, CreditCost } from '@/data/subscriptions';
export type { CreditUsageRecord } from '@/data/credit-usage';

// Default credit costs (fallback if DB not available)
const DEFAULT_CREDIT_COSTS: Record<string, number> = {
  case_analysis: 1,
  dsd_simulation: 2,
};

/**
 * Hook for managing user subscriptions with credit-based pricing
 */
export function useSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch available plans
  const plansQuery = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptions.getPlans(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Fetch credit costs
  const creditCostsQuery = useQuery({
    queryKey: ['credit-costs'],
    queryFn: () => subscriptions.getCreditCosts(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Fetch user's subscription
  const subscriptionQuery = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      return subscriptions.getByUserId(user.id);
    },
    enabled: !!user,
  });

  // Create checkout session
  const checkoutMutation = useMutation({
    mutationFn: (priceId: string) => subscriptions.createCheckoutSession(priceId),
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      logger.error('Checkout error:', error);
      toast.error('Erro ao iniciar checkout. Tente novamente.');
    },
  });

  // Create portal session (manage subscription)
  const portalMutation = useMutation({
    mutationFn: () => subscriptions.createPortalSession(),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      logger.error('Portal error:', error);
      toast.error('Erro ao acessar portal. Tente novamente.');
    },
  });

  // Fetch recent credit usage history
  const creditUsageQuery = useQuery({
    queryKey: ['credit-usage', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return creditUsage.listByUserId(user.id, { limit: 20 });
    },
    enabled: !!user,
  });

  // Computed values
  const subscription = subscriptionQuery.data;
  const plans = plansQuery.data || [];
  const creditCosts = creditCostsQuery.data || [];

  // Build credit costs map
  const creditCostsMap: Record<string, number> = {};
  creditCosts.forEach(c => {
    creditCostsMap[c.operation] = c.credits;
  });

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const isFree = !isActive || subscription?.plan_id === 'starter' || !subscription?.plan_id;
  const isEssencial = isActive && subscription?.plan_id === 'price_essencial_monthly';
  const isPro = isActive && subscription?.plan_id === 'price_pro_monthly_v2';
  const isElite = isActive && subscription?.plan_id === 'price_elite_monthly';

  // Get current plan (default to starter/free)
  const currentPlan = subscription?.plan || plans.find(p => p.id === 'starter');

  // Credit calculations
  const creditsPerMonth = currentPlan?.credits_per_month || 5; // Free tier: 5 credits
  const creditsUsed = subscription?.credits_used_this_month || 0;
  const creditsRollover = subscription?.credits_rollover || 0;
  const creditsTotal = creditsPerMonth + creditsRollover;
  const creditsRemaining = Math.max(0, creditsTotal - creditsUsed);
  const creditsPercentUsed = creditsTotal > 0 ? (creditsUsed / creditsTotal) * 100 : 0;

  // Estimate days remaining based on average daily usage (last 30 days)
  const creditUsageHistory = creditUsageQuery.data || [];
  const isCreditUsageLoading = creditUsageQuery.isLoading;

  const estimatedDaysRemaining: number | null = (() => {
    if (creditUsageHistory.length === 0 || creditsRemaining <= 0) return null;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEntries = creditUsageHistory.filter(
      (entry) => new Date(entry.created_at) >= thirtyDaysAgo,
    );

    if (recentEntries.length === 0) return null;

    const totalUsed = recentEntries.reduce((sum, entry) => sum + entry.credits_used, 0);
    const avgPerDay = totalUsed / 30;

    if (avgPerDay <= 0) return null;
    return Math.floor(creditsRemaining / avgPerDay);
  })();

  // Get cost for an operation
  const getCreditCost = (operation: string): number => {
    return creditCostsMap[operation] || DEFAULT_CREDIT_COSTS[operation] || 1;
  };

  // Check if user can perform an operation
  const canUseCredits = (operation: string): boolean => {
    const cost = getCreditCost(operation);
    return creditsRemaining >= cost;
  };

  // Legacy usage tracking (for backwards compatibility)
  const casesLimit = currentPlan?.cases_per_month || 3;
  const casesUsed = subscription?.cases_used_this_month || 0;
  const casesRemaining = casesLimit === -1 ? Infinity : Math.max(0, casesLimit - casesUsed);
  const canCreateCase = canUseCredits('case_analysis');

  const dsdLimit = currentPlan?.dsd_simulations_per_month || 2;
  const dsdUsed = subscription?.dsd_used_this_month || 0;
  const dsdRemaining = dsdLimit === -1 ? Infinity : Math.max(0, dsdLimit - dsdUsed);
  const canCreateDsd = canUseCredits('dsd_simulation');

  // Refetch subscription after checkout
  const refreshSubscription = () => {
    queryClient.invalidateQueries({ queryKey: ['subscription'] });
  };

  return {
    // Data
    subscription,
    plans,
    currentPlan,
    creditCosts: creditCostsMap,

    // Status
    isLoading: subscriptionQuery.isLoading || plansQuery.isLoading,
    isActive,
    isFree,
    isEssencial,
    isPro,
    isElite,

    // Credits (new system)
    creditsPerMonth,
    creditsUsed,
    creditsRollover,
    creditsTotal,
    creditsRemaining,
    creditsPercentUsed,
    getCreditCost,
    canUseCredits,

    // Credit usage history
    creditUsageHistory,
    isCreditUsageLoading,
    estimatedDaysRemaining,

    // Legacy usage (backwards compatibility)
    casesLimit,
    casesUsed,
    casesRemaining,
    canCreateCase,
    dsdLimit,
    dsdUsed,
    dsdRemaining,
    canCreateDsd,

    // Actions
    checkout: checkoutMutation.mutate,
    isCheckingOut: checkoutMutation.isPending,

    openPortal: portalMutation.mutate,
    isOpeningPortal: portalMutation.isPending,

    refreshSubscription,
  };
}

/**
 * Format price for display
 */
export function formatPrice(cents: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

/**
 * Format credits with operation context
 */
export function formatCredits(credits: number, operation?: string): string {
  if (operation === 'case_analysis') {
    return `${credits} análise${credits !== 1 ? 's' : ''}`;
  }
  if (operation === 'dsd_simulation') {
    return `${Math.floor(credits / 2)} simulaç${Math.floor(credits / 2) !== 1 ? 'ões' : 'ão'} DSD`;
  }
  return `${credits} crédito${credits !== 1 ? 's' : ''}`;
}
