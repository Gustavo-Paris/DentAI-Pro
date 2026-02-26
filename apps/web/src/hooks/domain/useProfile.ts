import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/data';
import { profiles, payments, subscriptions, privacy, storage, evaluations, email } from '@/data';
import type { ProfileFull } from '@/data/profiles';
import type { DataExport, DeleteAccountResult } from '@/data/privacy';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
import { QUERY_STALE_TIMES } from '@/lib/constants';
import { useSubscription } from '@/hooks/useSubscription';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProfileState {
  profile: ProfileFull;
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  avatarPreview: string | null;
  logoPreview: string | null;
  isUploading: boolean;
  isUploadingLogo: boolean;
  paymentRecords: PaymentRecord[] | undefined;
  isLoadingPayments: boolean;
  sendingDigest: boolean;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  invoice_url: string | null;
  invoice_pdf: string | null;
  created_at: string;
}

export interface ProfileActions {
  updateField: <K extends keyof ProfileFull>(field: K, value: ProfileFull[K]) => void;
  handleSave: () => Promise<void>;
  handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  logoInputRef: React.RefObject<HTMLInputElement>;
  syncCreditPurchase: () => Promise<{ synced: boolean; credits_added: number; sessions_processed: number }>;
  exportData: () => Promise<DataExport>;
  deleteAccount: (confirmation: string) => Promise<DeleteAccountResult>;
  sendWeeklyDigest: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const profileKeys = {
  all: ['profile'] as const,
  detail: (userId: string) => [...profileKeys.all, userId] as const,
  payments: (userId: string) => ['payment-history', userId] as const,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useProfile(): ProfileState & ProfileActions {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { refreshSubscription } = useSubscription();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [profileForm, setProfileForm] = useState<ProfileFull>({
    full_name: '',
    cro: '',
    clinic_name: '',
    phone: '',
    avatar_url: null,
    clinic_logo_url: null,
  });
  const initialProfileRef = useRef<ProfileFull | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(false);

  // ---- Queries ----
  const { data: profileData, isLoading: loadingProfile } = useQuery({
    queryKey: profileKeys.detail(user?.id || ''),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      return profiles.getFullByUserId(user.id);
    },
    enabled: !!user,
    staleTime: QUERY_STALE_TIMES.MEDIUM,
  });

  const { data: paymentRecords, isLoading: isLoadingPayments } = useQuery({
    queryKey: profileKeys.payments(user?.id || ''),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      return payments.listByUserId(user.id);
    },
    enabled: !!user,
    staleTime: QUERY_STALE_TIMES.MEDIUM,
  });

  // Sync profile data to local form state
  useEffect(() => {
    if (profileData) {
      setProfileForm(profileData);
      initialProfileRef.current = profileData;
      if (profileData.avatar_url) {
        setAvatarPreview(profiles.getAvatarPublicUrl(profileData.avatar_url));
      }
      if (profileData.clinic_logo_url) {
        setLogoPreview(profiles.getAvatarPublicUrl(profileData.clinic_logo_url));
      }
    }
  }, [profileData]);

  // Derive dirty state by comparing current form vs initial snapshot
  const isDirty = useMemo(() => {
    const initial = initialProfileRef.current;
    if (!initial) return false;
    return (
      (profileForm.full_name ?? '') !== (initial.full_name ?? '') ||
      (profileForm.cro ?? '') !== (initial.cro ?? '') ||
      (profileForm.clinic_name ?? '') !== (initial.clinic_name ?? '') ||
      (profileForm.phone ?? '') !== (initial.phone ?? '') ||
      profileForm.avatar_url !== initial.avatar_url ||
      profileForm.clinic_logo_url !== initial.clinic_logo_url
    );
  }, [profileForm]);

  // ---- Handle Stripe redirect ----
  const hasRunStripeRedirectRef = useRef(false);
  useEffect(() => {
    const status = searchParams.get('subscription');
    if (status === 'success' && !hasRunStripeRedirectRef.current) {
      hasRunStripeRedirectRef.current = true;
      toast.success(t('toasts.profile.subscriptionActivated'));
      const syncWithRetry = async (attempts = 3, delay = 2000) => {
        for (let i = 0; i < attempts; i++) {
          try {
            const { data } = await supabase.functions.invoke('sync-subscription', { body: {} });
            if (data?.synced) {
              refreshSubscription();
              return;
            }
          } catch (e) {
            logger.error(`Sync attempt ${i + 1} failed:`, e);
          }
          if (i < attempts - 1) await new Promise(r => setTimeout(r, delay));
        }
        logger.warn('Stripe subscription sync failed after all retries');
        refreshSubscription();
      };
      syncWithRetry();
      navigate('/profile', { replace: true });
    } else if (status === 'canceled' && !hasRunStripeRedirectRef.current) {
      hasRunStripeRedirectRef.current = true;
      toast.info(t('toasts.profile.checkoutCanceled'));
      navigate('/profile', { replace: true });
    }
  }, [searchParams, navigate, refreshSubscription]);

