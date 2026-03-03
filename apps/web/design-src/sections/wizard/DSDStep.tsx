import '../../preview-theme.css'
import { useState } from 'react'
import { Palette, Check, X, RefreshCw, Loader2 } from 'lucide-react'

type DSDLayer = 'gengival' | 'whitening' | 'diastema' | 'restaurativa'
type LayerStatus = 'pending' | 'generating' | 'done'

interface DSDStepProps {
  activeLayer?: DSDLayer
  onChangeLayer?: (layer: DSDLayer) => void
  gingivoplastyApproved?: boolean | null
  onApproveGingivo?: () => void
  onRejectGingivo?: () => void
}

const BEFORE_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUyOTNiIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NDc0OGIiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj5CZWZvcmU8L3RleHQ+PC9zdmc+'

const AFTER_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUyOTNiIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NDc0OGIiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj5BZnRlcjwvdGV4dD48L3N2Zz4='

const LAYER_STATUS: Record<DSDLayer, LayerStatus> = {
  gengival: 'done',
  whitening: 'done',
  diastema: 'generating',
  restaurativa: 'pending',
}

const LAYER_DESC: Record<DSDLayer, string> = {
  gengival:
    'Reducao de ~1.5mm no tecido gengival dos dentes 11 e 21 para simetria da margem.',
  whitening:
    'Simulacao de clareamento nivel Natural — tons B1/A1 aplicados aos anteriores.',
  diastema:
    'Fechamento do diastema central de 0.5mm com distribuicao proporcional.',
  restaurativa:
    'Restauracao dos dentes 11, 21 e 12 com harmonizacao de contorno.',
}

export default function DSDStep({
  activeLayer,
  onChangeLayer,
  gingivoplastyApproved,
  onApproveGingivo,
  onRejectGingivo,
}: DSDStepProps = {}) {
  const [internalLayer, setInternalLayer] = useState<DSDLayer>('gengival')
  const [internalGingivo, setInternalGingivo] = useState<boolean | null>(null)

  const layer = activeLayer ?? internalLayer
  const setLayer = onChangeLayer ?? setInternalLayer
  const gingivoApproved =
    gingivoplastyApproved !== undefined ? gingivoplastyApproved : internalGingivo

  return (
    <div className="wizard-stage space-y-6">
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

      {/* Before/After comparison */}
      <div className="relative rounded-xl overflow-hidden card-elevated">
        <div className="grid grid-cols-2">
          <div className="relative">
            <img
              src={BEFORE_IMAGE}
              alt="Antes"
              className="w-full aspect-[4/3] object-cover"
            />
            <span className="absolute bottom-2 left-2 text-xs px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm font-medium">
              Antes
            </span>
          </div>
          <div className="relative">
            <img
              src={AFTER_IMAGE}
              alt="Depois"
              className="w-full aspect-[4/3] object-cover"
            />
            <span className="absolute bottom-2 right-2 text-xs px-2 py-0.5 rounded-full bg-primary/80 backdrop-blur-sm text-primary-foreground font-medium">
              Depois
            </span>
          </div>
          {/* Center divider */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-primary/60" />
        </div>
      </div>

      {/* Layer tabs */}
      <div className="wizard-tabs">
        {(
          ['gengival', 'whitening', 'diastema', 'restaurativa'] as DSDLayer[]
        ).map((l) => {
          const status = LAYER_STATUS[l]
          return (
            <button
              key={l}
              onClick={() => setLayer(l)}
              className={`wizard-tab flex items-center gap-1.5 ${layer === l ? 'active' : ''}`}
            >
              {status === 'done' && (
                <Check className="w-3 h-3 text-success" />
              )}
              {status === 'generating' && (
                <Loader2 className="w-3 h-3 animate-spin text-primary" />
              )}
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </button>
          )
        })}
      </div>

      {/* Active layer content */}
      <div className="space-y-4">
        {LAYER_STATUS[layer] === 'done' && (
          <>
            <p className="text-sm text-muted-foreground">
              {LAYER_DESC[layer]}
            </p>
            <button className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
              <RefreshCw className="w-4 h-4" /> Regenerar Camada
            </button>
          </>
        )}
        {LAYER_STATUS[layer] === 'generating' && (
          <div className="flex items-center gap-3 py-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              Gerando camada...
            </span>
          </div>
        )}
        {LAYER_STATUS[layer] === 'pending' && (
          <p className="text-sm text-muted-foreground/60 py-4">
            Aguardando camadas anteriores...
          </p>
        )}
      </div>

      {/* Gengivoplasty approval (show when layer is gengival and not yet decided) */}
      {layer === 'gengival' && gingivoApproved === null && (
        <div className="glass-panel rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-semibold">
            Gengivoplastia sugerida pela IA
          </h4>
          <p className="text-xs text-muted-foreground">
            A analise detectou excesso de tecido gengival nos dentes 11 e 21. A
            gengivoplastia pode melhorar a simetria do sorriso.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onApproveGingivo ?? (() => setInternalGingivo(true))}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium btn-press"
            >
              <Check className="w-4 h-4" /> Incluir
            </button>
            <button
              onClick={onRejectGingivo ?? (() => setInternalGingivo(false))}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors btn-press"
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
