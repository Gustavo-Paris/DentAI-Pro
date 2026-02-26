import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@parisgroup-ai/pageshell/primitives';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@parisgroup-ai/pageshell/interactions';
import { Camera, Loader2, Save, Building2, ImageIcon, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { getInitials } from '@/lib/utils';
import { SubscriptionStatus } from '@/components/pricing/SubscriptionStatus';
import { CreditUsageHistory } from '@/components/pricing/CreditUsageHistory';
import { CreditPackSection } from '@/components/pricing/CreditPackSection';
import { PaymentHistorySection } from '@/components/pricing/PaymentHistorySection';
import { useSubscription } from '@/hooks/useSubscription';
import { DetailPage } from '@parisgroup-ai/pageshell/composites';
import { logger } from '@/lib/logger';
import { getProfileSchema, type ProfileFormData } from '@/lib/schemas/profile';

import { useProfile } from '@/hooks/domain/useProfile';
import { ReferralCard } from '@/components/referral/ReferralCard';
import { PrivacySection } from '@/components/profile/PrivacySection';
import { UpgradeCTA } from '@/components/profile/UpgradeCTA';

// =============================================================================
// Page Adapter
// =============================================================================

export default function Profile() {
  const { t } = useTranslation();
  useDocumentTitle(t('pageTitle.profile'));
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const p = useProfile();
  const { refreshSubscription, isFree, isActive } = useSubscription();

  // Profile form with Zod validation
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(getProfileSchema()),
    defaultValues: {
      full_name: '',
      cro: '',
      clinic_name: '',
      phone: '',
    },
    mode: 'onBlur',
  });

  // Sync profile data from server into react-hook-form when loaded
  useEffect(() => {
    if (p.isLoading) return;
    form.reset({
      full_name: p.profile.full_name || '',
      cro: p.profile.cro || '',
      clinic_name: p.profile.clinic_name || '',
      phone: p.profile.phone || '',
    });
  }, [p.isLoading, p.profile.full_name, p.profile.cro, p.profile.clinic_name, p.profile.phone]); // eslint-disable-line react-hooks/exhaustive-deps

  // Bridge form changes back to useProfile's state so isDirty/handleSave work
  const handleFieldChange = (field: keyof ProfileFormData, value: string) => {
    p.updateField(field, value);
  };

  // Validate with Zod, then delegate to useProfile's save
  const onSubmit = async () => {
    await p.handleSave();
  };

  // Warn on tab close when there are unsaved changes
  useEffect(() => {
    if (!p.isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [p.isDirty]);

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
    <div className="relative section-glow-bg overflow-hidden">
      {/* Ambient AI grid overlay */}
      <div className="ai-grid-pattern absolute inset-0 opacity-30 dark:opacity-50 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_70%,transparent_100%)] pointer-events-none" aria-hidden="true" />
    <DetailPage
      className="relative z-10 max-w-5xl mx-auto py-6 sm:py-8"
      title={t('profile.title')}
      query={{ data: p.isLoading ? undefined : p.profile, isLoading: p.isLoading }}
      tabs={[
        {
          id: 'perfil',
          label: t('profile.tab'),
          children: () => (
            <div className="space-y-6">
              <Card className="rounded-xl">
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
                        <button
                          type="button"
                          className="w-20 h-20 rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                          aria-label={t('profile.uploadClinicLogo')}
                          onClick={() => p.logoInputRef.current?.click()}
                        >
                          {p.isUploadingLogo ? (
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                          ) : p.logoPreview ? (
                            <img src={p.logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                          ) : (
                            <Building2 className="w-8 h-8 text-muted-foreground" />
                          )}
                        </button>
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

                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="full_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('profile.fullName')}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t('auth.fullNamePlaceholder')}
                                aria-required="true"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleFieldChange('full_name', e.target.value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cro"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('profile.cro')}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t('auth.croPlaceholder')}
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleFieldChange('cro', e.target.value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="clinic_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('profile.clinicName')}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t('profile.clinicNamePlaceholder')}
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleFieldChange('clinic_name', e.target.value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('patients.phone')}</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder={t('profile.phonePlaceholder')}
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleFieldChange('phone', e.target.value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="pt-4">
                        <Button type="submit" disabled={!p.isDirty || p.isSaving} className="w-full">
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
                    </form>
                  </Form>
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
          children: () => (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-display">{t('profile.weeklyDigest')}</CardTitle>
                  <CardDescription>{t('profile.weeklyDigestDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={p.sendWeeklyDigest}
                    disabled={p.sendingDigest}
                    className="gap-1.5"
                  >
                    {p.sendingDigest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    {t('profile.sendDigest')}
                  </Button>
                </CardContent>
              </Card>
              <PrivacySection exportData={p.exportData} deleteAccount={p.deleteAccount} />
            </div>
          ),
        },
      ]}
      defaultTab={searchParams.get('tab') || 'perfil'}
    />
    </div>
  );
}

