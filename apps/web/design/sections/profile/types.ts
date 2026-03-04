/** Profile tab ID */
export type ProfileTabId = 'perfil' | 'assinatura' | 'faturas' | 'privacidade'

/** User profile data */
export interface UserProfile {
  full_name: string
  cro: string | null
  clinic_name: string | null
  phone: string | null
  avatar_url: string | null
  clinic_logo_url: string | null
}

/** Subscription info */
export interface SubscriptionInfo {
  plan_name: string
  price: number
  status: 'active' | 'trialing' | 'canceled' | 'inactive'
  next_billing_date: string | null
  credits_used: number
  credits_total: number
  rollover_credits: number
}

/** Credit pack option */
export interface CreditPack {
  id: string
  credits: number
  price: number
  popular: boolean
}

/** Payment record */
export interface PaymentRecord {
  id: string
  amount: number
  description: string
  status: 'succeeded' | 'failed' | 'pending' | 'refunded'
  created_at: string
  invoice_url: string | null
}

/** Referral info */
export interface ReferralInfo {
  code: string
  total_referrals: number
  credits_earned: number
}
