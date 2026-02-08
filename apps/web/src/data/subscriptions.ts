import { supabase } from './client';

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
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  return (data as SubscriptionPlan[]) || [];
}

export async function getCreditCosts() {
  const { data, error } = await supabase
    .from('credit_costs')
    .select('*');

  if (error) throw error;
  return (data as CreditCost[]) || [];
}

export async function getByUserId(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as Subscription | null;
}

// ---------------------------------------------------------------------------
// Edge functions (Stripe)
// ---------------------------------------------------------------------------

export async function createCheckoutSession(priceId: string) {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { priceId },
  });

  if (error) throw error;
  return data as { sessionId?: string; url?: string; updated?: boolean };
}

export async function createPortalSession() {
  const { data, error } = await supabase.functions.invoke('create-portal-session', {
    body: {},
  });

  if (error) throw error;
  return data as { url: string };
}

export async function getCreditPacks() {
  const { data, error } = await supabase
    .from('credit_packs')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  return (data as CreditPack[]) || [];
}

export async function purchaseCreditPack(packId: string) {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { packId },
  });

  if (error) throw error;
  return data as { url: string };
}

export async function syncCreditPurchase() {
  const { data, error } = await supabase.functions.invoke('sync-credit-purchase', {
    body: {},
  });

  if (error) throw error;
  return data as { synced: boolean; credits_added: number; sessions_processed: number };
}
