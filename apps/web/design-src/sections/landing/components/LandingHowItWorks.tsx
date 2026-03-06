import type React from 'react'
import type { LandingStep } from '../../../../design/sections/landing/types'

export interface LandingHowItWorksProps {
  steps: LandingStep[]
  heading?: string
  subheading?: string
}

export const LandingHowItWorks: React.FC<LandingHowItWorksProps> = ({
  steps,
  heading = 'Como funciona',
  subheading = '4 passos simples para seu protocolo personalizado',
}) => (
  <section className="px-6 py-20">
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold text-heading">
          {heading}
        </h2>
        <p className="text-muted-foreground text-lg">{subheading}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {steps.map((step, i) => (
          <div
            key={i}
            className="group glass-panel rounded-2xl p-6 space-y-4 hover:shadow-md transition-all duration-300 relative overflow-hidden"
          >
            {/* Step number background */}
            <div className="pointer-events-none absolute -top-4 -right-2 text-[6rem] font-black text-primary/[0.04] leading-none select-none">
              {step.number}
            </div>

            <div className="relative flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0 shadow-md">
                {step.number}
              </div>
              <div className="space-y-1.5 pt-1">
                <h3 className="font-semibold text-foreground text-base">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>

            {/* Connector line for vertical flow (mobile) */}
            {i < steps.length - 1 && (
              <div className="hidden sm:block absolute -bottom-3 left-[2.25rem] w-px h-6 bg-gradient-to-b from-primary/30 to-transparent" />
            )}
          </div>
        ))}
      </div>
    </div>
  </section>
)
