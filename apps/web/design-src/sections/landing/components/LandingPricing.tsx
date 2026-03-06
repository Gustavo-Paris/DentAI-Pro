import type React from 'react'
import { Check } from 'lucide-react'
import type { LandingPlan } from '../../../../design/sections/landing/types'

export interface LandingPricingProps {
  plans: LandingPlan[]
  heading?: string
  subheading?: string
  footerNote?: string
  onSelectPlan?: (planName: string) => void
}

export const LandingPricing: React.FC<LandingPricingProps> = ({
  plans,
  heading = 'Planos e precos',
  subheading = 'Comece gratuitamente e faca upgrade quando precisar',
  footerNote = '1 credito = 1 analise | 2 creditos = 1 simulacao DSD',
  onSelectPlan,
}) => (
  <section className="px-6 py-20" id="pricing">
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="text-center space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold text-heading">
          {heading}
        </h2>
        <p className="text-muted-foreground text-lg">{subheading}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
        {plans.map((plan, i) => (
          <div
            key={i}
            className={`glass-panel rounded-2xl p-6 space-y-5 relative ${
              plan.popular
                ? 'ai-shimmer-border sm:scale-105 z-10'
                : 'hover:shadow-md transition-all duration-300'
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs rounded-full bg-primary text-primary-foreground px-4 py-1 font-semibold whitespace-nowrap shadow-md">
                Mais Popular
              </span>
            )}

            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">
                {plan.name}
              </h3>
              <p className="text-3xl font-bold text-foreground">{plan.price}</p>
            </div>

            <span className="inline-block text-xs rounded-full bg-primary/10 text-primary px-3 py-1 font-medium">
              {plan.credits} creditos
            </span>

            <ul className="space-y-2.5">
              {plan.features.map((f, fi) => (
                <li
                  key={fi}
                  className="flex items-start gap-2.5 text-sm text-muted-foreground"
                >
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => onSelectPlan?.(plan.name)}
              className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                plan.popular
                  ? 'bg-primary text-primary-foreground btn-press btn-glow shadow-md'
                  : 'glass-panel hover:bg-muted text-foreground'
              }`}
            >
              {plan.price === 'Gratis' ? 'Comecar Gratis' : 'Comecar'}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">{footerNote}</p>
    </div>
  </section>
)
