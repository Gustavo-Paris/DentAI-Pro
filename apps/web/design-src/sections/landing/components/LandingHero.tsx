import type React from 'react'
import { Sparkles } from 'lucide-react'

export interface LandingHeroProps {
  badge?: string
  headline?: string
  highlightWord?: string
  subtitle?: string
  ctaLabel?: string
  ctaSubtext?: string
  onCtaClick?: () => void
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  badge = 'Inteligencia Clinica Estetica',
  headline = 'Odontologia estetica inteligente com IA',
  highlightWord = 'inteligente',
  subtitle = 'IA que analisa, planeja e gera protocolos personalizados com precisao.',
  ctaLabel = 'Testar Gratis em 2 Minutos',
  ctaSubtext = 'Sem cartao de credito. 3 creditos gratis.',
  onCtaClick,
}) => {
  // Split headline around the highlight word
  const parts = headline.split(highlightWord)

  return (
    <section className="relative px-6 py-20 sm:py-28 overflow-hidden">
      {/* Animated gradient mesh background */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-30"
          style={{
            background:
              'radial-gradient(circle, rgb(var(--color-primary-rgb) / 0.15) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-20"
          style={{
            background:
              'radial-gradient(circle, rgb(var(--accent-violet-rgb) / 0.12) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Floating dental elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute top-16 right-[15%] w-3 h-3 rounded-full bg-primary/20"
          style={{ animation: 'float 4s ease-in-out infinite' }}
        />
        <div
          className="absolute top-32 left-[10%] w-2 h-2 rounded-full bg-accent/25"
          style={{ animation: 'float 5s ease-in-out infinite 1s' }}
        />
        <div
          className="absolute bottom-20 right-[20%] w-4 h-4 rounded-full bg-primary/15"
          style={{ animation: 'float 6s ease-in-out infinite 0.5s' }}
        />
        <div
          className="absolute top-40 left-[25%] w-2.5 h-2.5 rounded-full bg-accent/20"
          style={{ animation: 'float 4.5s ease-in-out infinite 2s' }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto text-center space-y-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary glow-badge">
          <Sparkles className="h-4 w-4" />
          {badge}
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-heading leading-tight">
          {parts.length > 1 ? (
            <>
              {parts[0]}
              <span className="ai-text">{highlightWord}</span>
              {parts[1]}
            </>
          ) : (
            headline
          )}
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>

        {/* CTA */}
        <div className="space-y-4">
          <button
            onClick={() => onCtaClick?.()}
            className="bg-primary text-primary-foreground rounded-xl px-8 py-3.5 text-base font-semibold btn-press btn-glow transition-colors focus-visible:ring-2 focus-visible:ring-ring inline-flex items-center gap-2.5 shadow-lg"
          >
            <Sparkles className="h-5 w-5" />
            {ctaLabel}
          </button>
          <p className="text-sm text-muted-foreground">{ctaSubtext}</p>
        </div>
      </div>
    </section>
  )
}
