import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2, Save, Building2, ImageIcon, Sparkles, FileText, ArrowRight } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { SubscriptionStatus } from '@/components/pricing/SubscriptionStatus';
import { CreditUsageHistory } from '@/components/pricing/CreditUsageHistory';
import { CreditPackSection } from '@/components/pricing/CreditPackSection';
import { useSubscription, formatPrice } from '@/hooks/useSubscription';
import { DetailPage } from '@pageshell/composites';

import { useProfile } from '@/hooks/domain/useProfile';

// =============================================================================
// Page Adapter
// =============================================================================

export default function Profile() {
  const [searchParams] = useSearchParams();
  const p = useProfile();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
    <DetailPage
      title="Meu Perfil"
      query={{ data: p.profile, isLoading: p.isLoading }}
      tabs={[
        {
          id: 'perfil',
          label: 'Perfil',
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
                      <span className="text-xs text-muted-foreground mt-2">Foto Pessoal</span>
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
                      <span className="text-xs text-muted-foreground mt-2">Logo do Consultório</span>
                    </div>
                  </div>

                  <CardTitle className="font-display">Editar Perfil</CardTitle>
                  <CardDescription>Atualize suas informações pessoais e profissionais</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome completo</Label>
                    <Input
                      id="full_name"
                      value={p.profile.full_name || ''}
                      onChange={(e) => p.updateField('full_name', e.target.value)}
                      placeholder="Dr. João Silva"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cro">CRO</Label>
                    <Input
                      id="cro"
                      value={p.profile.cro || ''}
                      onChange={(e) => p.updateField('cro', e.target.value)}
                      placeholder="CRO-SP 12345"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clinic_name">Nome da Clínica</Label>
                    <Input
                      id="clinic_name"
                      value={p.profile.clinic_name || ''}
                      onChange={(e) => p.updateField('clinic_name', e.target.value)}
                      placeholder="Clínica Odontológica Sorriso"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={p.profile.phone || ''}
                      onChange={(e) => p.updateField('phone', e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div className="pt-4">
                    <Button onClick={p.handleSave} disabled={p.isSaving} className="w-full">
                      {p.isSaving ? (
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
            </div>
          ),
        },
        {
          id: 'assinatura',
          label: 'Assinatura',
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
          label: 'Faturas',
          content: () => (
            <PaymentHistorySection
              paymentRecords={p.paymentRecords}
              isLoading={p.isLoadingPayments}
            />
          ),
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
  const { isFree } = useSubscription();

  const statusLabel: Record<string, string> = {
    succeeded: 'Pago',
    failed: 'Falhou',
    pending: 'Pendente',
    refunded: 'Reembolsado',
  };

  const statusColor: Record<string, string> = {
    succeeded: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
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
          <h3 className="font-semibold font-display mb-2">Nenhuma fatura encontrada</h3>
          <p className="text-sm text-muted-foreground">
            {isFree
              ? 'Assine um plano para começar a receber faturas.'
              : 'Suas faturas aparecerão aqui após o primeiro pagamento.'}
          </p>
          {isFree && (
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to="/pricing">
                Ver Planos
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
        <CardTitle className="text-lg font-display">Histórico de pagamentos</CardTitle>
        <CardDescription>{paymentRecords.length} pagamento(s)</CardDescription>
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
