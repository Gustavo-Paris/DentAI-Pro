import '../../preview-theme.css'
import { useState } from 'react'
import { Sparkles, Sun, Star, Check, Info, Zap } from 'lucide-react'
import type { WhiteningLevel } from '../../../design/sections/wizard/types'
import sampleData from '../../../design/sections/wizard/data.json'

interface PreferencesStepProps {
  whiteningLevel?: WhiteningLevel | null
  onSetWhiteningLevel?: (level: WhiteningLevel) => void
}

export default function PreferencesStep({
  whiteningLevel,
  onSetWhiteningLevel,
}: PreferencesStepProps) {
  const [internalLevel, setInternalLevel] = useState<WhiteningLevel | null>('natural')
  const level = whiteningLevel !== undefined ? whiteningLevel : internalLevel
  const setLevel = onSetWhiteningLevel ?? ((l: WhiteningLevel) => setInternalLevel(l))

  const options = sampleData.whiteningLevels

  return (
    <div className="wizard-stage space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 glow-icon">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-heading neon-text">Preferências</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Escolha o nível de clareamento desejado para o paciente
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((option) => {
          const isSelected = level === option.key

          return (
            <button
              key={option.key}
              onClick={() => setLevel(option.key as WhiteningLevel)}
              className={`relative rounded-xl border-2 p-5 text-left transition-all ${
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
                    ? 'bg-gradient-to-r from-amber-200 to-amber-100'
                    : 'bg-gradient-to-r from-background to-primary/10'
                }`}
              />

              {/* Icon + label */}
              <div className="flex items-center gap-2 mb-2">
                {option.key === 'natural' ? (
                  <Sun className="w-5 h-5 text-amber-500" />
                ) : (
                  <Star className="w-5 h-5 text-primary" />
                )}
                <span className="font-semibold">{option.label}</span>
              </div>

              {/* Shade example */}
              <p className="text-sm text-muted-foreground mb-1">
                Tons {option.shades.join('/')}
              </p>

              {/* Description */}
              <p className="text-xs text-muted-foreground/70 mb-3">
                {option.description}
              </p>

              {/* Credit cost */}
              <div className="flex items-center gap-1 text-xs">
                <Zap className="w-3 h-3 text-primary" />
                <span className="text-muted-foreground">
                  {option.key === 'natural' ? '0 créditos extra' : '+1 crédito extra'}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Info callout */}
      <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
        <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          O nível de clareamento afeta as cores sugeridas nos protocolos de resina e na simulação DSD.
        </p>
      </div>
    </div>
  )
}
