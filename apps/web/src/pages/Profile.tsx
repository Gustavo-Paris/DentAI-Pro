import { useEffect } from 'react';
import { useSearchParams, useNavigate, useBlocker } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@parisgroup-ai/pageshell/primitives';
import { Camera, Loader2, Save, Building2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { getInitials } from '@/lib/utils';
import { SubscriptionStatus } from '@/components/pricing/SubscriptionStatus';
import { CreditUsageHistory } from '@/components/pricing/CreditUsageHistory';
import { CreditPackSection } from '@/components/pricing/CreditPackSection';
import { PaymentHistorySection } from '@/components/pricing/PaymentHistorySection';
import { useSubscription } from '@/hooks/useSubscription';
import { DetailPage } from '@parisgroup-ai/pageshell/composites';
import { PageConfirmDialog } from '@parisgroup-ai/pageshell/interactions';
import { logger } from '@/lib/logger';

import { useProfile } from '@/hooks/domain/useProfile';
import { ReferralCard } from '@/components/referral/ReferralCard';
import { PrivacySection } from '@/components/profile/PrivacySection';
import { UpgradeCTA } from '@/components/profile/UpgradeCTA';

// =============================================================================
// Page Adapter
// =============================================================================

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const p = useProfile();
  const { refreshSubscription, isFree, isActive } = useSubscription();
  const blocker = useBlocker(p.isDirty);

  // Handle redirect from Stripe after credit pack purchase
  useEffect(() => {
    const credits = searchParams.get('credits');
    if (credits !== 'success') return;

    navigate('/profile?tab=assinatura', { replace: true });

    // Sync credits from Stripe with retry (bypasses webhook timing issues)
    const syncWithRetry = async (attempts = 3, delay = 2000) => {
      for (let i = 0; i < attempts; i++) {
        try {
          const result = await p.syncCreditPurchase();
          if (result?.synced) {
            toast.success(t('profile.creditsAdded', { count: result.credits_added }));
            refreshSubscription();
            return;
          }
        } catch (e) {
          logger.error(`Credit sync attempt ${i + 1} failed:`, e);
        }
        if (i < attempts - 1) await new Promise(r => setTimeout(r, delay));
      }
      // Final fallback: just refresh to pick up any webhook-applied credits
      refreshSubscription();
      toast.success(t('profile.creditsAddedGeneric'));
    };
    syncWithRetry();
  }, [searchParams, navigate, refreshSubscription, p.syncCreditPurchase, t]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
    <DetailPage
      title={t('profile.title')}
      query={{ data: p.profile, isLoading: p.isLoading }}
      tabs={[
        {
          id: 'perfil',
          label: t('profile.tab'),
          children: () => (
            <div className="space-y-6">
              <Card>
                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center items-start gap-8 mb-4">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <Avatar className="w-20 h-20 cursor-pointer" onClick={() => p.fileInputRef.current?.click()}>
                          <AvatarImage src={p.avatarPreview || undefined} alt={p.profile.full_name || 'Avatar'} />
                          <AvatarFallback className="text-xl bg-primary/10">
                            {p.isUploading ? (
                              <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                              getInitials(p.profile.full_name)
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <button
                          type="button"
                          onClick={() => p.fileInputRef.current?.click()}
                          disabled={p.isUploading}
                          className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
                          aria-label={t('profile.changeAvatar')}
                        >
                          <Camera className="w-3 h-3" />
                        </button>
                        <input
                          ref={p.fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={p.handleAvatarUpload}
                          className="hidden"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground mt-2">{t('profile.personalPhoto')}</span>
                    </div>

                    {/* Clinic Logo Section */}
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <div
                          className="w-20 h-20 rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                          role="button"
                          tabIndex={0}
                          aria-label={t('profile.uploadClinicLogo', { defaultValue: 'Enviar logo da clinica' })}
                          onClick={() => p.logoInputRef.current?.click()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              p.logoInputRef.current?.click();
                            }
                          }}
                        >
                          {p.isUploadingLogo ? (
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                          ) : p.logoPreview ? (
                            <img src={p.logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                          ) : (
                            <Building2 className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => p.logoInputRef.current?.click()}
                          disabled={p.isUploadingLogo}
                          className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
                          aria-label={t('profile.changeClinicLogo')}
                        >
                          <ImageIcon className="w-3 h-3" />
                        </button>
                        <input
                          ref={p.logoInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml"
                          onChange={p.handleLogoUpload}
                          className="hidden"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground mt-2">{t('profile.clinicLogo')}</span>
                    </div>
                  </div>

                  <CardTitle className="font-display">{t('profile.editProfile')}</CardTitle>
                  <CardDescription>{t('profile.editProfileDescription')}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">{t('profile.fullName')}</Label>
                    <Input
                      id="full_name"
                      value={p.profile.full_name || ''}
                      onChange={(e) => p.updateField('full_name', e.target.value)}
                      placeholder={t('auth.fullNamePlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cro">{t('profile.cro')}</Label>
                    <Input
                      id="cro"
                      value={p.profile.cro || ''}
                      onChange={(e) => p.updateField('cro', e.target.value)}
                      placeholder={t('auth.croPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clinic_name">{t('profile.clinicName')}</Label>
                    <Input
                      id="clinic_name"
                      value={p.profile.clinic_name || ''}
                      onChange={(e) => p.updateField('clinic_name', e.target.value)}
                      placeholder={t('profile.clinicNamePlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('patients.phone')}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={p.profile.phone || ''}
                      onChange={(e) => p.updateField('phone', e.target.value)}
                      placeholder={t('profile.phonePlaceholder')}
                    />
                  </div>

                  <div className="pt-4">
                    <Button onClick={p.handleSave} disabled={!p.isDirty || p.isSaving} className="w-full">
                      {p.isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t('common.saving')}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {t('profile.saveChanges')}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <ReferralCard />
            </div>
          ),
        },
        {
          id: 'assinatura',
          label: t('profile.subscriptionTab'),
          children: () => (
            <div className="space-y-6">
              <SubscriptionStatus />
              <CreditPackSection />
              <CreditUsageHistory />
              <UpgradeCTA isFree={isFree} isActive={isActive} />
            </div>
          ),
        },
        {
          id: 'faturas',
          label: t('profile.invoicesTab'),
          children: () => (
            <PaymentHistorySection
              paymentRecords={p.paymentRecords}
              isLoading={p.isLoadingPayments}
            />
          ),
        },
        {
          id: 'privacidade',
          label: t('profile.privacyTab'),
          children: () => <PrivacySection exportData={p.exportData} deleteAccount={p.deleteAccount} />,
        },
      ]}
      defaultTab={searchParams.get('tab') || 'perfil'}
    />

    <PageConfirmDialog
      open={blocker.state === 'blocked'}
      onOpenChange={(open) => { if (!open) blocker.reset?.(); }}
      title={t('profile.unsavedChangesTitle', { defaultValue: 'Alterações não salvas' })}
      description={t('profile.unsavedChangesDescription', { defaultValue: 'Você tem alterações não salvas. Deseja sair sem salvar?' })}
      onConfirm={() => blocker.proceed?.()}
      onCancel={() => blocker.reset?.()}
      confirmText={t('profile.discardChanges', { defaultValue: 'Sair sem salvar' })}
      cancelText={t('common.cancel', { defaultValue: 'Cancelar' })}
      variant="warning"
    />
    </div>
  );
}

