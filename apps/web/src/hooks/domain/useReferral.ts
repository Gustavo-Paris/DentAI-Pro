import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { referral } from '@/data';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { QUERY_STALE_TIMES } from '@/lib/constants';
import { referralKeys } from '@/lib/query-keys';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReferralState {
  code: string | null;
  stats: referral.ReferralStats;
  isLoading: boolean;
  shareUrl: string;
  copyToClipboard: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useReferral(): ReferralState {
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data: codeData, isLoading: loadingCode } = useQuery({
    queryKey: referralKeys.code(user?.id || ''),
    queryFn: () => referral.getReferralCode(user!.id),
    enabled: !!user,
    staleTime: QUERY_STALE_TIMES.LONG,
  });

  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: referralKeys.stats(user?.id || ''),
    queryFn: () => referral.getReferralStats(user!.id),
    enabled: !!user,
    staleTime: QUERY_STALE_TIMES.MEDIUM,
  });

  const code = codeData?.code || null;

  const shareUrl = code
    ? `${window.location.origin}/register?ref=${code}`
    : '';

  const copyToClipboard = useCallback(() => {
    if (!code) return;
    navigator.clipboard.writeText(shareUrl);
    toast.success(t('referral.copied'));
  }, [code, shareUrl, t]);

  return {
    code,
    stats: statsData || { totalReferrals: 0, totalCreditsEarned: 0 },
    isLoading: loadingCode || loadingStats,
    shareUrl,
    copyToClipboard,
  };
}
