import type React from 'react'
import type { LandingStat } from '../../../../design/sections/landing/types'

export interface LandingStatsProps {
  stats: LandingStat[]
}

export const LandingStats: React.FC<LandingStatsProps> = ({ stats }) => (
  <section className="px-6 py-14">
    <div className="max-w-5xl mx-auto">
      <div className="glass-panel rounded-2xl p-8 sm:p-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center space-y-1.5">
              <p className="text-4xl sm:text-5xl font-bold text-primary neon-text">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
)
