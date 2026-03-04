/** Billing cycle */
export type BillingCycle = 'monthly' | 'annual'

/** Pricing feature row */
export interface PricingFeatureRow {
  id: string
  label: string
}

/** Plan with full pricing details */
export interface PricingPlanFull {
  id: string
  name: string
  description: string
  price_monthly: number
  price_annual: number
  credits: number
  popular: boolean
  features: PricingPlanFeature[]
}

/** Plan feature value (string = included with label, false = not included) */
export interface PricingPlanFeature {
  featureId: string
  value: string | false
}
