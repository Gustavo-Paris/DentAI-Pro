import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/data';
import { profiles, payments } from '@/data';
import type { ProfileFull } from '@/data/profiles';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useSubscription } from '@/hooks/useSubscription';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProfileState {
  profile: ProfileFull;
  isLoading: boolean;
  isSaving: boolean;
  avatarPreview: string | null;
  logoPreview: string | null;
  isUploading: boolean;
  isUploadingLogo: boolean;
  paymentRecords: PaymentRecord[] | undefined;
  isLoadingPayments: boolean;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  invoice_pdf: string | null;
}

export interface ProfileActions {
  updateField: <K extends keyof ProfileFull>(field: K, value: ProfileFull[K]) => void;
  handleSave: () => Promise<void>;
  handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  logoInputRef: React.RefObject<HTMLInputElement | null>;
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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // ---- Queries ----
  const { data: profileData, isLoading: loadingProfile } = useQuery({
    queryKey: profileKeys.detail(user?.id || ''),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      return profiles.getFullByUserId(user.id);
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  const { data: paymentRecords, isLoading: isLoadingPayments } = useQuery({
    queryKey: profileKeys.payments(user?.id || ''),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      return payments.listByUserId(user.id);
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  // Sync profile data to local form state
  useEffect(() => {
    if (profileData) {
      setProfileForm(profileData);
      if (profileData.avatar_url) {
        setAvatarPreview(profiles.getAvatarPublicUrl(profileData.avatar_url));
      }
      if (profileData.clinic_logo_url) {
        setLogoPreview(profiles.getAvatarPublicUrl(profileData.clinic_logo_url));
      }
    }
  }, [profileData]);

  // ---- Handle Stripe redirect ----
  useEffect(() => {
    const status = searchParams.get('subscription');
    if (status === 'success') {
      toast.success('Assinatura ativada com sucesso!');
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
        refreshSubscription();
      };
      syncWithRetry();
      navigate('/profile', { replace: true });
    } else if (status === 'canceled') {
      toast.info('Checkout cancelado');
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
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(user?.id || '') });
      toast.success('Perfil atualizado com sucesso!');
      navigate('/dashboard');
    },
    onError: (error) => {
      logger.error('Error saving profile:', error);
      toast.error('Erro ao salvar perfil');
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
      toast.error('Por favor, selecione uma imagem');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    setIsUploading(true);
    try {
      if (profileForm.avatar_url) {
        await supabase.storage.from('avatars').remove([profileForm.avatar_url]);
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarPreview(urlData.publicUrl + '?t=' + Date.now());
      setProfileForm(prev => ({ ...prev, avatar_url: filePath }));
      toast.success('Foto atualizada!');
    } catch (error) {
      logger.error('Error uploading avatar:', error);
      toast.error('Erro ao enviar foto');
    } finally {
      setIsUploading(false);
    }
  }, [user, profileForm.avatar_url]);

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      toast.error('A logo deve ter no máximo 1MB');
      return;
    }

    setIsUploadingLogo(true);
    try {
      if (profileForm.clinic_logo_url) {
        await supabase.storage.from('avatars').remove([profileForm.clinic_logo_url]);
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/clinic-logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setLogoPreview(urlData.publicUrl + '?t=' + Date.now());
      setProfileForm(prev => ({ ...prev, clinic_logo_url: filePath }));
      toast.success('Logo atualizada!');
    } catch (error) {
      logger.error('Error uploading logo:', error);
      toast.error('Erro ao enviar logo');
    } finally {
      setIsUploadingLogo(false);
    }
  }, [user, profileForm.clinic_logo_url]);

  return {
    profile: profileForm,
    isLoading: loadingProfile,
    isSaving: saveMutation.isPending,
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
  };
}
