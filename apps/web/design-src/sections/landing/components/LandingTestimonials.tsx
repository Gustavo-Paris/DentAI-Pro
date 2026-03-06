import type React from 'react'
import { Star, Zap } from 'lucide-react'
import type { LandingTestimonial } from '../../../../design/sections/landing/types'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export interface LandingTestimonialsProps {
  testimonials: LandingTestimonial[]
  heading?: string
  subheading?: string
}

export const LandingTestimonials: React.FC<LandingTestimonialsProps> = ({
  testimonials,
  heading = 'O que dizem os dentistas',
  subheading = 'Profissionais que ja usam a plataforma',
}) => (
  <section className="px-6 py-20">
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="text-center space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold text-heading">
          {heading}
        </h2>
        <p className="text-muted-foreground text-lg">{subheading}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testimonials.map((t, i) => (
          <div
            key={i}
            className="group glass-panel rounded-2xl p-6 space-y-4 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
          >
            {/* Accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/60 to-transparent rounded-l-2xl" />

            {/* Stars + highlight */}
            <div className="flex items-center gap-1 pl-2">
              {Array.from({ length: 5 }, (_, si) => (
                <Star
                  key={si}
                  className={`h-4 w-4 ${
                    si < t.rating
                      ? 'fill-primary text-primary'
                      : 'text-muted-foreground/30'
                  }`}
                />
              ))}
              {t.highlight && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs rounded-full bg-primary/10 text-primary px-2.5 py-0.5 font-medium glow-badge">
                  <Zap className="h-3 w-3" />
                  {t.highlight}
                </span>
              )}
            </div>

            {/* Quote */}
            <blockquote className="text-sm text-foreground leading-relaxed pl-2">
              &ldquo;{t.quote}&rdquo;
            </blockquote>

            {/* Author */}
            <div className="flex items-center gap-3 pl-2 pt-1">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold ring-2 ring-primary/20">
                {getInitials(t.name)}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.role} &middot; {t.clinic}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
)
