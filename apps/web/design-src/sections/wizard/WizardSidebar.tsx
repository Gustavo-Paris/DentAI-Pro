import '../../preview-theme.css'
import { Check, Camera, Heart, Brain, Smile, ClipboardCheck, FileText, Zap } from 'lucide-react'
import type { WizardStep } from '../../../design/sections/wizard/types'
import sampleData from '../../../design/sections/wizard/data.json'

const DEFAULT_STEPS = sampleData.steps.full as WizardStep[]

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Camera,
  Heart,
  Brain,
  Smile,
  ClipboardCheck,
  FileText,
}

interface WizardSidebarProps {
  steps?: WizardStep[]
  currentStep?: number
  onGoToStep?: (step: number) => void
  creditsRemaining?: number
  planName?: string
}

export default function WizardSidebar({
  steps = DEFAULT_STEPS,
  currentStep = 3,
  onGoToStep = () => {},
  creditsRemaining = 12,
  planName = 'Pro',
}: WizardSidebarProps) {
  return (
    <div className="wizard-sidebar flex flex-col h-full">
      {steps.map((step, i) => {
        const isCompleted = step.id < currentStep
        const isActive = step.id === currentStep
        const Icon = ICON_MAP[step.icon]

        return (
          <div key={step.id}>
            {/* Vertical connector */}
            {i > 0 && (
              <div
                className={`stepper-connector-v ${isCompleted ? 'completed' : ''}`}
              />
            )}

            {/* Step row */}
            <div
              className={`flex items-center gap-3 ${isCompleted ? 'cursor-pointer' : ''}`}
              onClick={() => isCompleted && onGoToStep(step.id)}
            >
              {/* Circle */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isCompleted
                    ? 'bg-primary text-primary-foreground cursor-pointer'
                    : isActive
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary/20 ring-offset-2 ring-offset-background'
                    : 'bg-muted text-muted-foreground cursor-default'
                }`}
                style={{ width: 36, height: 36 }}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : Icon ? (
                  <Icon className="w-4 h-4" />
                ) : (
                  step.id
                )}
              </div>

              {/* Label */}
              <span
                className={
                  isActive
                    ? 'text-sm font-medium text-foreground'
                    : isCompleted
                    ? 'text-sm text-foreground/70'
                    : 'text-sm text-muted-foreground'
                }
              >
                {step.label}
              </span>
            </div>
          </div>
        )
      })}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Credit card */}
      <div className="glass-panel rounded-xl p-3 space-y-1">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{creditsRemaining} créditos</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Plano {planName}
        </div>
      </div>
    </div>
  )
}
