import type React from 'react'
import { ChevronDown } from 'lucide-react'
import type { LandingFAQ as LandingFAQType } from '../../../../design/sections/landing/types'

export interface LandingFAQProps {
  faqs: LandingFAQType[]
  openIndex: number | null
  onToggle?: (index: number) => void
  heading?: string
}

export const LandingFAQ: React.FC<LandingFAQProps> = ({
  faqs,
  openIndex,
  onToggle,
  heading = 'Perguntas frequentes',
}) => (
  <section className="px-6 py-20">
    <div className="max-w-3xl mx-auto space-y-10">
      <div className="text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-heading">
          {heading}
        </h2>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden divide-y divide-border/50">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i
          return (
            <div key={i}>
              <button
                onClick={() => onToggle?.(i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-muted/30 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-semibold text-foreground pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  isOpen ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-6 pb-5">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  </section>
)
