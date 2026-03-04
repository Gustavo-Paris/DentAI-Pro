/** Landing page stat */
export interface LandingStat {
  value: string
  label: string
}

/** Landing feature card */
export interface LandingFeature {
  icon: string
  title: string
  description: string
}

/** How-it-works step */
export interface LandingStep {
  number: string
  title: string
  description: string
}

/** Testimonial */
export interface LandingTestimonial {
  name: string
  role: string
  clinic: string
  quote: string
  rating: number
  highlight?: string
}

/** FAQ item */
export interface LandingFAQ {
  question: string
  answer: string
}

/** Pricing plan */
export interface LandingPlan {
  name: string
  price: string
  credits: string
  popular: boolean
  features: string[]
}
