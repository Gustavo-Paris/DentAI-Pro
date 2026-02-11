import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Camera, Loader2, Save, Building2, ImageIcon, Sparkles, FileText, ArrowRight, Download, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getInitials } from '@/lib/utils';
import { SubscriptionStatus } from '@/components/pricing/SubscriptionStatus';
import { CreditUsageHistory } from '@/components/pricing/CreditUsageHistory';
import { CreditPackSection } from '@/components/pricing/CreditPackSection';
import { useSubscription, formatPrice } from '@/hooks/useSubscription';
import { DetailPage } from '@pageshell/composites';
import { subscriptions, privacy } from '@/data';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

import { useProfile } from '@/hooks/domain/useProfile';

// =============================================================================
// Page Adapter
// =============================================================================

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const p = useProfile();
  const { refreshSubscription } = useSubscription();

  // Handle redirect from Stripe after credit pack purchase
  useEffect(() => {
    const credits = searchParams.get('credits');
    if (credits !== 'success') return;

    navigate('/profile?tab=assinatura', { replace: true });

    // Sync credits from Stripe with retry (bypasses webhook timing issues)
    const syncWithRetry = async (attempts = 3, delay = 2000) => {
      for (let i = 0; i < attempts; i++) {
        try {
          const result = await subscriptions.syncCreditPurchase();
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
  }, [searchParams, navigate, refreshSubscription]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
    <DetailPage
      title={t('profile.title')}
      query={{ data: p.profile, isLoading: p.isLoading }}
      tabs={[
        {
          id: 'perfil',
          label: t('profile.tab'),
          content: () => (
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
                          onClick={() => p.logoInputRef.current?.click()}
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
                    <Button onClick={p.handleSave} disabled={p.isSaving} className="w-full">
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
            </div>
          ),
        },
        {
          id: 'assinatura',
          label: t('profile.subscriptionTab'),
          content: () => (
            <div className="space-y-6">
              <SubscriptionStatus />
              <CreditPackSection />
              <CreditUsageHistory />
              <UpgradeCTA />
            </div>
          ),
        },
        {
          id: 'faturas',
          label: t('profile.invoicesTab'),
          content: () => (
            <PaymentHistorySection
              paymentRecords={p.paymentRecords}
              isLoading={p.isLoadingPayments}
            />
          ),
        },
        {
          id: 'privacidade',
          label: t('profile.privacyTab'),
          content: () => <PrivacySection />,
        },
      ]}
      defaultTab={searchParams.get('tab') || 'perfil'}
    />
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function PaymentHistorySection({
  paymentRecords,
  isLoading,
}: {
  paymentRecords: Array<{ id: string; amount: number; currency: string; status: string; created_at: string; invoice_pdf: string | null }> | undefined;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const { isFree } = useSubscription();

  const statusLabel: Record<string, string> = {
    succeeded: t('profile.statusPaid'),
    failed: t('profile.statusFailed'),
    pending: t('profile.statusPending'),
    refunded: t('profile.statusRefunded'),
  };

  const statusColor: Record<string, string> = {
    succeeded: 'bg-success/10 text-success dark:bg-success/20 dark:text-success',
    failed: 'bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive',
    pending: 'bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning',
    refunded: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!paymentRecords || paymentRecords.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold font-display mb-2">{t('profile.noInvoices')}</h3>
          <p className="text-sm text-muted-foreground">
            {isFree
              ? t('profile.noInvoicesFree')
              : t('profile.noInvoicesPaid')}
          </p>
          {isFree && (
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to="/pricing">
                {t('common.viewPlans')}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-display">{t('profile.paymentHistory')}</CardTitle>
        <CardDescription>{t('profile.paymentCount', { count: paymentRecords.length })}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {paymentRecords.map((payment, index) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-3 rounded-xl border border-border shadow-sm animate-[fade-in-up_0.6s_ease-out_both]"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {formatPrice(payment.amount, payment.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(payment.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    statusColor[payment.status] || 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {statusLabel[payment.status] || payment.status}
                </span>
                {payment.invoice_pdf && (
                  <a
                    href={payment.invoice_pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline underline-offset-4"
                  >
                    PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function UpgradeCTA() {
  const { t } = useTranslation();
  const { isFree, isActive } = useSubscription();

  if (!isFree || isActive) return null;

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{t('profile.unlockPotential')}</p>
            <p className="text-sm text-muted-foreground">
              {t('profile.unlockPotentialDescription')}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link to="/pricing">{t('common.viewPlans')}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Privacy & Data Section (LGPD)
// =============================================================================

const CONFIRMATION_PHRASE = 'EXCLUIR MINHA CONTA';

function PrivacySection() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const handleExportData = useCallback(async () => {
    setIsExporting(true);
    try {
      const data = await privacy.exportData();

      // Trigger browser download
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auria-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(t('profile.exportSuccess'));
    } catch (error) {
      logger.error('Error exporting data:', error);
      toast.error(t('profile.exportError'));
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirmation !== CONFIRMATION_PHRASE) {
      toast.error(t('profile.deleteTypeExact', { phrase: CONFIRMATION_PHRASE }));
      return;
    }

    setIsDeleting(true);
    try {
      const result = await privacy.deleteAccount(deleteConfirmation);

      if (result.success) {
        toast.success(t('profile.deleteSuccess'));
        setShowDeleteDialog(false);
        // Sign out and redirect to home
        await signOut();
        navigate('/', { replace: true });
      } else {
        toast.error(result.message || t('profile.deleteError'));
      }
    } catch (error) {
      logger.error('Error deleting account:', error);
      toast.error(t('profile.deleteRetryError'));
    } finally {
      setIsDeleting(false);
    }
  }, [deleteConfirmation, signOut, navigate]);

  return (
    <div className="space-y-6">
      {/* LGPD Rights Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-display">{t('profile.lgpdTitle')}</CardTitle>
              <CardDescription>
                {t('profile.lgpdLaw')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              {t('profile.lgpdIntro')}
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>{t('profile.lgpdAccess')}</strong> {t('profile.lgpdAccessDesc')}</li>
              <li><strong>{t('profile.lgpdDeletion')}</strong> {t('profile.lgpdDeletionDesc')}</li>
              <li><strong>{t('profile.lgpdCorrection')}</strong> {t('profile.lgpdCorrectionDesc')}</li>
              <li><strong>{t('profile.lgpdInfo')}</strong> {t('profile.lgpdInfoDesc')}</li>
            </ul>
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs">
                <strong>{t('profile.lgpdRetention')}</strong> {t('profile.lgpdRetentionDesc')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">{t('profile.exportDataTitle')}</CardTitle>
          <CardDescription>
            {t('profile.exportDataDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t('profile.exportDataIncludes')}
          </p>
          <Button
            onClick={handleExportData}
            disabled={isExporting}
            variant="outline"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('profile.exporting')}
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                {t('profile.exportButton')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-destructive/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-lg font-display text-destructive">{t('profile.deleteAccountTitle')}</CardTitle>
              <CardDescription>
                {t('profile.deleteAccountDesc')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t('profile.deleteAccountWarning')}
          </p>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t('profile.deleteAccountButton')}
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={(open) => {
        setShowDeleteDialog(open);
        if (!open) setDeleteConfirmation('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">{t('profile.confirmDeleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('profile.confirmDeleteDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm font-medium text-destructive">
                {t('profile.deleteDataList')}
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc pl-5">
                <li>{t('profile.deleteDataProfile')}</li>
                <li>{t('profile.deleteDataPatients')}</li>
                <li>{t('profile.deleteDataPhotos')}</li>
                <li>{t('profile.deleteDataProtocols')}</li>
                <li>{t('profile.deleteDataCredits')}</li>
                <li>{t('profile.deleteDataSubscription')}</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-confirmation">
                Digite <strong className="text-destructive">{CONFIRMATION_PHRASE}</strong> para confirmar:
              </Label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={CONFIRMATION_PHRASE}
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmation('');
              }}
              disabled={isDeleting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirmation !== CONFIRMATION_PHRASE}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('profile.deleting')}
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('profile.deletePermanently')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
