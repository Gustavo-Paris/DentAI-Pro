import { supabase } from './client';
import { withQuery } from './utils';
import { logger } from '@/lib/logger';
import { BONUS_CREDITS } from '@/lib/constants';

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

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function applyReferralCode(
  code: string,
  newUserId: string,
): Promise<void> {
  // Find the referral code
  const referralCode = await withQuery(() =>
    supabase
      .from('referral_codes')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .maybeSingle(),
  ) as ReferralCode | null;

  if (!referralCode) return;

  // Don't allow self-referral
  if (referralCode.user_id === newUserId) return;

  // Check for duplicate conversion
  const { data: existingConversion } = await supabase
    .from('referral_conversions')
    .select('id')
    .eq('referred_id', newUserId)
    .maybeSingle();

  if (existingConversion) return;

  // Create conversion record
  const { error: conversionError } = await supabase
    .from('referral_conversions')
    .insert({
      referrer_id: referralCode.user_id,
      referred_id: newUserId,
      referral_code_id: referralCode.id,
      reward_granted: true,
      reward_type: 'credits',
      reward_amount: BONUS_CREDITS,
    });

  if (conversionError) throw conversionError;

  // Grant bonus credits to referrer
  const { error: referrerError } = await supabase.rpc('add_bonus_credits', {
    p_user_id: referralCode.user_id,
    p_credits: BONUS_CREDITS,
  });

  if (referrerError) {
    logger.error('Failed to increment referrer bonus credits via RPC:', referrerError);
    throw referrerError;
  }

  // Grant bonus credits to referred user
  const { error: referredError } = await supabase.rpc('add_bonus_credits', {
    p_user_id: newUserId,
    p_credits: BONUS_CREDITS,
  });

  if (referredError) {
    logger.error('Failed to increment referred user bonus credits via RPC:', referredError);
    throw referredError;
  }
}
