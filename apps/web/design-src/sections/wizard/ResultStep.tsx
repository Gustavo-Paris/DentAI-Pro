import '../../preview-theme.css'
import { CheckCircle, Eye, Plus, Loader2 } from 'lucide-react'

interface ResultStepProps {
  isSubmitting?: boolean
  submissionComplete?: boolean
  protocolsReady?: boolean
  patientName?: string
  toothSummary?: string
  budgetLabel?: string
  onViewCase?: () => void
  onNewCase?: () => void
}

export default function ResultStep({
  isSubmitting = false,
  submissionComplete = true,
  protocolsReady = true,
  patientName = 'Maria Clara Oliveira',
  toothSummary = '11, 21, 12 (3 resinas) + 14 (gengivoplastia)',
  budgetLabel = 'Padrão',
  onViewCase = () => {},
  onNewCase = () => {},
}: ResultStepProps = {}) {
  if (isSubmitting) {
    return (
      <div className="wizard-stage flex flex-col items-center justify-center py-16 space-y-6">
        <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Processando caso...</p>
      </div>
    )
  }

  if (submissionComplete) {
    return (
      <div className="wizard-stage relative overflow-hidden">
        {/* Decorative glow orbs */}
        <div className="glow-orb glow-orb-slow w-32 h-32 bg-primary/20 -top-8 -right-8" />
        <div className="glow-orb glow-orb-reverse w-24 h-24 bg-accent/15 -bottom-6 -left-6" />

        <div className="relative flex flex-col items-center py-12 space-y-6 text-center">
          {/* Success icon */}
          <div className="success-pulse">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center animate-[scale-in_0.3s_ease-out]">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold neon-text">Caso Criado!</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              O caso foi criado com sucesso e os protocolos estão sendo processados.
            </p>
          </div>

          {/* Case summary card */}
          <div className="glass-panel rounded-xl p-4 w-full max-w-sm space-y-2 text-left animate-[fade-in-up_0.4s_ease-out_0.1s_both]">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Paciente</span>
                <p className="font-medium text-foreground">{patientName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Orçamento</span>
                <p className="font-medium text-foreground">{budgetLabel}</p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Dentes</span>
                <p className="font-medium text-foreground">{toothSummary}</p>
              </div>
            </div>

            {/* Async status */}
            <div className="pt-2 border-t border-border/50">
              {protocolsReady ? (
                <div className="flex items-center gap-2 text-success text-xs font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Protocolos prontos
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-primary text-xs font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Gerando protocolos (~2min)
                  </div>
                  <p className="text-xs text-muted-foreground/70">
                    Você pode ver o caso enquanto os protocolos são gerados.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs animate-[fade-in-up_0.4s_ease-out_0.3s_both]">
            <button
              onClick={onViewCase}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium btn-glow btn-press focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Eye className="w-4 h-4" /> Ver Caso
            </button>
            <button
              onClick={onNewCase}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors btn-press focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Plus className="w-4 h-4" /> Novo Caso
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Idle fallback
  return (
    <div className="wizard-stage flex flex-col items-center justify-center py-16 space-y-4">
      <p className="text-sm text-muted-foreground">Preparando caso...</p>
    </div>
  )
}
