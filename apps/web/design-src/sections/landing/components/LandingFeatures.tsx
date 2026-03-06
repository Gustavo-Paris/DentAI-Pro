import type React from 'react'
import {
  Camera,
  Smile,
  Layers,
  FileText,
} from 'lucide-react'
import type { LandingFeature } from '../../../../design/sections/landing/types'

const ICON_MAP: Record<string, React.ElementType> = {
  Camera,
  Smile,
  Layers,
  FileText,
}

export interface LandingFeaturesProps {
  features: LandingFeature[]
  heading?: string
  subheading?: string
}

export const LandingFeatures: React.FC<LandingFeaturesProps> = ({
  features,
  heading = 'Tudo que voce precisa em um so lugar',
  subheading = 'Ferramentas completas para odontologia estetica com IA',
}) => (
  <section className="px-6 py-20">
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="text-center space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold text-heading">
          {heading}
        </h2>
        <p className="text-muted-foreground text-lg">{subheading}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feat, i) => {
          const Icon = ICON_MAP[feat.icon] || FileText
          return (
            <div
              key={i}
              className="group glass-panel rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 cursor-pointer space-y-4 relative overflow-hidden"
            >
              {/* Hover glow effect */}
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div
                  className="absolute -top-12 -right-12 w-32 h-32 rounded-full"
                  style={{
                    background:
                      'radial-gradient(circle, rgb(var(--color-primary-rgb) / 0.08) 0%, transparent 70%)',
                  }}
                />
              </div>

              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center glow-icon">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold text-foreground text-base relative">
                {feat.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed relative">
                {feat.description}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  </section>
)
