import type {
  ProfileTabId,
  UserProfile,
  SubscriptionInfo,
  CreditPack,
  PaymentRecord,
  ReferralInfo,
} from '../../../../design/sections/profile/types'

/* ── Helpers ── */
function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getStatusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case 'active':
      return { label: 'Ativo', className: 'bg-success/10 text-success' }
    case 'trialing':
      return { label: 'Trial', className: 'bg-primary/10 text-primary' }
    case 'canceled':
      return { label: 'Cancelado', className: 'bg-destructive/10 text-destructive' }
    case 'inactive':
      return { label: 'Inativo', className: 'bg-muted text-muted-foreground' }
    case 'succeeded':
      return { label: 'Pago', className: 'bg-success/10 text-success' }
    case 'failed':
      return { label: 'Falhou', className: 'bg-destructive/10 text-destructive' }
    case 'pending':
      return { label: 'Pendente', className: 'bg-warning/10 text-warning' }
    case 'refunded':
      return { label: 'Reembolsado', className: 'bg-muted text-muted-foreground' }
    default:
      return { label: status, className: 'bg-muted text-muted-foreground' }
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

/* ── Tab config ── */
const TABS: { id: ProfileTabId; label: string }[] = [
  { id: 'perfil', label: 'Perfil' },
  { id: 'assinatura', label: 'Assinatura' },
  { id: 'faturas', label: 'Faturas' },
  { id: 'privacidade', label: 'Privacidade' },
]

/* ── Props ── */
export interface ProfileViewProps {
  activeTab: ProfileTabId
  profile: UserProfile
  subscription: SubscriptionInfo
  creditPacks: CreditPack[]
  payments: PaymentRecord[]
  referral: ReferralInfo
  onTabChange?: (tab: ProfileTabId) => void
  onSaveProfile?: (data: Partial<UserProfile>) => void
  onUploadAvatar?: () => void
  onUploadLogo?: () => void
  onBuyPack?: (packId: string) => void
  onManageSubscription?: () => void
  onDownloadInvoice?: (paymentId: string) => void
  onExportPayments?: () => void
  onExportData?: () => void
  onDeleteAccount?: () => void
  onShareReferral?: () => void
  onCopyReferralCode?: () => void
}

