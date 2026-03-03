import '../../preview-theme.css'
import { Brain, X, Check, AlertTriangle, Lightbulb, Camera, ArrowRight, RefreshCw, Loader2 } from 'lucide-react'

const SAMPLE_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUyOTNiIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NDc0OGIiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj5EZW50YWwgUGhvdG88L3RleHQ+PC9zdmc+'

interface AnalyzingStepProps {
  imageBase64?: string
  progress?: number
  currentSubStep?: number
  error?: string | null
  onCancel?: () => void
  onRetry?: () => void
  onChangePhoto?: () => void
  onManualReview?: () => void
}

const SUB_STEPS = [
  'Preparando imagem',
  'Detectando arcada',
  'Identificando dentes',
  'Analisando condições',
  'Avaliando proporções',
  'Gerando diagnóstico',
]

const ETA_SECONDS = [45, 35, 25, 18, 10, 3]

export default function AnalyzingStep({
  imageBase64 = SAMPLE_IMAGE,
  progress = 67,
  currentSubStep = 3,
  error = null,
  onCancel = () => {},
  onRetry = () => {},
  onChangePhoto = () => {},
  onManualReview = () => {},
}: AnalyzingStepProps = {}) {
  if (error) {
    return (
      <div className="wizard-stage space-y-6 text-center">
        {/* Warning icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warning/10">
          <AlertTriangle className="w-8 h-8 text-warning" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Erro na Análise</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">{error}</p>
        </div>

        {/* Mini photo preview */}
        <div className="w-12 h-12 mx-auto rounded-lg overflow-hidden opacity-75">
          <img src={imageBase64} alt="" className="w-full h-full object-cover" />
        </div>

        {/* Tip */}
        <div className="flex gap-3 p-3 rounded-lg bg-muted/30 text-left max-w-sm mx-auto">
          <Lightbulb className="w-4 h-4 text-warning mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Tente com mais iluminação e garanta que os dentes superiores estejam visíveis na foto.
          </p>
        </div>

        {/* Recovery buttons */}
        <div className="flex flex-col gap-2 max-w-xs mx-auto">
          <button
            onClick={onRetry}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium btn-glow btn-press focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <RefreshCw className="w-4 h-4" /> Tentar Novamente
          </button>
          <button
            onClick={onChangePhoto}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors btn-press focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Camera className="w-4 h-4" /> Trocar Foto
          </button>
          <button
            onClick={onManualReview}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-muted-foreground text-sm hover:text-foreground transition-colors btn-press focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ArrowRight className="w-4 h-4" /> Revisão Manual
          </button>
        </div>
      </div>
    )
  }

  const eta = ETA_SECONDS[currentSubStep] ?? 0

  return (
    <div className="wizard-stage space-y-6 text-center">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 glow-icon">
          <Brain className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold neon-text">Analisando sua foto</h2>
        <p className="text-sm text-muted-foreground">A IA está processando a imagem</p>
      </div>

      {/* Photo with scan line */}
      <div className="relative max-w-xs mx-auto rounded-xl overflow-hidden card-elevated">
        <div className="scan-line-animation vignette-overlay">
          <img src={imageBase64} alt="Analyzing" className="w-full aspect-[4/3] object-cover" />
        </div>
      </div>

      {/* Progress ring */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40" cy="40" r="35"
              fill="none"
              stroke="currentColor"
              className="text-muted"
              strokeWidth="4"
            />
            <circle
              cx="40" cy="40" r="35"
              fill="none"
              stroke="currentColor"
              className="text-primary progress-ring-circle"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 35}
              strokeDashoffset={2 * Math.PI * 35 * (1 - progress / 100)}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-foreground">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Sub-steps vertical checklist */}
      <div className="flex flex-col gap-2.5 max-w-sm mx-auto text-left pl-4">
        {SUB_STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-2.5">
            {/* Icon */}
            {i < currentSubStep ? (
              <Check className="w-4 h-4 text-success shrink-0" />
            ) : i === currentSubStep ? (
              <Loader2 className="w-4 h-4 text-primary ai-dot shrink-0 animate-spin" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
            )}

            {/* Label + ETA */}
            <span
              className={
                i < currentSubStep
                  ? 'text-sm text-foreground/60'
                  : i === currentSubStep
                    ? 'text-sm text-foreground font-medium'
                    : 'text-sm text-muted-foreground/40'
              }
            >
              {step}
            </span>

            {i === currentSubStep && eta > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">
                ~{eta}s restantes
              </span>
            )}
          </div>
        ))}
      </div>

      {/* AI indicator */}
      <div className="flex items-center justify-center gap-2">
        <span className="ai-dot" />
        <span className="text-xs ai-text font-medium">Powered by AI</span>
      </div>

      {/* Cancel */}
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground
                 transition-colors btn-press focus-visible:ring-2 focus-visible:ring-ring rounded-md"
      >
        <X className="w-3.5 h-3.5" />
        Cancelar
      </button>
    </div>
  )
}
