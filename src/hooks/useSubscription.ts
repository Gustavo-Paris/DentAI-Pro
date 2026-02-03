import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number | null;
  currency: string;
  cases_per_month: number;
  dsd_simulations_per_month: number;
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
  plan?: SubscriptionPlan;
}

/**
 * Hook for managing user subscriptions
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
      console.error('Checkout error:', error);
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
      console.error('Portal error:', error);
      toast.error('Erro ao acessar portal. Tente novamente.');
    },
  });

  // Computed values
  const subscription = subscriptionQuery.data;
  const plans = plansQuery.data || [];

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const isPro = isActive && subscription?.plan_id?.includes('pro');
  const isClinic = isActive && subscription?.plan_id?.includes('clinic');
  const isFree = !isActive || subscription?.plan_id === 'free';

  const currentPlan = subscription?.plan || plans.find(p => p.id === 'free');

  // Usage limits
  const casesLimit = currentPlan?.cases_per_month || 5;
  const casesUsed = subscription?.cases_used_this_month || 0;
  const casesRemaining = casesLimit === -1 ? Infinity : Math.max(0, casesLimit - casesUsed);
  const canCreateCase = casesLimit === -1 || casesUsed < casesLimit;

  const dsdLimit = currentPlan?.dsd_simulations_per_month || 3;
  const dsdUsed = subscription?.dsd_used_this_month || 0;
  const dsdRemaining = dsdLimit === -1 ? Infinity : Math.max(0, dsdLimit - dsdUsed);

  // Refetch subscription after checkout
  const refreshSubscription = () => {
    queryClient.invalidateQueries({ queryKey: ['subscription'] });
  };

  return {
    // Data
    subscription,
    plans,
    currentPlan,

    // Status
    isLoading: subscriptionQuery.isLoading || plansQuery.isLoading,
    isActive,
    isPro,
    isClinic,
    isFree,

    // Usage
    casesLimit,
    casesUsed,
    casesRemaining,
    canCreateCase,
    dsdLimit,
    dsdUsed,
    dsdRemaining,

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
