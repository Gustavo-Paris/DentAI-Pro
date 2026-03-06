import type React from 'react'
import { Sparkles, Check } from 'lucide-react'

export interface LandingCTAProps {
  heading?: string
  description?: string
  benefits?: string[]
  ctaLabel?: string
  onCtaClick?: () => void
}

export const LandingCTA: React.FC<LandingCTAProps> = ({
  heading = 'Veja a IA em acao com seu proprio caso',
  description = 'Crie sua conta, tire uma foto e receba um protocolo completo em menos de 2 minutos.',
  benefits = [
    'Analise visual com IA',
    'Protocolo personalizado',
    'Resultado em minutos',
  ],
  ctaLabel = 'Criar Conta Gratuita',
  onCtaClick,
}) => (
  <section className="px-6 py-20 relative overflow-hidden">
    {/* Background gradient */}
    <div className="pointer-events-none absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 50%, rgb(var(--color-primary-rgb) / 0.06) 0%, transparent 70%)',
        }}
      />
    </div>

    <div className="relative max-w-3xl mx-auto">
      <div className="glass-panel rounded-2xl p-8 sm:p-12 text-center space-y-6 ai-glow">
        <h2 className="text-3xl sm:text-4xl font-bold text-heading">
          {heading}
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          {description}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
          {benefits.map((b, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 text-sm text-foreground font-medium"
            >
              <Check className="h-4 w-4 text-primary" />
              {b}
            </span>
          ))}
        </div>

        <button
          onClick={() => onCtaClick?.()}
          className="bg-primary text-primary-foreground rounded-xl px-8 py-3.5 text-base font-semibold btn-press btn-glow transition-colors focus-visible:ring-2 focus-visible:ring-ring inline-flex items-center gap-2.5 shadow-lg"
        >
          <Sparkles className="h-5 w-5" />
          {ctaLabel}
        </button>
      </div>
    </div>
  </section>
)
