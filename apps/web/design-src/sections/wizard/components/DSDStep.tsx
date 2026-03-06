import { useState } from 'react'
import {
  Palette,
  Check,
  X,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Eye,
} from 'lucide-react'

type DSDLayer = 'gengival' | 'whitening' | 'diastema' | 'restaurativa'
type LayerStatus = 'pending' | 'generating' | 'done'

interface DSDStepProps {
  /** Photo quality score — blocks DSD if < 55 */
  photoQualityScore?: number | null
  /** Currently active layer tab */
  activeLayer?: DSDLayer
  /** Status of each layer */
  layerStatuses?: Record<DSDLayer, LayerStatus>
  /** Layer descriptions */
  layerDescriptions?: Record<DSDLayer, string>
  /** Gengivoplasty approval state: null = unanswered, true = approved, false = rejected */
  gingivoplastyApproved?: boolean | null
  /** Original photo (before) */
  beforeImage?: string | null
  /** Simulation photo (after) */
  afterImage?: string | null
  /** Callback when layer tab changes */
  onChangeLayer?: (layer: DSDLayer) => void
  /** Callback to approve gengivoplasty */
  onApproveGingivo?: () => void
  /** Callback to reject gengivoplasty */
  onRejectGingivo?: () => void
  /** Callback to regenerate a layer */
  onRegenerateLayer?: (layer: DSDLayer) => void
}

const DEFAULT_STATUSES: Record<DSDLayer, LayerStatus> = {
  gengival: 'done',
  whitening: 'done',
  diastema: 'generating',
  restaurativa: 'pending',
}

const DEFAULT_DESCRIPTIONS: Record<DSDLayer, string> = {
  gengival:
    'Reducao de ~1.5mm no tecido gengival dos dentes 11 e 21 para simetria da margem.',
  whitening:
    'Simulacao de clareamento nivel Natural — tons B1/A1 aplicados aos anteriores.',
  diastema:
    'Fechamento do diastema central de 0.5mm com distribuicao proporcional.',
  restaurativa:
    'Restauracao dos dentes 11, 21 e 12 com harmonizacao de contorno.',
}

const LAYER_LABELS: Record<DSDLayer, string> = {
  gengival: 'Gengival',
  whitening: 'Whitening',
  diastema: 'Diastema',
  restaurativa: 'Restaurativa',
}

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUyOTNiIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NDc0OGIiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj5TaW11bGF0aW9uPC90ZXh0Pjwvc3ZnPg=='

