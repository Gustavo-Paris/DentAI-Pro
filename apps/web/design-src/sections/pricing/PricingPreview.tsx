import '../../preview-theme.css'
import { useState } from 'react'
import { Check, Minus } from 'lucide-react'
import type {
  BillingCycle,
  PricingPlanFull,
  PricingFeatureRow,
} from '../../../design/sections/pricing/types'
import mockData from '../../../design/sections/pricing/data.json'

function formatPrice(cents: number): string {
  if (cents === 0) return 'Gratis'
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`
}

export default function PricingPreview() {
  const [cycle, setCycle] = useState<BillingCycle>('monthly')
  const plans = mockData.plans as PricingPlanFull[]
  const featureRows = mockData.featureRows as PricingFeatureRow[]
  const discountPercent = mockData.discountPercent as number

  return (
    <div className="section-glow-bg relative min-h-screen p-6 sm:p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="glow-orb glow-orb-1" />
        <div className="glow-orb glow-orb-2" />
        <div className="glow-orb glow-orb-3" />
      </div>

      <div className="relative space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-heading">
            Planos e Precos
          </h1>
          <p className="text-muted-foreground">
            Comece gratuitamente e faca upgrade quando precisar
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center">
          <div className="glass-panel rounded-xl p-1 inline-flex gap-1 items-center">
            <button
              onClick={() => setCycle('monthly')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                cycle === 'monthly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setCycle('annual')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                cycle === 'annual'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Anual
            </button>
            {cycle === 'annual' && (
              <span className="text-xs rounded-full bg-success/10 text-success px-2.5 py-1 font-medium ml-1">
                -{discountPercent}%
              </span>
            )}
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const price =
              cycle === 'monthly' ? plan.price_monthly : plan.price_annual
            const includedFeatures = plan.features.filter(
              (f) => f.value !== false,
            )
            return (
              <div
                key={plan.id}
                className={`glass-panel rounded-xl p-6 space-y-5 ${
                  plan.popular
                    ? 'ai-shimmer-border scale-105 relative'
                    : 'hover:shadow-md transition-shadow'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs rounded-full bg-primary text-primary-foreground px-3 py-1 font-medium whitespace-nowrap">
                    Mais Popular
                  </span>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {plan.description}
                  </p>
                </div>

                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {formatPrice(price)}
                  </p>
                  {price > 0 && (
                    <p className="text-xs text-muted-foreground">
                      /
                      {cycle === 'monthly'
                        ? 'mes'
                        : 'mes (cobrado anualmente)'}
                    </p>
                  )}
                </div>

                <span className="inline-block text-xs rounded-full bg-primary/10 text-primary px-2.5 py-1 font-medium">
                  {plan.credits} creditos/mes
                </span>

                <ul className="space-y-2">
                  {includedFeatures.slice(0, 6).map((f) => (
                    <li
                      key={f.featureId}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {f.value}
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                    plan.popular
                      ? 'bg-primary text-primary-foreground btn-press btn-glow'
                      : price === 0
                        ? 'glass-panel hover:bg-muted text-foreground'
                        : 'bg-primary text-primary-foreground btn-press transition-colors'
                  }`}
                >
                  {price === 0
                    ? 'Comecar Gratis'
                    : plan.popular
                      ? 'Comecar Agora'
                      : 'Assinar'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-center">
            Comparacao de Recursos
          </h2>
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 min-w-[200px]">
                      Recurso
                    </th>
                    {plans.map((plan) => (
                      <th
                        key={plan.id}
                        className={`text-center font-semibold px-4 py-3 min-w-[120px] ${
                          plan.popular ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {featureRows.map((row, ri) => (
                    <tr
                      key={row.id}
                      className={`border-b border-border/50 ${
                        ri % 2 === 0 ? '' : 'bg-muted/30'
                      }`}
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.label}
                      </td>
                      {plans.map((plan) => {
                        const feat = plan.features.find(
                          (f) => f.featureId === row.id,
                        )
                        const val = feat?.value
                        return (
                          <td key={plan.id} className="px-4 py-3 text-center">
                            {val === false || !val ? (
                              <Minus className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                            ) : typeof val === 'string' &&
                              (val === row.label || val.length > 20) ? (
                              <Check className="h-4 w-4 text-primary mx-auto" />
                            ) : (
                              <span className="text-foreground text-xs font-medium">
                                {val}
                              </span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center space-y-2">
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
