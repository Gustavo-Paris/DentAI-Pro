import '../../preview-theme.css'
import { useState } from 'react'
import {
  Camera,
  ImageIcon,
  Save,
  Gift,
  Copy,
  Share2,
  CreditCard,
  ExternalLink,
  Download,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  User,
  Phone,
  Building2,
  Hash,
  ChevronRight,
} from 'lucide-react'
import type {
  ProfileTabId,
  UserProfile,
  SubscriptionInfo,
  CreditPack,
  PaymentRecord,
  ReferralInfo,
} from '../../../design/sections/profile/types'
import mockData from '../../../design/sections/profile/data.json'

const TABS: { id: ProfileTabId; label: string }[] = [
  { id: 'perfil', label: 'Perfil' },
  { id: 'assinatura', label: 'Assinatura' },
  { id: 'faturas', label: 'Faturas' },
  { id: 'privacidade', label: 'Privacidade' },
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function FormField({
  icon: Icon,
  label,
  value,
  placeholder,
}: {
  icon: React.ElementType
  label: string
  value: string
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {label}
      </label>
      <input
        type="text"
        defaultValue={value}
        placeholder={placeholder}
        className="w-full glass-panel rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    succeeded: { bg: 'bg-success/10', text: 'text-success', label: 'Aprovado' },
    failed: { bg: 'bg-destructive/10', text: 'text-destructive', label: 'Falhou' },
    pending: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Pendente' },
    refunded: { bg: 'bg-primary/10', text: 'text-primary', label: 'Reembolsado' },
  }
  const c = config[status] || config.pending
  return (
    <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}

export default function ProfilePreview() {
  const [activeTab, setActiveTab] = useState<ProfileTabId>('perfil')
  const profile = mockData.sampleProfile as UserProfile
  const subscription = mockData.sampleSubscription as SubscriptionInfo
  const creditPacks = mockData.sampleCreditPacks as CreditPack[]
  const payments = mockData.samplePayments as PaymentRecord[]
  const referral = mockData.sampleReferral as ReferralInfo

  return (
    <div className="section-glow-bg relative min-h-screen p-6 sm:p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="glow-orb" style={{
          width: 450, height: 450, top: '0%', left: '15%',
          background: 'radial-gradient(circle, rgb(var(--color-primary-rgb) / 0.10) 0%, transparent 70%)',
        }} />
        <div className="glow-orb glow-orb-slow" style={{
          width: 350, height: 350, bottom: '10%', right: '5%',
          background: 'radial-gradient(circle, rgb(var(--color-accent-rgb) / 0.10) 0%, transparent 70%)',
        }} />
        <div className="glow-orb" style={{
          width: 320, height: 320, top: '50%', left: '60%',
          background: 'radial-gradient(circle, rgb(var(--accent-violet-rgb) / 0.08) 0%, transparent 70%)',
        }} />
      </div>
      <div className="ai-grid-pattern absolute inset-0 pointer-events-none" />

      <div className="relative space-y-6">
        {/* Header */}
        <div style={{ animation: 'fade-in-up 0.6s ease-out 0.1s both' }}>
          <h1 className="text-2xl font-bold text-heading neon-text">Meu Perfil</h1>
          <p className="text-sm text-muted-foreground">Gerencie sua conta e configuracoes</p>
        </div>

        {/* Tab Bar */}
        <div className="glass-panel rounded-xl p-1 flex gap-1" style={{ animation: 'fade-in-up 0.6s ease-out 0.15s both' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'perfil' && (
          <div className="space-y-6" style={{ animation: 'fade-in-up 0.6s ease-out 0.2s both' }}>
            {/* Avatar Section */}
            <div className="flex items-center gap-6 justify-center">
              {/* User Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-semibold">
                  {getInitials(profile.full_name)}
                </div>
                <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring">
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>
              {/* Clinic Logo */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <span className="block text-center text-xs text-muted-foreground mt-1">Logo</span>
              </div>
            </div>

            {/* Form */}
            <div className="glass-panel card-elevated rounded-xl p-6 space-y-4">
              <FormField icon={User} label="Nome Completo" value={profile.full_name} />
              <FormField
                icon={Hash}
                label="CRO"
                value={profile.cro || ''}
                placeholder="Ex: SP-12345"
              />
              <FormField
                icon={Building2}
                label="Nome da Clinica"
                value={profile.clinic_name || ''}
                placeholder="Nome da sua clinica"
              />
              <FormField
                icon={Phone}
                label="Telefone"
                value={profile.phone || ''}
                placeholder="(00) 00000-0000"
              />

              <div className="pt-2">
                <button className="w-full bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium btn-press btn-glow flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-ring">
                  <Save className="h-4 w-4" />
                  Salvar Alteracoes
                </button>
              </div>
            </div>

            {/* Referral Card */}
            <div className="glass-panel card-elevated rounded-xl overflow-hidden">
              <div className="bg-gradient-to-br from-primary/10 to-transparent p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Programa de Indicacao</h3>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <code className="font-mono text-sm bg-muted rounded-lg px-3 py-2 flex-1 text-foreground">
                    {referral.code}
                  </code>
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring">
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-foreground">
                      {referral.total_referrals}
                    </p>
                    <p className="text-xs text-muted-foreground">Indicacoes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-primary">
                      {referral.credits_earned}
                    </p>
                    <p className="text-xs text-muted-foreground">Creditos ganhos</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring hover:bg-[#25D366]/90">
                    <Share2 className="h-4 w-4" />
                    WhatsApp
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 glass-panel rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring hover:bg-muted">
                    <Copy className="h-4 w-4" />
                    Copiar Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assinatura' && (
          <div className="space-y-6" style={{ animation: 'fade-in-up 0.6s ease-out 0.2s both' }}>
            {/* Plan + Credits 2-col grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Plan Card */}
              <div className="glass-panel card-elevated rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{subscription.plan_name}</h3>
                  <span className="text-xs rounded-full px-2.5 py-1 font-medium bg-success/10 text-success">
                    Ativo
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  R$ {subscription.price.toFixed(2).replace('.', ',')}
                  <span className="text-sm font-normal text-muted-foreground">/mes</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Proxima cobranca:{' '}
                  {new Date(subscription.next_billing_date!).toLocaleDateString('pt-BR')}
                </p>
                <button className="w-full glass-panel rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-ring">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Gerenciar Assinatura
                </button>
              </div>

              {/* Credits Card */}
              <div className="glass-panel card-elevated rounded-xl p-5 space-y-3">
                <h3 className="font-semibold text-foreground">Creditos</h3>
                {/* Progress bar */}
                <div className="h-3 rounded-full bg-primary/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${(subscription.credits_used / subscription.credits_total) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {subscription.credits_used}
                  </span>{' '}
                  de {subscription.credits_total} creditos usados
                </p>
                {subscription.rollover_credits > 0 && (
                  <span className="inline-block text-xs rounded-full px-2.5 py-1 bg-muted text-muted-foreground">
                    +{subscription.rollover_credits} creditos acumulados
                  </span>
                )}
              </div>
            </div>

            {/* Credit Packs */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Pacotes de Creditos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {creditPacks.map((pack) => (
                  <div
                    key={pack.id}
                    className={`glass-panel rounded-xl p-5 text-center hover:shadow-md transition-shadow ${pack.popular ? 'ai-shimmer-border' : ''}`}
                  >
                    {pack.popular && (
                      <span className="inline-block text-xs rounded-full px-2.5 py-1 bg-primary/10 text-primary font-medium mb-3">
                        Popular
                      </span>
                    )}
                    <p className="text-3xl font-bold text-foreground">{pack.credits}</p>
                    <p className="text-sm text-muted-foreground mb-4">creditos</p>
                    <p className="text-lg font-semibold text-foreground mb-4">
                      R$ {pack.price.toFixed(2).replace('.', ',')}
                    </p>
                    <button className="w-full bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium btn-press transition-colors flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-ring">
                      <CreditCard className="h-4 w-4" />
                      Comprar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'faturas' && (
          <div className="space-y-4" style={{ animation: 'fade-in-up 0.6s ease-out 0.2s both' }}>
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Historico de Pagamentos
              </h3>
              <button className="glass-panel rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5 hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring">
                <Download className="h-3.5 w-3.5" />
                Exportar CSV
              </button>
            </div>

            {/* Payment list */}
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="glass-panel card-elevated rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        R$ {(payment.amount / 100).toFixed(2).replace('.', ',')}
                      </span>
                      <StatusBadge status={payment.status} />
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {payment.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(payment.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  {payment.invoice_url && (
                    <button className="p-2 rounded-lg hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring shrink-0 ml-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'privacidade' && (
          <div className="space-y-4" style={{ animation: 'fade-in-up 0.6s ease-out 0.2s both' }}>
            {/* LGPD Rights Card */}
            <div className="glass-panel card-elevated rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Seus Direitos (LGPD)</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground pl-1">
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  Acesso aos seus dados pessoais armazenados
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  Correcao de dados incompletos ou desatualizados
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  Exclusao dos seus dados pessoais
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  Portabilidade dos dados para outro servico
                </li>
              </ul>
              <p className="text-xs text-muted-foreground">
                Seus dados sao retidos por 5 anos apos o encerramento da conta, conforme legislacao
                vigente.
              </p>
            </div>

            {/* Export Data */}
            <div className="glass-panel card-elevated rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Exportar Dados</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Baixe uma copia de todos os seus dados em formato JSON.
              </p>
              <button className="glass-panel rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-ring">
                <Download className="h-4 w-4" />
                Exportar Meus Dados
              </button>
            </div>

            {/* Delete Account */}
            <div className="glass-panel card-elevated rounded-xl p-5 space-y-3 border border-destructive/30">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h3 className="font-semibold text-destructive">Excluir Conta</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Esta acao e irreversivel. Todos os seus dados, pacientes, fotos, protocolos e
                creditos serao permanentemente excluidos.
              </p>
              <button className="bg-destructive text-destructive-foreground rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-ring hover:bg-destructive/90">
                <Trash2 className="h-4 w-4" />
                Excluir Minha Conta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