export default function DSDStep({
  photoQualityScore = 82,
  activeLayer: controlledLayer,
  layerStatuses = DEFAULT_STATUSES,
  layerDescriptions = DEFAULT_DESCRIPTIONS,
  gingivoplastyApproved: controlledGingivo,
  beforeImage = PLACEHOLDER_IMAGE,
  afterImage = PLACEHOLDER_IMAGE,
  onChangeLayer,
  onApproveGingivo,
  onRejectGingivo,
  onRegenerateLayer,
}: DSDStepProps) {
  const [internalLayer, setInternalLayer] = useState<DSDLayer>('gengival')
  const [internalGingivo, setInternalGingivo] = useState<boolean | null>(null)
  const [viewMode, setViewMode] = useState<'split' | 'before' | 'after'>(
    'split',
  )

  const layer = controlledLayer ?? internalLayer
  const setLayer = onChangeLayer ?? setInternalLayer
  const gingivoApproved =
    controlledGingivo !== undefined ? controlledGingivo : internalGingivo

  // Quality gate
  if (photoQualityScore !== null && photoQualityScore < 55) {
    return (
      <div className="space-y-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warning/10">
          <AlertTriangle className="w-8 h-8 text-warning" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Qualidade insuficiente
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            A foto tem qualidade {photoQualityScore}/100. O DSD requer no minimo
            55 pontos para gerar simulacoes confiaveis.
          </p>
        </div>
        <div className="glass-panel rounded-xl p-4 max-w-sm mx-auto">
          <p className="text-xs text-muted-foreground">
            Volte ao passo de foto e envie uma imagem com melhor iluminacao e
            foco nos dentes superiores.
          </p>
        </div>
      </div>
    )
  }

  const status = layerStatuses[layer]
  const description = layerDescriptions[layer]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 glow-icon">
          <Palette className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-heading neon-text">
          Digital Smile Design
        </h2>
        <p className="text-sm text-muted-foreground">
          Simulacao estetica do resultado
        </p>
      </div>

      {/* Before / After comparison */}
      <div className="relative rounded-xl overflow-hidden card-elevated border border-border">
        {/* View mode toggle */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-lg p-0.5">
          {(['split', 'before', 'after'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors
                         focus-visible:ring-2 focus-visible:ring-ring ${
                           viewMode === mode
                             ? 'bg-primary text-primary-foreground'
                             : 'text-muted-foreground hover:text-foreground'
                         }`}
            >
              {mode === 'split'
                ? 'Comparar'
                : mode === 'before'
                  ? 'Antes'
                  : 'Depois'}
            </button>
          ))}
        </div>

        {viewMode === 'split' ? (
          <div className="grid grid-cols-2">
            <div className="relative">
              <img
                src={beforeImage || PLACEHOLDER_IMAGE}
                alt="Antes — foto original"
                className="w-full aspect-[4/3] object-cover"
              />
              <span className="absolute bottom-2 left-2 text-xs px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm font-medium text-foreground">
                Antes
              </span>
            </div>
            <div className="relative">
              <div className="w-full aspect-[4/3] bg-gradient-to-br from-primary/5 via-muted to-accent/5 flex items-center justify-center">
                {status === 'done' ? (
                  <img
                    src={afterImage || PLACEHOLDER_IMAGE}
                    alt="Depois — simulacao DSD"
                    className="w-full h-full object-cover"
                  />
                ) : status === 'generating' ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">
                      Gerando...
                    </span>
                  </div>
                ) : (
                  <Eye className="w-6 h-6 text-muted-foreground/40" />
                )}
              </div>
              <span className="absolute bottom-2 right-2 text-xs px-2 py-0.5 rounded-full bg-primary/80 backdrop-blur-sm text-primary-foreground font-medium">
                Depois
              </span>
            </div>
            {/* Center divider */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-primary/60" />
          </div>
        ) : (
          <div className="relative">
            <img
              src={
                viewMode === 'before'
                  ? beforeImage || PLACEHOLDER_IMAGE
                  : afterImage || PLACEHOLDER_IMAGE
              }
              alt={viewMode === 'before' ? 'Antes' : 'Depois'}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
        )}

        {/* Proportions analysis indicators (decorative) */}
        {viewMode !== 'before' && status === 'done' && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Central line */}
            <div className="absolute top-1/4 bottom-1/4 left-1/2 -translate-x-1/2 w-px bg-primary/30" />
            {/* Horizontal guide */}
            <div className="absolute left-1/4 right-1/4 top-1/2 -translate-y-1/2 h-px bg-primary/20" />
          </div>
        )}
      </div>

      {/* Layer tabs */}
      <div className="wizard-tabs">
        {(
          ['gengival', 'whitening', 'diastema', 'restaurativa'] as DSDLayer[]
        ).map((l) => {
          const s = layerStatuses[l]
          return (
            <button
              key={l}
              onClick={() => setLayer(l)}
              className={`wizard-tab flex items-center gap-1.5 ${layer === l ? 'active' : ''}`}
            >
              {s === 'done' && <Check className="w-3 h-3 text-success" />}
              {s === 'generating' && (
                <Loader2 className="w-3 h-3 animate-spin text-primary" />
              )}
              {LAYER_LABELS[l]}
            </button>
          )
        })}
      </div>

      {/* Active layer content */}
      <div className="space-y-4">
        {status === 'done' && (
          <>
            <p className="text-sm text-muted-foreground">{description}</p>
            <button
              onClick={() => onRegenerateLayer?.(layer)}
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80
                       transition-colors focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            >
              <RefreshCw className="w-4 h-4" /> Regenerar Camada
            </button>
          </>
        )}
        {status === 'generating' && (
          <div className="flex items-center gap-3 py-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              Gerando camada...
            </span>
          </div>
        )}
        {status === 'pending' && (
          <p className="text-sm text-muted-foreground/60 py-4">
            Aguardando camadas anteriores...
          </p>
        )}
      </div>

      {/* Gengivoplasty approval */}
      {layer === 'gengival' && gingivoApproved === null && (
        <div className="glass-panel rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            Gengivoplastia sugerida pela IA
          </h4>
          <p className="text-xs text-muted-foreground">
            A analise detectou excesso de tecido gengival nos dentes 11 e 21. A
            gengivoplastia pode melhorar a simetria do sorriso.
          </p>
          <div className="flex gap-2">
            <button
              onClick={
                onApproveGingivo ?? (() => setInternalGingivo(true))
              }
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
                       bg-primary text-primary-foreground text-sm font-medium btn-press
                       focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Check className="w-4 h-4" /> Incluir
            </button>
            <button
              onClick={
                onRejectGingivo ?? (() => setInternalGingivo(false))
              }
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
                       border border-border text-foreground text-sm font-medium hover:bg-muted
                       transition-colors btn-press focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <X className="w-4 h-4" /> Descartar
            </button>
          </div>
        </div>
      )}
      {layer === 'gengival' && gingivoApproved === true && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success text-sm">
          <Check className="w-4 h-4" /> Gengivoplastia incluida no plano
        </div>
      )}
      {layer === 'gengival' && gingivoApproved === false && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 text-muted-foreground text-sm">
          <X className="w-4 h-4" /> Gengivoplastia descartada
        </div>
      )}
    </div>
  )
}
