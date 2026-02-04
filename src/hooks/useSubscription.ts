import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number | null;
  currency: string;
  cases_per_month: number;
  dsd_simulations_per_month: number;
  credits_per_month: number;
  max_users: number;
  allows_rollover: boolean;
  rollover_max: number | null;
  priority_support: boolean;
  features: string[];
  sort_order: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_id: string | null;
  status: 'active' | 'inactive' | 'past_due' | 'canceled' | 'trialing' | 'unpaid';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  cases_used_this_month: number;
  dsd_used_this_month: number;
  credits_used_this_month: number;
  credits_rollover: number;
  plan?: SubscriptionPlan;
}

export interface CreditCost {
  operation: string;
  credits: number;
  description: string;
}

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
    queryFn: async (): Promise<SubscriptionPlan[]> => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Fetch credit costs
  const creditCostsQuery = useQuery({
    queryKey: ['credit-costs'],
    queryFn: async (): Promise<CreditCost[]> => {
      const { data, error } = await supabase
        .from('credit_costs')
        .select('*');

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Fetch user's subscription
  const subscriptionQuery = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async (): Promise<Subscription | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Create checkout session
  const checkoutMutation = useMutation({
    mutationFn: async (priceId: string): Promise<{ url: string }> => {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId },
      });

      if (error) throw error;
      return data;
    },
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
    mutationFn: async (): Promise<{ url: string }> => {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {},
      });

      if (error) throw error;
      return data;
    },
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
