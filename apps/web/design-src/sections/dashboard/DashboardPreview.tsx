import '../../preview-theme.css'
import { useState } from 'react'
import { Sun, Moon, CloudSun, Zap } from 'lucide-react'
import PrincipalTab from './PrincipalTab'
import CasosTab from './CasosTab'
import InsightsTab from './InsightsTab'
import type { DashboardTab } from '../../../design/sections/dashboard/types'
import sampleData from '../../../design/sections/dashboard/data.json'

export default function DashboardPreview() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('principal')

  // Time-based greeting (use afternoon for prototype)
  const greetingIcon = <CloudSun className="w-5 h-5 text-warning" />
  const greeting = `Boa tarde, ${sampleData.profile.firstName}`

  const TABS = [
    { key: 'principal' as const, label: 'Principal' },
    { key: 'casos' as const, label: 'Casos' },
    { key: 'insights' as const, label: 'Insights' },
  ]

  return (
    <div className="min-h-screen section-glow-bg">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb glow-orb-slow w-48 h-48 bg-primary/10 top-20 right-10" />
        <div className="glow-orb glow-orb-reverse w-36 h-36 bg-accent/8 bottom-32 left-10" />
      </div>

      {/* Content */}
      <div className="relative max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {greetingIcon}
            <h1 className="text-2xl font-bold text-heading">{greeting}</h1>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground glass-panel rounded-full px-3 py-1.5">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-medium">{sampleData.profile.creditsRemaining}</span>
            <span className="hidden sm:inline">creditos</span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="wizard-tabs">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`wizard-tab ${activeTab === tab.key ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'principal' && <PrincipalTab />}
        {activeTab === 'casos' && <CasosTab />}
        {activeTab === 'insights' && <InsightsTab />}
      </div>
    </div>
  )
}
