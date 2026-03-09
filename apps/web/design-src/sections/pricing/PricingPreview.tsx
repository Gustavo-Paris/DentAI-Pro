/* eslint-disable no-console */
import '../../preview-theme.css'
import { useState } from 'react'
import type {
  BillingCycle,
  PricingPlanFull,
  PricingFeatureRow,
} from '../../../design/sections/pricing/types'
import sampleData from '../../../design/sections/pricing/data.json'
import { PricingHeader, PricingCards, PricingComparison } from './components'

export default function PricingPreview() {
  const [cycle, setCycle] = useState<BillingCycle>('monthly')
  const plans = sampleData.plans as PricingPlanFull[]
  const featureRows = sampleData.featureRows as PricingFeatureRow[]
  const discountPercent = sampleData.discountPercent as number

  return (
    <div className="section-glow-bg relative min-h-screen">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="glow-orb"
          style={{
            width: 450,
            height: 450,
            top: '0%',
            left: '15%',
            background:
              'radial-gradient(circle, rgb(var(--color-primary-rgb) / 0.10) 0%, transparent 70%)',
          }}
        />
        <div
          className="glow-orb glow-orb-slow"
          style={{
            width: 350,
            height: 350,
            top: '50%',
            right: '10%',
            background:
              'radial-gradient(circle, rgb(var(--accent-violet-rgb) / 0.07) 0%, transparent 70%)',
            animationDelay: '5s',
          }}
        />
        <div
          className="glow-orb glow-orb-reverse"
          style={{
            width: 300,
            height: 300,
            bottom: '5%',
            left: '30%',
            background:
              'radial-gradient(circle, rgb(var(--color-accent-rgb) / 0.05) 0%, transparent 70%)',
            animationDelay: '10s',
          }}
        />
      </div>

      <div className="relative px-6 py-12 sm:py-16 space-y-12 max-w-6xl mx-auto">
        <PricingHeader
          cycle={cycle}
          discountPercent={discountPercent}
          onCycleChange={setCycle}
        />

        <PricingCards
          plans={plans}
          cycle={cycle}
          onSelectPlan={(id) => console.log('select-plan', id)}
        />

        <PricingComparison plans={plans} featureRows={featureRows} />

        {/* Footer notes */}
        <div className="text-center space-y-2 pt-4">
          <p className="text-xs text-muted-foreground">
            1 credito = 1 analise | 2 creditos = 1 simulacao DSD
          </p>
          <p className="text-xs text-muted-foreground">
            Todos os planos incluem 7 dias de garantia. Cancele a qualquer
            momento.
          </p>
        </div>
      </div>
    </div>
  )
}
