import { CheckCircle, Eye, Plus, Loader2, Check } from 'lucide-react'

const SUBMISSION_STEPS = [
  'Validando dados do caso',
  'Salvando informacoes do paciente',
  'Enviando protocolos para IA',
  'Gerando recomendacoes',
  'Finalizando caso',
]

interface ResultStepProps {
  isSubmitting?: boolean
  submissionComplete?: boolean
  /** Current submission step (0-based) for progress display */
  submissionStep?: number
  patientName?: string
  toothSummary?: string
  budgetLabel?: string
  onViewCase?: () => void
  onNewCase?: () => void
}

export default function ResultStep({
  isSubmitting = false,
  submissionComplete = false,
  submissionStep = 2,
  patientName = '',
  toothSummary = '',
  budgetLabel = 'Padrao',
  onViewCase,
  onNewCase,
}: ResultStepProps) {
  // Submitting state — full-screen frosted overlay feel
  if (isSubmitting) {
    const progressPct = Math.min(
      95,
      ((submissionStep + 1) / SUBMISSION_STEPS.length) * 100,
    )
    const circumference = 2 * Math.PI * 35

    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-8">
        {/* Frosted glass card */}
        <div className="glass-panel rounded-2xl p-8 max-w-sm w-full space-y-6 text-center">
          {/* Progress ring */}
          <div className="flex justify-center">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  fill="none"
                  stroke="currentColor"
                  className="text-muted"
                  strokeWidth="4"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  fill="none"
                  stroke="currentColor"
                  className="text-primary progress-ring-circle"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={
                    circumference * (1 - progressPct / 100)
                  }
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-foreground">
                {Math.round(progressPct)}%
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground neon-text">
              Criando Caso
            </h3>
            <p className="text-xs text-muted-foreground">
              Isso pode levar alguns segundos
            </p>
          </div>

          {/* Step checklist */}
          <div className="flex flex-col gap-2 text-left">
            {SUBMISSION_STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-2.5">
                {i < submissionStep ? (
                  <Check className="w-4 h-4 text-success shrink-0" />
                ) : i === submissionStep ? (
                  <Loader2 className="w-4 h-4 text-primary shrink-0 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                )}
                <span
                  className={
                    i < submissionStep
                      ? 'text-sm text-foreground/60'
                      : i === submissionStep
                        ? 'text-sm text-foreground font-medium'
                        : 'text-sm text-muted-foreground/40'
                  }
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Success / celebration state
  if (submissionComplete) {
    return (
      <div className="relative overflow-hidden">
        {/* Decorative glow orbs */}
        <div className="glow-orb glow-orb-slow w-32 h-32 bg-primary/20 -top-8 -right-8" />
        <div className="glow-orb glow-orb-reverse w-24 h-24 bg-accent/15 -bottom-6 -left-6" />
        <div className="glow-orb w-20 h-20 bg-success/10 top-1/2 left-1/4" />

        <div className="relative flex flex-col items-center py-12 space-y-6 text-center">
          {/* Success icon with pulse ring */}
          <div className="success-pulse">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center animate-[scale-in_0.3s_ease-out]">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold neon-text">
              Caso Criado!
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              O caso foi criado com sucesso e os protocolos estao sendo
              processados.
            </p>
          </div>

          {/* Case summary card */}
          <div className="glass-panel rounded-xl p-4 w-full max-w-sm space-y-2 text-left animate-[fade-in-up_0.4s_ease-out_0.1s_both]">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Paciente</span>
                <p className="font-medium text-foreground">
                  {patientName || '\u2014'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Orcamento</span>
                <p className="font-medium text-foreground">{budgetLabel}</p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Dentes</span>
                <p className="font-medium text-foreground">
                  {toothSummary || '\u2014'}
                </p>
              </div>
            </div>

            {/* Protocol status */}
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center gap-2 text-success text-xs font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                Protocolos prontos
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs animate-[fade-in-up_0.4s_ease-out_0.3s_both]">
            <button
              onClick={() => onViewCase?.()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                       bg-primary text-primary-foreground font-medium btn-glow btn-press
                       focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Eye className="w-4 h-4" /> Ver Caso
            </button>
            <button
              onClick={() => onNewCase?.()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                       border border-border text-foreground font-medium hover:bg-muted transition-colors btn-press
                       focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <p className="text-sm text-muted-foreground">Preparando caso...</p>
    </div>
  )
}