export function ProfileView({
  activeTab,
  profile,
  subscription,
  creditPacks,
  payments,
  referral,
  onTabChange,
  onSaveProfile,
  onUploadAvatar,
  onUploadLogo,
  onBuyPack,
  onManageSubscription,
  onDownloadInvoice,
  onExportPayments,
  onExportData,
  onDeleteAccount,
  onShareReferral,
  onCopyReferralCode,
}: ProfileViewProps) {
  return (
    <div className="section-glow-bg min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      {/* Ambient glow */}
      <div className="glow-orb glow-orb-slow absolute left-[5%] top-[8%] h-56 w-56 bg-primary/10" />
      <div className="glow-orb glow-orb-reverse absolute right-[8%] top-[35%] h-44 w-44 bg-accent/8" />

      <div className="relative z-10 mx-auto max-w-3xl space-y-6">
        {/* Page title */}
        <h1 className="text-heading text-2xl font-bold text-foreground sm:text-3xl">
          Configuracoes
        </h1>

        {/* Tab bar */}
        <div className="wizard-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange?.(tab.id)}
              className={`wizard-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="space-y-6">
          {activeTab === 'perfil' && (
            <PerfilTab
              profile={profile}
              referral={referral}
              onSave={onSaveProfile}
              onUploadAvatar={onUploadAvatar}
              onUploadLogo={onUploadLogo}
              onShareReferral={onShareReferral}
              onCopyReferralCode={onCopyReferralCode}
            />
          )}
          {activeTab === 'assinatura' && (
            <AssinaturaTab
              subscription={subscription}
              creditPacks={creditPacks}
              onManage={onManageSubscription}
              onBuyPack={onBuyPack}
            />
          )}
          {activeTab === 'faturas' && (
            <FaturasTab
              payments={payments}
              onDownload={onDownloadInvoice}
              onExport={onExportPayments}
            />
          )}
          {activeTab === 'privacidade' && (
            <PrivacidadeTab
              onExportData={onExportData}
              onDeleteAccount={onDeleteAccount}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Tab: Perfil
   ═══════════════════════════════════════════════ */
function PerfilTab({
  profile,
  referral,
  onSave,
  onUploadAvatar,
  onUploadLogo,
  onShareReferral,
  onCopyReferralCode,
}: {
  profile: UserProfile
  referral: ReferralInfo
  onSave?: (data: Partial<UserProfile>) => void
  onUploadAvatar?: () => void
  onUploadLogo?: () => void
  onShareReferral?: () => void
  onCopyReferralCode?: () => void
}) {
  return (
    <>
      {/* Avatar + logo */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-6">
          {/* Avatar */}
          <button
            type="button"
            onClick={() => onUploadAvatar?.()}
            className="group relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              getInitials(profile.full_name)
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-foreground/40 opacity-0 transition-opacity group-hover:opacity-100">
              <CameraIcon />
            </div>
          </button>

          {/* Clinic logo */}
          <button
            type="button"
            onClick={() => onUploadLogo?.()}
            className="group relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {profile.clinic_logo_url ? (
              <img
                src={profile.clinic_logo_url}
                alt="Logo"
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              <BuildingIcon />
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-foreground/40 opacity-0 transition-opacity group-hover:opacity-100">
              <CameraIcon />
            </div>
          </button>

          <div className="text-sm text-muted-foreground">
            <p>Clique para alterar a foto de perfil ou o logo da clinica.</p>
          </div>
        </div>
      </div>

      {/* Form fields */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nome completo" defaultValue={profile.full_name} />
          <FormField label="CRO" defaultValue={profile.cro ?? ''} placeholder="XX-00000" />
          <FormField label="Nome da clinica" defaultValue={profile.clinic_name ?? ''} />
          <FormField label="Telefone" defaultValue={profile.phone ?? ''} placeholder="(00) 00000-0000" />
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => onSave?.({})}
            className="btn-glow btn-press inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Salvar Alteracoes
          </button>
        </div>
      </div>

      {/* Referral card */}
      <div
        className="relative overflow-hidden rounded-2xl p-5 sm:p-6"
        style={{
          background:
            'linear-gradient(135deg, rgb(var(--color-primary-rgb) / 0.12) 0%, rgb(var(--accent-violet-rgb) / 0.12) 100%)',
        }}
      >
        <div className="relative z-10">
          <h3 className="text-heading text-base font-semibold text-foreground">
            Indique e ganhe
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Compartilhe seu codigo e ganhe creditos para cada indicacao.
          </p>

          {/* Code */}
          <div className="mt-4 flex items-center gap-3">
            <code className="rounded-lg bg-foreground/5 px-3 py-2 text-sm font-bold text-primary">
              {referral.code}
            </code>
            <button
              type="button"
              onClick={() => onCopyReferralCode?.()}
              className="btn-press rounded-lg bg-foreground/5 px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CopyIcon />
            </button>
          </div>

          {/* Stats */}
          <div className="mt-4 flex gap-6">
            <div>
              <p className="text-2xl font-bold text-foreground">
                {referral.total_referrals}
              </p>
              <p className="text-xs text-muted-foreground">Indicacoes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">
                {referral.credits_earned}
              </p>
              <p className="text-xs text-muted-foreground">Creditos ganhos</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onShareReferral?.()}
            className="btn-press mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ShareIcon />
            Compartilhar
          </button>
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════
   Tab: Assinatura
   ═══════════════════════════════════════════════ */
function AssinaturaTab({
  subscription,
  creditPacks,
  onManage,
  onBuyPack,
}: {
  subscription: SubscriptionInfo
  creditPacks: CreditPack[]
  onManage?: () => void
  onBuyPack?: (packId: string) => void
}) {
  const statusBadge = getStatusBadge(subscription.status)
  const creditsPercent =
    subscription.credits_total > 0
      ? (subscription.credits_used / subscription.credits_total) * 100
      : 0

  return (
    <>
      {/* Plan card */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-heading text-lg font-bold text-foreground">
                {subscription.plan_name}
              </h3>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadge.className}`}
              >
                {statusBadge.label}
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {formatPrice(subscription.price)}
              <span className="text-sm font-normal text-muted-foreground">
                /mes
              </span>
            </p>
            {subscription.next_billing_date && (
              <p className="mt-1 text-xs text-muted-foreground">
                Proxima cobranca: {formatDate(subscription.next_billing_date)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onManage?.()}
            className="btn-press glass-panel inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Gerenciar Plano
          </button>
        </div>
      </div>

      {/* Credits card */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6">
        <h3 className="text-heading text-base font-semibold text-foreground">
          Creditos
        </h3>
        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">
              {subscription.credits_used} de {subscription.credits_total} utilizados
            </span>
            <span className="text-xs text-muted-foreground">
              {Math.round(creditsPercent)}%
            </span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(creditsPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Breakdown */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-muted/50 p-3 text-center">
            <p className="text-lg font-bold text-foreground">
              {subscription.credits_total - subscription.credits_used}
            </p>
            <p className="text-[11px] text-muted-foreground">Restantes</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3 text-center">
            <p className="text-lg font-bold text-foreground">
              {subscription.credits_used}
            </p>
            <p className="text-[11px] text-muted-foreground">Utilizados</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3 text-center">
            <p className="text-lg font-bold text-primary">
              {subscription.rollover_credits}
            </p>
            <p className="text-[11px] text-muted-foreground">Acumulados</p>
          </div>
        </div>
      </div>

      {/* Credit packs */}
      <div className="space-y-3">
        <h3 className="text-heading text-base font-semibold text-foreground">
          Pacotes de Creditos
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {creditPacks.map((pack) => (
            <div
              key={pack.id}
              className={`glass-panel card-elevated relative rounded-2xl p-5 text-center ${
                pack.popular ? 'ring-2 ring-primary' : ''
              }`}
            >
              {pack.popular && (
                <span className="glow-badge absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold text-primary-foreground">
                  POPULAR
                </span>
              )}
              <p className="text-3xl font-bold text-foreground">
                {pack.credits}
              </p>
              <p className="text-sm text-muted-foreground">creditos</p>
              <p className="mt-2 text-lg font-bold text-foreground">
                {formatPrice(pack.price)}
              </p>
              <button
                type="button"
                onClick={() => onBuyPack?.(pack.id)}
                className={`btn-press mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  pack.popular
                    ? 'btn-glow bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                    : 'glass-panel text-foreground hover:bg-muted'
                }`}
              >
                Comprar
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════
   Tab: Faturas
   ═══════════════════════════════════════════════ */
function FaturasTab({
  payments,
  onDownload,
  onExport,
}: {
  payments: PaymentRecord[]
  onDownload?: (id: string) => void
  onExport?: () => void
}) {
  if (payments.length === 0) {
    return (
      <div className="glass-panel flex flex-col items-center rounded-2xl py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <ReceiptIcon />
        </div>
        <p className="text-sm font-medium text-foreground">
          Nenhuma fatura encontrada
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Seus pagamentos aparecerAo aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-heading text-base font-semibold text-foreground">
          Historico de Pagamentos
        </h3>
        <button
          type="button"
          onClick={() => onExport?.()}
          className="btn-press glass-panel inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <DownloadSmIcon />
          Exportar CSV
        </button>
      </div>

      <div className="glass-panel divide-y divide-border/50 overflow-hidden rounded-2xl">
        {payments.map((p) => {
          const badge = getStatusBadge(p.status)
          return (
            <div
              key={p.id}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/30"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {p.description}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDate(p.created_at)}
                </p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}
              >
                {badge.label}
              </span>
              <span className="min-w-[5rem] text-right text-sm font-semibold text-foreground">
                {formatCurrency(p.amount)}
              </span>
              {p.invoice_url ? (
                <button
                  type="button"
                  onClick={() => onDownload?.(p.id)}
                  className="btn-press rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Baixar PDF"
                >
                  <PdfIcon />
                </button>
              ) : (
                <span className="w-[30px]" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Tab: Privacidade
   ═══════════════════════════════════════════════ */
function PrivacidadeTab({
  onExportData,
  onDeleteAccount,
}: {
  onExportData?: () => void
  onDeleteAccount?: () => void
}) {
  return (
    <>
      {/* LGPD rights */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <ShieldIcon />
          </div>
          <div>
            <h3 className="text-heading text-base font-semibold text-foreground">
              Seus direitos (LGPD)
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              De acordo com a Lei Geral de Protecao de Dados, voce tem direito a:
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircleIcon />
                Acessar seus dados pessoais
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon />
                Corrigir dados incompletos ou desatualizados
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon />
                Solicitar a exclusao dos seus dados
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon />
                Exportar seus dados em formato legivel
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon />
                Revogar consentimento a qualquer momento
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Export data */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-heading text-base font-semibold text-foreground">
              Exportar seus dados
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Baixe uma copia de todas as suas informacoes em formato JSON.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onExportData?.()}
            className="btn-press glass-panel inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <DownloadSmIcon />
            Exportar
          </button>
        </div>
      </div>

      {/* Delete account */}
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-heading text-base font-semibold text-destructive">
              Excluir minha conta
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Esta acao e irreversivel. Todos os seus dados serao permanentemente apagados.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDeleteAccount?.()}
            className="btn-press inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
          >
            <TrashIcon />
            Excluir Conta
          </button>
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════
   Shared sub-components
   ═══════════════════════════════════════════════ */
function FormField({
  label,
  defaultValue,
  placeholder,
}: {
  label: string
  defaultValue: string
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  )
}

/* ═══════════════════════════════════════════════
   Icons
   ═══════════════════════════════════════════════ */
function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.5" />
      <rect x="8" y="6" width="2" height="2" rx="0.5" fill="currentColor" />
      <rect x="14" y="6" width="2" height="2" rx="0.5" fill="currentColor" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function ReceiptIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
      <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function DownloadSmIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function PdfIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-success">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
