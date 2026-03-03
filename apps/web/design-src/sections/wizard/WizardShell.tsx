import '../../preview-theme.css'
import { Zap } from 'lucide-react'
import WizardSidebar from './WizardSidebar'
import type { WizardStep } from '../../../design/sections/wizard/types'
import sampleData from '../../../design/sections/wizard/data.json'

const DEFAULT_STEPS = sampleData.steps.full as WizardStep[]

interface WizardShellProps {
  children: React.ReactNode
  steps?: WizardStep[]
  currentStep?: number
  stepDirection?: 'forward' | 'backward'
  onGoToStep?: (step: number) => void
  onNext?: () => void
  onBack?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  showFooter?: boolean
  creditsRemaining?: number
}

export default function WizardShell({
  children,
  steps = DEFAULT_STEPS,
  currentStep = 1,
  stepDirection = 'forward',
  onGoToStep = () => {},
  onNext = () => {},
  onBack = () => {},
  nextLabel = 'Continuar',
  nextDisabled = false,
  showFooter = true,
  creditsRemaining = 12,
}: WizardShellProps) {
  const currentStepData = steps.find(s => s.id === currentStep)
  const stepIndex = steps.findIndex(s => s.id === currentStep) + 1

  return (
    <div className="wizard-layout section-glow-bg">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb glow-orb-slow w-48 h-48 bg-primary/10 top-20 right-10" />
        <div className="glow-orb glow-orb-reverse w-36 h-36 bg-accent/8 bottom-32 left-10" />
        <div
          className="ai-grid-pattern absolute inset-0 opacity-30"
          style={{
            maskImage:
              'radial-gradient(ellipse 60% 50% at 50% 30%, black, transparent)',
          }}
        />
      </div>

      {/* Desktop sidebar */}
      <WizardSidebar
        steps={steps}
        currentStep={currentStep}
        onGoToStep={onGoToStep}
        creditsRemaining={creditsRemaining}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col relative">
        {/* Mobile header - hidden on md+ */}
        <div className="md:hidden wizard-mobile-header">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {currentStepData?.label ?? `Passo ${currentStep}`}
              </p>
              <p className="text-xs text-muted-foreground">
                Passo {stepIndex} de {steps.length}
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="w-3 h-3" /> {creditsRemaining}
            </div>
          </div>
          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mt-2">
            {steps.map(step => {
              const isActive = step.id === currentStep
              const isCompleted = step.id < currentStep
              return (
                <div
                  key={step.id}
                  className={`rounded-full transition-all ${
                    isActive
                      ? 'w-6 h-2 bg-primary'
                      : isCompleted
                      ? 'w-2 h-2 bg-primary/60'
                      : 'w-2 h-2 bg-muted/30'
                  }`}
                />
              )
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 flex justify-center px-4 py-8">
          <div
            className={`w-full max-w-2xl ${
              stepDirection === 'forward'
                ? 'wizard-step-forward'
                : 'wizard-step-backward'
            }`}
            key={currentStep}
          >
            {children}
          </div>
        </div>

        {/* Footer navigation */}
        {showFooter && (
          <div className="wizard-nav-sticky py-3 px-4">
            <div className="max-w-2xl mx-auto flex justify-between gap-2">
              {currentStep > 1 ? (
                <button
                  onClick={onBack}
                  className="px-4 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors btn-press focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Voltar
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={onNext}
                disabled={nextDisabled}
                className={`px-6 py-2.5 rounded-xl text-sm font-medium btn-press transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  nextDisabled
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground btn-glow'
                }`}
              >
                {nextLabel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
