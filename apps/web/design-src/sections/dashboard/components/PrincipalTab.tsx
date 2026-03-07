import {
  Sparkles,
  FileText,
  Users,
  TrendingUp,
  CheckCircle2,
  Package,
  Settings,
  AlertTriangle,
  FileEdit,
} from 'lucide-react'
import type { DashboardMetrics, DraftInfo } from '../../../../design/sections/dashboard/types'

export interface PrincipalTabProps {
  metrics: DashboardMetrics
  draft?: DraftInfo | null
  creditsRemaining?: number
  showCreditsBanner?: boolean
  onNewCase?: () => void
  onContinueDraft?: () => void
  onDiscardDraft?: () => void
  onNavigatePatients?: () => void
  onNavigateInventory?: () => void
  onNavigateSettings?: () => void
  onUpgrade?: () => void
}

export default function PrincipalTab({
  metrics,
  draft,
  creditsRemaining = 0,
  showCreditsBanner = false,
  onNewCase,
  onContinueDraft,
  onDiscardDraft,
  onNavigatePatients,
  onNavigateInventory,
  onNavigateSettings,
  onUpgrade,
}: PrincipalTabProps) {
  const circumference = Math.PI * 2 * 12
  const completionOffset =
    circumference - (circumference * (metrics.completionRate / 100))

  const quickActions = [
    { icon: Users, label: 'Meus Pacientes', onClick: onNavigatePatients },
    { icon: Package, label: 'Meu Inventario', onClick: onNavigateInventory },
    { icon: Settings, label: 'Configuracoes', onClick: onNavigateSettings },
  ]

  return (
    <div className="space-y-6">
      {/* CTA Hero */}
      <div className="glass-panel rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 glow-icon shrink-0">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-heading neon-text">
                Iniciar Novo Caso
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Analise fotos e gere protocolos com IA
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center shrink-0">
            <button
              onClick={() => onNewCase?.()}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm
                       btn-press btn-glow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Iniciar
            </button>
            <span className="text-xs text-muted-foreground mt-1.5">
              2 creditos
            </span>
          </div>
        </div>
      </div>

      {/* KPI Banner */}
      <div className="glass-panel rounded-xl card-elevated p-4 sm:p-5" style={{ animation: 'fade-in-up 0.6s ease-out 0.1s both' }}>
        <h3 className="text-xs font-semibold text-heading text-muted-foreground uppercase tracking-wider mb-3">
          Sua Performance
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <KpiItem
            icon={<FileText className="w-5 h-5 text-primary" />}
            iconBg="bg-primary/10"
            value={metrics.totalCases}
            label="Total Casos"
          />
          <KpiItem
            icon={<Users className="w-5 h-5 text-accent" />}
            iconBg="bg-accent/10"
            value={metrics.totalPatients}
            label="Pacientes"
          />
          <KpiItem
            icon={<TrendingUp className="w-5 h-5 text-warning" />}
            iconBg="bg-warning/10"
            value={metrics.weeklySessions}
            label="Semana"
          />
          {/* Completion with ring */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-success/10">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                className="shrink-0"
                aria-hidden="true"
              >
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-muted"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="text-success progress-ring-circle"
                  strokeDasharray={circumference}
                  strokeDashoffset={completionOffset}
                  transform="rotate(-90 16 16)"
                  style={
                    {
                      '--ring-circumference': circumference,
                      '--ring-target': completionOffset,
                    } as React.CSSProperties
                  }
                />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground leading-none">
                {metrics.completionRate}%
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Conclusao</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ animation: 'fade-in-up 0.6s ease-out 0.15s both' }}>
        {quickActions.map(({ icon: Icon, label, onClick }) => (
          <button
            key={label}
            onClick={() => onClick?.()}
            className="glass-panel rounded-xl p-4 card-elevated cursor-pointer
                     flex flex-col items-center gap-2 text-center
                     focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                     transition-colors btn-press"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">{label}</span>
          </button>
        ))}
      </div>

      {/* Alerts Section */}
      <div className="space-y-4">
        {/* Credit warning */}
        {showCreditsBanner && (
          <div className="rounded-xl bg-gradient-to-r from-warning/10 to-warning/5 border border-warning/20 p-4" style={{ animation: 'fade-in-up 0.6s ease-out 0.2s both' }}>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {creditsRemaining} creditos restantes
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Garanta acesso continuo aos protocolos de IA
                </p>
              </div>
              <button
                onClick={() => onUpgrade?.()}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-warning text-warning-foreground text-sm font-medium
                         btn-press focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
              >
                Ver Planos
              </button>
            </div>
          </div>
        )}

        {/* Draft pending */}
        {draft && (
          <div className="ai-shimmer-border rounded-xl glass-panel p-4" style={{ animation: 'fade-in-up 0.6s ease-out 0.25s both' }}>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                <FileEdit className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Caso em progresso &mdash; {draft.patientName}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {draft.teethCount} dentes &bull; Salvo ha 2h
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 ml-12">
              <button
                onClick={() => onContinueDraft?.()}
                className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium
                         btn-press btn-glow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
              >
                Continuar
              </button>
              <button
                onClick={() => onDiscardDraft?.()}
                className="px-4 py-1.5 rounded-lg text-sm font-medium text-muted-foreground
                         hover:bg-muted hover:text-foreground
                         btn-press focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
              >
                Descartar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ---- Sub-components ---- */

function KpiItem({
  icon,
  iconBg,
  value,
  label,
}: {
  icon: React.ReactNode
  iconBg: string
  value: number
  label: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${iconBg}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-none">
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  )
}
