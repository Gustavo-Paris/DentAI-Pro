import { supabase } from './client';
import { withQuery } from './utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  created_at: string;
  is_active: boolean;
}

export interface ReferralStats {
  totalReferrals: number;
  totalCreditsEarned: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateCode(displayName: string): string {
  const base = displayName
    .replace(/\s+/g, '')
    .toUpperCase()
    .slice(0, 8);
  const hex = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `${base}-${hex}`;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getReferralCode(userId: string): Promise<ReferralCode> {
  // Try to fetch existing code
  const existing = await withQuery(() =>
    supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle(),
  ) as ReferralCode | null;

  if (existing) return existing;

  // Fetch user display name to generate code
  const { data: userData } = await supabase.auth.getUser();
  const displayName =
    userData?.user?.user_metadata?.full_name ||
    userData?.user?.email?.split('@')[0] ||
    'USER';

  const code = generateCode(displayName);

  const created = await withQuery(() =>
    supabase
      .from('referral_codes')
      .insert({ user_id: userId, code })
      .select()
      .single(),
  ) as ReferralCode;

  return created;
}

export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const conversions = await withQuery(() =>
    supabase
      .from('referral_conversions')
      .select('id, reward_amount')
      .eq('referrer_id', userId),
  ) as Array<{ id: string; reward_amount: number | null }> | null;

  const rows = conversions || [];
  return {
    totalReferrals: rows.length,
    totalCreditsEarned: rows.reduce((sum, r) => sum + (r.reward_amount || 0), 0),
  };
}

