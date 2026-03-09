/* eslint-disable no-console */
import '../../preview-theme.css'
import { useState } from 'react'
import { CloudSun, Zap } from 'lucide-react'
import { PrincipalTab, CasosTab, InsightsTab } from './components'
import type {
  DashboardTab,
  DashboardSession,
  DraftInfo,
  ClinicalInsights,
  WeeklyTrendPoint,
} from '../../../design/sections/dashboard/types'
import sampleData from '../../../design/sections/dashboard/data.json'

export default function DashboardPreview() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('principal')

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
        <div className="glow-orb glow-orb-slow" style={{
          width: 380, height: 380, top: '5%', right: '5%',
          background: 'radial-gradient(circle, rgb(var(--color-primary-rgb) / 0.10) 0%, transparent 70%)',
        }} />
        <div className="glow-orb glow-orb-reverse" style={{
          width: 280, height: 280, bottom: '15%', left: '5%',
          background: 'radial-gradient(circle, rgb(var(--color-accent-rgb) / 0.08) 0%, transparent 70%)',
        }} />
        <div className="glow-orb glow-orb-slow" style={{
          width: 320, height: 320, top: '40%', left: '50%',
          background: 'radial-gradient(circle, rgb(var(--accent-violet-rgb) / 0.06) 0%, transparent 70%)',
        }} />
      </div>
      <div className="ai-grid-pattern absolute inset-0 pointer-events-none" />

      {/* Content */}
      <div className="relative max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {greetingIcon}
            <h1 className="text-2xl font-bold text-heading neon-text">{greeting}</h1>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground glass-panel rounded-full px-3 py-1.5">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-medium">
              {sampleData.profile.creditsRemaining}
            </span>
            <span className="hidden sm:inline">creditos</span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="wizard-tabs">
          {TABS.map((tab) => (
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
        {activeTab === 'principal' && (
          <PrincipalTab
            metrics={sampleData.sampleMetrics}
            draft={sampleData.sampleDraft as DraftInfo}
            creditsRemaining={sampleData.profile.creditsRemaining}
            showCreditsBanner
            onNewCase={() => console.log('new case')}
            onContinueDraft={() => console.log('continue draft')}
            onDiscardDraft={() => console.log('discard draft')}
            onNavigatePatients={() => console.log('patients')}
            onNavigateInventory={() => console.log('inventory')}
            onNavigateSettings={() => console.log('settings')}
            onUpgrade={() => console.log('upgrade')}
          />
        )}
        {activeTab === 'casos' && (
          <CasosTab
            sessions={sampleData.sampleSessions as DashboardSession[]}
            draft={sampleData.sampleDraft as DraftInfo}
            totalCases={sampleData.sampleMetrics.totalCases}
            onContinueDraft={() => console.log('continue draft')}
            onDiscardDraft={() => console.log('discard draft')}
            onSelectSession={(id) => console.log('select session', id)}
            onCreateCase={() => console.log('create case')}
          />
        )}
        {activeTab === 'insights' && (
          <InsightsTab
            insights={sampleData.sampleInsights as ClinicalInsights}
            weeklyTrends={sampleData.weeklyTrends as WeeklyTrendPoint[]}
            patientGrowthThisMonth={sampleData.patientGrowth.thisMonth}
            patientGrowthPercent={sampleData.patientGrowth.growthPercent}
            onPeriodChange={(p) => console.log('period', p)}
          />
        )}
      </div>
    </div>
  )
}
