import {
  Brain,
  X,
  Check,
  AlertTriangle,
  Lightbulb,
  Camera,
  ArrowRight,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import type {
  AnalysisResult,
  ToothDetection,
  TreatmentType,
} from '../../../../design/sections/wizard/types'

const SUB_STEPS = [
  'Preparando imagem',
  'Detectando arcada',
  'Identificando dentes',
  'Analisando condicoes',
  'Avaliando proporcoes',
  'Gerando diagnostico',
]

const ETA_SECONDS = [45, 35, 25, 18, 10, 3]

const TREATMENT_COLORS: Record<string, string> = {
  resina: 'bg-primary/15 text-primary',
  porcelana: 'bg-warning/15 text-warning',
  coroa: 'bg-[#a855f7]/15 text-[#a855f7]',
  implante: 'bg-destructive/15 text-destructive',
  endodontia: 'bg-[#f43f5e]/15 text-[#f43f5e]',
  encaminhamento: 'bg-muted text-muted-foreground',
  gengivoplastia: 'bg-[#ec4899]/15 text-[#ec4899]',
  recobrimento_radicular: 'bg-success/15 text-success',
}

const PRIORITY_COLORS: Record<string, string> = {
  alta: 'bg-destructive/10 text-destructive',
  'média': 'bg-warning/10 text-warning',
  baixa: 'bg-muted text-muted-foreground',
}

const CONFIDENCE_STYLES: Record<string, string> = {
  alta: 'from-success/10 to-success/5 border-success/20 text-success',
  'média': 'from-warning/10 to-warning/5 border-warning/20 text-warning',
  baixa: 'from-destructive/10 to-destructive/5 border-destructive/20 text-destructive',
}

interface AnalyzingStepProps {
  isAnalyzing?: boolean
  analysisResult?: AnalysisResult | null
  imageBase64?: string | null
  onAbortAnalysis?: () => void
  /** Loading sub-step (0-5), used when isAnalyzing is true */
  currentSubStep?: number
  /** Progress percentage (0-95), used when isAnalyzing is true */
  progress?: number
  /** Error message to display instead of loading */
  error?: string | null
  onRetry?: () => void
  onChangePhoto?: () => void
  onManualReview?: () => void
}

function ToothResultCard({ tooth }: { tooth: ToothDetection }) {
  const treatmentCls =
    TREATMENT_COLORS[tooth.treatment_type] || TREATMENT_COLORS.encaminhamento
  const priorityCls = PRIORITY_COLORS[tooth.priority] || PRIORITY_COLORS.baixa

  return (
    <div className="rounded-lg border border-border p-3 hover:border-primary/20 transition-colors card-elevated">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono font-bold text-sm text-foreground">
          {tooth.tooth}
        </span>
        <span
          className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${priorityCls}`}
        >
          {tooth.priority}
        </span>
      </div>
      <div className="mb-2">
        <span
          className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium capitalize ${treatmentCls}`}
        >
          {tooth.treatment_type.replace('_', ' ')}
        </span>
      </div>
      <ul className="space-y-0.5">
        {tooth.findings.map((finding, i) => (
          <li
            key={i}
            className="text-xs text-muted-foreground flex items-start gap-1.5"
          >
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
            {finding}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function AnalyzingStep({
  isAnalyzing = true,
  analysisResult = null,
  imageBase64 = null,
  onAbortAnalysis,
  currentSubStep = 3,
  progress = 67,
  error = null,
  onRetry,
  onChangePhoto,
  onManualReview,
}: AnalyzingStepProps) {
  // Error state
  if (error) {
    return (
      <div className="space-y-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warning/10">
          <AlertTriangle className="w-8 h-8 text-warning" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Erro na Analise
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {error}
          </p>
        </div>

        {imageBase64 && (
          <div className="w-12 h-12 mx-auto rounded-lg overflow-hidden opacity-75">
            <img
              src={imageBase64}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex gap-3 p-3 rounded-lg bg-muted/30 text-left max-w-sm mx-auto">
          <Lightbulb className="w-4 h-4 text-warning mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Tente com mais iluminacao e garanta que os dentes superiores estejam
            visiveis na foto.
          </p>
        </div>

        <div className="flex flex-col gap-2 max-w-xs mx-auto">
          <button
            onClick={() => onRetry?.()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                     bg-primary text-primary-foreground text-sm font-medium btn-glow btn-press
                     focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <RefreshCw className="w-4 h-4" /> Tentar Novamente
          </button>
          <button
            onClick={() => onChangePhoto?.()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                     border border-border text-foreground text-sm font-medium hover:bg-muted
                     transition-colors btn-press focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Camera className="w-4 h-4" /> Trocar Foto
          </button>
          <button
            onClick={() => onManualReview?.()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl
                     text-muted-foreground text-sm hover:text-foreground transition-colors btn-press
                     focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          >
            <ArrowRight className="w-4 h-4" /> Revisao Manual
          </button>
        </div>
      </div>
    )
  }

  // Results state
  if (!isAnalyzing && analysisResult) {
    const confidenceCls =
      CONFIDENCE_STYLES[analysisResult.confidence] || CONFIDENCE_STYLES['média']

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-success/10 animate-[scale-in_0.3s_ease-out]">
            <Check className="w-6 h-6 text-success" />
          </div>
          <h2 className="text-xl font-semibold text-heading neon-text">
            Analise Concluida
          </h2>
          <p className="text-sm text-muted-foreground">
            {analysisResult.detected_teeth.length} dentes detectados
          </p>
        </div>

        {/* Confidence banner */}
        <div
          className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r border ${confidenceCls}`}
        >
          <Brain className="w-4 h-4 shrink-0" />
          <div className="flex-1">
            <span className="text-sm font-medium">
              Confianca {analysisResult.confidence}
            </span>
            <span className="text-xs opacity-70 ml-2">na analise da IA</span>
          </div>
        </div>

        {/* Detected teeth grid */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Dentes Detectados
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {analysisResult.detected_teeth.map((tooth) => (
              <ToothResultCard key={tooth.tooth} tooth={tooth} />
            ))}
          </div>
        </div>

        {/* Observations */}
        {analysisResult.observations.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Observacoes
            </h3>
            <ul className="space-y-1.5">
              {analysisResult.observations.map((obs, i) => (
                <li
                  key={i}
                  className="text-xs text-muted-foreground flex items-start gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                  {obs}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  // Loading / analyzing state
  const eta = ETA_SECONDS[currentSubStep] ?? 0
  const circumference = 2 * Math.PI * 35

  return (
    <div className="space-y-6 text-center">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 glow-icon">
          <Brain className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold neon-text">
          Analisando sua foto
        </h2>
        <p className="text-sm text-muted-foreground">
          A IA esta processando a imagem
        </p>
      </div>

      {/* Photo with scan line */}
      {imageBase64 && (
        <div className="relative max-w-xs mx-auto rounded-xl overflow-hidden card-elevated ai-shimmer-border">
          <div className="scan-line-animation vignette-overlay">
            <img
              src={imageBase64}
              alt="Analisando foto dental"
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
        </div>
      )}

      {/* Progress ring */}
      <div className="flex flex-col items-center gap-3">
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
              strokeDashoffset={circumference * (1 - progress / 100)}
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
            {i < currentSubStep ? (
              <Check className="w-4 h-4 text-success shrink-0" />
            ) : i === currentSubStep ? (
              <Loader2 className="w-4 h-4 text-primary shrink-0 animate-spin" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
            )}
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
        onClick={() => onAbortAnalysis?.()}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground
                 transition-colors btn-press focus-visible:ring-2 focus-visible:ring-ring rounded-md"
      >
        <X className="w-3.5 h-3.5" />
        Cancelar
      </button>
    </div>
  )
}
