import type React from 'react'
import type { BillingCycle } from '../../../../design/sections/pricing/types'

export interface PricingHeaderProps {
  heading?: string
  subheading?: string
  cycle: BillingCycle
  discountPercent?: number
  onCycleChange?: (cycle: BillingCycle) => void
}

export const PricingHeader: React.FC<PricingHeaderProps> = ({
  heading = 'Planos e Precos',
  subheading = 'Comece gratuitamente e faca upgrade quando precisar',
  cycle,
  discountPercent = 16,
  onCycleChange,
}) => (
  <div className="space-y-8">
    {/* Title */}
    <div className="text-center space-y-3">
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-heading">
        {heading}
      </h1>
      <p className="text-muted-foreground text-lg max-w-lg mx-auto">
        {subheading}
      </p>
    </div>

    {/* Billing toggle */}
    <div className="flex justify-center">
      <div className="glass-panel rounded-xl p-1 inline-flex gap-1 items-center">
        <button
          onClick={() => onCycleChange?.('monthly')}
          className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring ${
            cycle === 'monthly'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Mensal
        </button>
        <button
          onClick={() => onCycleChange?.('annual')}
          className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring ${
            cycle === 'annual'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Anual
        </button>
        {cycle === 'annual' && (
          <span className="text-xs rounded-full bg-success/15 text-success px-3 py-1 font-semibold ml-1">
            -{discountPercent}%
          </span>
        )}
      </div>
    </div>
  </div>
)
