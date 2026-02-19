import { supabase } from './client';
import { withQuery } from './utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  credits_bonus: number;
  plan?: SubscriptionPlan;
}

export interface CreditCost {
  operation: string;
  credits: number;
  description: string;
}

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: number;
  is_active: boolean;
  sort_order: number;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getPlans() {
  const data = await withQuery(() =>
    supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order'),
  );
  return (data as SubscriptionPlan[]) || [];
}

export async function getCreditCosts() {
  const data = await withQuery(() =>
    supabase
      .from('credit_costs')
      .select('*'),
  );
  return (data as CreditCost[]) || [];
}

export async function getByUserId(userId: string) {
  return withQuery(() =>
    supabase
      .from('subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', userId)
      .maybeSingle(),
  ) as Promise<Subscription | null>;
}

// ---------------------------------------------------------------------------
// Edge functions (Stripe)
// ---------------------------------------------------------------------------

export async function createCheckoutSession(priceId: string, billingCycle?: 'monthly' | 'annual') {
  const data = await withQuery(() =>
    supabase.functions.invoke('create-checkout-session', {
      body: { priceId, billingCycle },
    }),
  );
  return data as { sessionId?: string; url?: string; updated?: boolean };
}

export async function createPortalSession() {
  const data = await withQuery(() =>
    supabase.functions.invoke('create-portal-session', {
      body: {},
    }),
  );
  return data as { url: string };
}

export async function getCreditPacks() {
  const data = await withQuery(() =>
    supabase
      .from('credit_packs')
      .select('*')
      .eq('is_active', true)
      .order('sort_order'),
  );
  return (data as CreditPack[]) || [];
}

export async function purchaseCreditPack(packId: string, paymentMethod?: 'card' | 'pix') {
  const data = await withQuery(() =>
    supabase.functions.invoke('create-checkout-session', {
      body: { packId, ...(paymentMethod ? { payment_method: paymentMethod } : {}) },
    }),
  );
  return data as { url: string };
}

export async function syncSubscription() {
  const data = await withQuery(() =>
    supabase.functions.invoke('sync-subscription', {
      body: {},
    }),
  );
  return data as { synced?: boolean };
}

export async function syncCreditPurchase() {
  const data = await withQuery(() =>
    supabase.functions.invoke('sync-credit-purchase', {
      body: {},
    }),
  );
  return data as { synced: boolean; credits_added: number; sessions_processed: number };
}
