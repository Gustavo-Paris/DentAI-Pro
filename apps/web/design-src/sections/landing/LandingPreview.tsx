import '../../preview-theme.css'
import { useState } from 'react'
import type {
  LandingStat,
  LandingFeature,
  LandingStep,
  LandingTestimonial,
  LandingFAQ as LandingFAQType,
  LandingPlan,
} from '../../../design/sections/landing/types'
import sampleData from '../../../design/sections/landing/data.json'
import {
  LandingNav,
  LandingHero,
  LandingStats,
  LandingFeatures,
  LandingHowItWorks,
  LandingTestimonials,
  LandingFAQ,
  LandingPricing,
  LandingCTA,
  LandingFooter,
} from './components'

export default function LandingPreview() {
  const stats = sampleData.stats as LandingStat[]
  const features = sampleData.features as LandingFeature[]
  const steps = sampleData.steps as LandingStep[]
  const testimonials = sampleData.testimonials as LandingTestimonial[]
  const faqs = sampleData.faqs as LandingFAQType[]
  const plans = sampleData.plans as LandingPlan[]

  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleFaqToggle = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <div className="section-glow-bg relative min-h-screen">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="glow-orb"
          style={{
            width: 500,
            height: 500,
            top: '5%',
            left: '10%',
            background:
              'radial-gradient(circle, rgb(var(--color-primary-rgb) / 0.12) 0%, transparent 70%)',
          }}
        />
        <div
          className="glow-orb glow-orb-slow"
          style={{
            width: 400,
            height: 400,
            top: '40%',
            right: '5%',
            background:
              'radial-gradient(circle, rgb(var(--accent-violet-rgb) / 0.08) 0%, transparent 70%)',
            animationDelay: '4s',
          }}
        />
        <div
          className="glow-orb glow-orb-reverse"
          style={{
            width: 350,
            height: 350,
            bottom: '10%',
            left: '20%',
            background:
              'radial-gradient(circle, rgb(var(--color-accent-rgb) / 0.06) 0%, transparent 70%)',
            animationDelay: '8s',
          }}
        />
      </div>

      <div className="relative">
        <LandingNav
          onSignIn={() => console.log('sign-in')}
          onGetStarted={() => console.log('get-started')}
        />
        <LandingHero onCtaClick={() => console.log('hero-cta')} />
        <LandingStats stats={stats} />
        <LandingFeatures features={features} />
        <LandingHowItWorks steps={steps} />
        <LandingTestimonials testimonials={testimonials} />
        <LandingFAQ
          faqs={faqs}
          openIndex={openFaq}
          onToggle={handleFaqToggle}
        />
        <LandingPricing
          plans={plans}
          onSelectPlan={(name) => console.log('select-plan', name)}
        />
        <LandingCTA onCtaClick={() => console.log('cta-click')} />
        <LandingFooter
          onTerms={() => console.log('terms')}
          onPrivacy={() => console.log('privacy')}
        />
      </div>
    </div>
  )
}
