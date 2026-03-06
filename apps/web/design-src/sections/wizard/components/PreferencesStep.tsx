import { Sparkles, Sun, Star, Check, Info, Zap } from 'lucide-react'
import type { WhiteningLevel } from '../../../../design/sections/wizard/types'

const WHITENING_OPTIONS = [
  {
    key: 'natural' as const,
    label: 'Natural',
    description: 'Clareamento conservador — alvo B1/A1',
    shades: ['B1', 'A1'],
    extraCredits: 0,
  },
  {
    key: 'hollywood' as const,
    label: 'Hollywood',
    description: 'Clareamento intenso — alvo BL1/BL2',
    shades: ['BL1', 'BL2', 'BL3'],
    extraCredits: 1,
  },
]

interface PreferencesStepProps {
  whiteningLevel?: WhiteningLevel | null
  onSetWhiteningLevel?: (level: WhiteningLevel) => void
  creditsRemaining?: number
}

export default function PreferencesStep({
  whiteningLevel = null,
  onSetWhiteningLevel,
  creditsRemaining = 12,
}: PreferencesStepProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 glow-icon">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-heading neon-text">
          Preferencias
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Escolha o nivel de clareamento desejado para o paciente
        </p>
      </div>

      {/* Whitening level cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {WHITENING_OPTIONS.map((option) => {
          const isSelected = whiteningLevel === option.key

          return (
            <button
              key={option.key}
              onClick={() => onSetWhiteningLevel?.(option.key)}
              className={`relative rounded-xl border-2 p-5 text-left transition-all hover:shadow-md
                         focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                           isSelected
                             ? 'ai-shimmer-border bg-primary/5'
                             : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
                         }`}
            >
              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center animate-[scale-in_0.2s_ease-out]">
                  <Check className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
              )}

              {/* Color swatch bar */}
              <div
                className={`h-2 rounded-full mb-4 ${
                  option.key === 'natural'
                    ? 'bg-gradient-to-r from-warning/30 to-warning/15'
                    : 'bg-gradient-to-r from-background to-primary/10'
                }`}
              />

              {/* Icon + label */}
              <div className="flex items-center gap-2 mb-2">
                {option.key === 'natural' ? (
                  <Sun className="w-5 h-5 text-warning" />
                ) : (
                  <Star className="w-5 h-5 text-primary" />
                )}
                <span className="font-semibold text-foreground">
                  {option.label}
                </span>
              </div>

              {/* Shade badges */}
              <div className="flex items-center gap-1.5 mb-2">
                {option.shades.map((shade) => (
                  <span
                    key={shade}
                    className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono glow-badge"
                  >
                    {shade}
                  </span>
                ))}
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground/70 mb-3">
                {option.description}
              </p>

              {/* Credit cost */}
              <div className="flex items-center gap-1 text-xs">
                <Zap className="w-3 h-3 text-primary" />
                <span className="text-muted-foreground">
                  {option.extraCredits === 0
                    ? '0 creditos extra'
                    : `+${option.extraCredits} credito extra`}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Credit cost disclosure */}
      <div className="glass-panel rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            Custo do caso
          </span>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              {whiteningLevel === 'hollywood' ? '3' : '2'} creditos
            </span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {creditsRemaining} creditos restantes no seu plano
        </div>
        <div className="w-full bg-muted rounded-full h-1.5">
          <div
            className="bg-primary rounded-full h-1.5 transition-all"
            style={{
              width: `${Math.min(100, (creditsRemaining / 20) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Info callout */}
      <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
        <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          O nivel de clareamento afeta as cores sugeridas nos protocolos de resina
          e na simulacao DSD.
        </p>
      </div>
    </div>
  )
}
