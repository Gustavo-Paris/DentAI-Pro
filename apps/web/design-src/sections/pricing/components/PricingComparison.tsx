import type React from 'react'
import { Check, Minus } from 'lucide-react'
import type {
  PricingPlanFull,
  PricingFeatureRow,
} from '../../../../design/sections/pricing/types'

export interface PricingComparisonProps {
  plans: PricingPlanFull[]
  featureRows: PricingFeatureRow[]
}

export const PricingComparison: React.FC<PricingComparisonProps> = ({
  plans,
  featureRows,
}) => (
  <div className="space-y-6">
    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-center">
      Comparacao de Recursos
    </h2>

    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left font-medium text-muted-foreground px-5 py-4 min-w-[200px]">
                Recurso
              </th>
              {plans.map((plan) => (
                <th
                  key={plan.id}
                  className={`text-center font-semibold px-4 py-4 min-w-[120px] ${
                    plan.popular ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span>{plan.name}</span>
                    {plan.popular && (
                      <div className="w-full h-0.5 bg-primary/30 rounded-full" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {featureRows.map((row, ri) => (
              <tr
                key={row.id}
                className={`border-b border-border/30 transition-colors hover:bg-muted/20 ${
                  ri % 2 === 0 ? '' : 'bg-muted/10'
                }`}
              >
                <td className="px-5 py-3.5 text-muted-foreground font-medium">
                  {row.label}
                </td>
                {plans.map((plan) => {
                  const feat = plan.features.find(
                    (f) => f.featureId === row.id,
                  )
                  const val = feat?.value
                  return (
                    <td
                      key={plan.id}
                      className={`px-4 py-3.5 text-center ${
                        plan.popular ? 'bg-primary/[0.02]' : ''
                      }`}
                    >
                      {val === false || !val ? (
                        <Minus className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                      ) : typeof val === 'string' &&
                        (val === row.label || val.length > 20) ? (
                        <Check className="h-4 w-4 text-primary mx-auto" />
                      ) : (
                        <span className="text-foreground text-xs font-semibold">
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
)