  // ---- Mutation ----
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      await profiles.updateProfile(user.id, {
        full_name: profileForm.full_name,
        cro: profileForm.cro,
        clinic_name: profileForm.clinic_name,
        phone: profileForm.phone,
        avatar_url: profileForm.avatar_url,
        clinic_logo_url: profileForm.clinic_logo_url,
      });
    },
    onSuccess: () => {
      initialProfileRef.current = { ...profileForm };
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(user?.id || '') });
      toast.success(t('toasts.profile.profileUpdated'));
      navigate('/dashboard');
    },
    onError: (error) => {
      logger.error('Error saving profile:', error);
      toast.error(t('toasts.profile.saveError'));
    },
  });

  // ---- Actions ----
  const updateField = useCallback(<K extends keyof ProfileFull>(field: K, value: ProfileFull[K]) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    await saveMutation.mutateAsync();
  }, [saveMutation]);

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('toasts.profile.selectImage'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('toasts.profile.avatarMaxSize'));
      return;
    }

    setIsUploading(true);
    try {
      const filePath = await storage.uploadAvatar(
        user.id, file, 'avatar', profileForm.avatar_url || undefined,
      );
      const publicUrl = storage.getAvatarPublicUrl(filePath);
      setAvatarPreview(publicUrl + '?t=' + Date.now());
      setProfileForm(prev => ({ ...prev, avatar_url: filePath }));
      toast.success(t('toasts.profile.avatarUpdated'));
    } catch (error) {
      logger.error('Error uploading avatar:', error);
      toast.error(t('toasts.profile.avatarError'));
    } finally {
      setIsUploading(false);
    }
  }, [user, profileForm.avatar_url, t]);

  const syncCreditPurchase = useCallback(async () => {
    return subscriptions.syncCreditPurchase();
  }, []);

  const exportData = useCallback(async () => {
    return privacy.exportData();
  }, []);

  const deleteAccount = useCallback(async (confirmation: string) => {
    return privacy.deleteAccount(confirmation);
  }, []);

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('toasts.profile.selectImage'));
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      toast.error(t('toasts.profile.logoMaxSize'));
      return;
    }

    setIsUploadingLogo(true);
    try {
      const filePath = await storage.uploadAvatar(
        user.id, file, 'clinic-logo', profileForm.clinic_logo_url || undefined,
      );
      const publicUrl = storage.getAvatarPublicUrl(filePath);
      setLogoPreview(publicUrl + '?t=' + Date.now());
      setProfileForm(prev => ({ ...prev, clinic_logo_url: filePath }));
      toast.success(t('toasts.profile.logoUpdated'));
    } catch (error) {
      logger.error('Error uploading logo:', error);
      toast.error(t('toasts.profile.logoError'));
    } finally {
      setIsUploadingLogo(false);
    }
  }, [user, profileForm.clinic_logo_url, t]);

  const sendWeeklyDigest = useCallback(async () => {
    if (!user) return;
    setSendingDigest(true);
    try {
      const [metrics, totalCases] = await Promise.all([
        evaluations.getDashboardMetrics({ userId: user.id }),
        evaluations.countByUserId(user.id),
      ]);
      await email.sendEmail('weekly-digest', {
        casesThisWeek: metrics.weeklySessionCount,
        totalCases,
        pendingTeeth: metrics.pendingTeethCount,
      });
      toast.success(t('profile.digestSent', { defaultValue: 'Resumo semanal enviado!' }));
    } catch (error) {
      logger.error('Failed to send weekly digest email:', error);
      toast.error(t('profile.digestError', { defaultValue: 'Erro ao enviar resumo' }));
    } finally {
      setSendingDigest(false);
    }
  }, [user, t]);

  return {
    profile: profileForm,
    isLoading: loadingProfile,
    isSaving: saveMutation.isPending,
    isDirty,
    avatarPreview,
    logoPreview,
    isUploading,
    isUploadingLogo,
    paymentRecords: paymentRecords as PaymentRecord[] | undefined,
    isLoadingPayments,
    updateField,
    handleSave,
    handleAvatarUpload,
    handleLogoUpload,
    fileInputRef,
    logoInputRef,
    syncCreditPurchase,
    exportData,
    deleteAccount,
    sendWeeklyDigest,
    sendingDigest,
  };
}
