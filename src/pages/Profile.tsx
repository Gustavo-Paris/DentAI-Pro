import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Camera, Loader2, Save, Building2, ImageIcon, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { getInitials } from '@/lib/utils';
import { SubscriptionStatus } from '@/components/pricing/SubscriptionStatus';
import { useSubscription } from '@/hooks/useSubscription';
import { ThemeToggle } from '@/components/ThemeToggle';

interface ProfileData {
  full_name: string | null;
  cro: string | null;
  clinic_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  clinic_logo_url: string | null;
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshSubscription } = useSubscription();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    cro: '',
    clinic_name: '',
    phone: '',
    avatar_url: null,
    clinic_logo_url: null,
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, cro, clinic_name, phone, avatar_url, clinic_logo_url')
        .eq('user_id', user.id)
        .single();

      if (error) {
        logger.error('Error fetching profile:', error);
        toast.error('Erro ao carregar perfil');
      } else if (data) {
        setProfile(data);
        if (data.avatar_url) {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(data.avatar_url);
          setAvatarPreview(urlData.publicUrl);
        }
        if (data.clinic_logo_url) {
          const { data: logoUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(data.clinic_logo_url);
          setLogoPreview(logoUrlData.publicUrl);
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  // Handle redirect from Stripe checkout
  useEffect(() => {
    const status = searchParams.get('subscription');
    if (status === 'success') {
      toast.success('Assinatura ativada com sucesso!');
      // Sync subscription from Stripe with retry (bypasses webhook timing issues)
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

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoClick = () => {
    logoInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    setUploading(true);

    try {
      // Delete old avatar if exists
      if (profile.avatar_url) {
        await supabase.storage.from('avatars').remove([profile.avatar_url]);
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarPreview(urlData.publicUrl + '?t=' + Date.now());
      setProfile(prev => ({ ...prev, avatar_url: filePath }));
      toast.success('Foto atualizada!');
    } catch (error) {
      logger.error('Error uploading avatar:', error);
      toast.error('Erro ao enviar foto');
    } finally {
      setUploading(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    // Validate file size (max 1MB for logos)
    if (file.size > 1 * 1024 * 1024) {
      toast.error('A logo deve ter no máximo 1MB');
      return;
    }

    setUploadingLogo(true);

    try {
      // Delete old logo if exists
      if (profile.clinic_logo_url) {
        await supabase.storage.from('avatars').remove([profile.clinic_logo_url]);
      }

      // Upload new logo
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/clinic-logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setLogoPreview(urlData.publicUrl + '?t=' + Date.now());
      setProfile(prev => ({ ...prev, clinic_logo_url: filePath }));
      toast.success('Logo atualizada!');
    } catch (error) {
      logger.error('Error uploading logo:', error);
      toast.error('Erro ao enviar logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          cro: profile.cro,
          clinic_name: profile.clinic_name,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          clinic_logo_url: profile.clinic_logo_url,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      logger.error('Error saving profile:', error);
      toast.error('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="text-lg sm:text-xl font-semibold tracking-tight flex-1">Meu Perfil</span>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl space-y-6">
        <Card>
          <CardHeader className="text-center pb-2">
            {/* Avatar and Logo side by side */}
            <div className="flex justify-center items-start gap-8 mb-4">
              {/* Avatar Section */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Avatar className="w-20 h-20 cursor-pointer" onClick={handleAvatarClick}>
                    <AvatarImage src={avatarPreview || undefined} alt={profile.full_name || 'Avatar'} />
                    <AvatarFallback className="text-xl bg-primary/10">
                      {uploading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        getInitials(profile.full_name)
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <span className="text-xs text-muted-foreground mt-2">Foto Pessoal</span>
              </div>

              {/* Clinic Logo Section */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div 
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                    onClick={handleLogoClick}
                  >
                    {uploadingLogo ? (
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    ) : logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <Building2 className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleLogoClick}
                    disabled={uploadingLogo}
                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
                  >
                    <ImageIcon className="w-3 h-3" />
                  </button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </div>
                <span className="text-xs text-muted-foreground mt-2">Logo do Consultório</span>
              </div>
            </div>
            
            <CardTitle>Editar Perfil</CardTitle>
            <CardDescription>Atualize suas informações pessoais e profissionais</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome completo</Label>
              <Input
                id="full_name"
                value={profile.full_name || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Dr. João Silva"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cro">CRO</Label>
              <Input
                id="cro"
                value={profile.cro || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, cro: e.target.value }))}
                placeholder="CRO-SP 12345"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinic_name">Nome da Clínica</Label>
              <Input
                id="clinic_name"
                value={profile.clinic_name || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, clinic_name: e.target.value }))}
                placeholder="Clínica Odontológica Sorriso"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="pt-4">
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Section */}
        <SubscriptionStatus />

        {/* Upgrade CTA */}
        <UpgradeCTA />
      </main>
    </div>
  );
}

function UpgradeCTA() {
  const { isFree, isActive } = useSubscription();

  // Only show for free users
  if (!isFree || isActive) return null;

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Desbloqueie todo o potencial</p>
            <p className="text-sm text-muted-foreground">
              Mais casos, simulações ilimitadas e suporte prioritário
            </p>
          </div>
        </div>
        <Button asChild>
          <Link to="/pricing">Ver Planos</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
