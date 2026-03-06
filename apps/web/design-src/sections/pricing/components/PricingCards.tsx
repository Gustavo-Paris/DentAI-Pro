import type React from 'react'
import { Check, ArrowRight } from 'lucide-react'
import type {
  BillingCycle,
  PricingPlanFull,
} from '../../../../design/sections/pricing/types'

function formatPrice(cents: number): string {
  if (cents === 0) return 'Gratis'
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`
}

export interface PricingCardsProps {
  plans: PricingPlanFull[]
  cycle: BillingCycle
  onSelectPlan?: (planId: string) => void
}

export const PricingCards: React.FC<PricingCardsProps> = ({
  plans,
  cycle,
  onSelectPlan,
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
    {plans.map((plan) => {
      const price =
        cycle === 'monthly' ? plan.price_monthly : plan.price_annual
      const includedFeatures = plan.features.filter((f) => f.value !== false)

      return (
        <div
          key={plan.id}
          className={`glass-panel rounded-2xl p-6 space-y-5 relative transition-all duration-300 ${
            plan.popular
              ? 'ai-shimmer-border sm:scale-105 z-10'
              : 'hover:shadow-lg hover:-translate-y-1'
          }`}
        >
          {plan.popular && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs rounded-full bg-primary text-primary-foreground px-4 py-1 font-semibold whitespace-nowrap shadow-md">
              Mais Popular
            </span>
          )}

          {/* Plan name + description */}
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">
              {plan.name}
            </h3>
            <p className="text-xs text-muted-foreground">{plan.description}</p>
          </div>

          {/* Price */}
          <div>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-bold text-foreground">
                {formatPrice(price)}
              </p>
              {price > 0 && (
                <span className="text-sm text-muted-foreground">/mes</span>
              )}
            </div>
            {price > 0 && cycle === 'annual' && (
              <p className="text-xs text-muted-foreground mt-0.5">
                cobrado anualmente
              </p>
            )}
          </div>

          {/* Credits badge */}
          <span className="inline-block text-xs rounded-full bg-primary/10 text-primary px-3 py-1 font-medium">
            {plan.credits} creditos/mes
          </span>

          {/* Features */}
          <ul className="space-y-2.5">
            {includedFeatures.slice(0, 6).map((f) => (
              <li
                key={f.featureId}
                className="flex items-start gap-2.5 text-sm text-muted-foreground"
              >
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{f.value}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            onClick={() => onSelectPlan?.(plan.id)}
            className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring inline-flex items-center justify-center gap-2 ${
              plan.popular
                ? 'bg-primary text-primary-foreground btn-press btn-glow shadow-md'
                : price === 0
                  ? 'glass-panel hover:bg-muted text-foreground'
                  : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'
            }`}
          >
            {price === 0 ? 'Comecar Gratis' : plan.popular ? 'Comecar Agora' : 'Assinar'}
            {plan.popular && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      )
    })}
  </div>
)
