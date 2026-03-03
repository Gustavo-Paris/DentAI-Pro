import '../../preview-theme.css'
import { useState } from 'react'
import WizardShell from './WizardShell'
import PhotoStep from './PhotoStep'
import PreferencesStep from './PreferencesStep'
import AnalyzingStep from './AnalyzingStep'
import DSDStep from './DSDStep'
import ReviewStep from './ReviewStep'
import ResultStep from './ResultStep'
import type { WizardStep, AnalysisResult, TreatmentType, BudgetTier, WhiteningLevel } from '../../../design/sections/wizard/types'
import sampleData from '../../../design/sections/wizard/data.json'

const STEPS: WizardStep[] = sampleData.steps.full as WizardStep[]

const SAMPLE_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUyOTNiIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NDc0OGIiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj5EZW50YWwgUGhvdG88L3RleHQ+PC9zdmc+'

export default function WizardPreview() {
  const [step, setStep] = useState(1)
  const [prevStep, setPrevStep] = useState(1)
  const [hasPhoto, setHasPhoto] = useState(false)
  const [whiteningLevel, setWhiteningLevel] = useState<WhiteningLevel | null>(null)
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>(['11', '21', '12', '14'])
  const [budget, setBudget] = useState<BudgetTier>('padrao')
  const [toothTreatments] = useState<Record<string, TreatmentType>>({
    '11': 'resina',
    '21': 'resina',
    '12': 'resina',
    '14': 'gengivoplastia',
  })

  const analysisResult = sampleData.sampleAnalysis as AnalysisResult
  const stepDirection = step >= prevStep ? 'forward' as const : 'backward' as const

  const goToStep = (target: number) => {
    setPrevStep(step)
    setStep(target)
    if (target > 1) setHasPhoto(true)
  }

  const handleNext = () => {
    if (step < 6) goToStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) goToStep(step - 1)
  }

  const toggleTooth = (tooth: string) => {
    setSelectedTeeth(prev =>
      prev.includes(tooth) ? prev.filter(t => t !== tooth) : [...prev, tooth]
    )
  }

  // Determine next button state
  const nextDisabled = step === 1 && !hasPhoto
  const nextLabel = step === 5 ? 'Criar Caso' : 'Continuar'
  const showFooter = step !== 6

  return (
    <WizardShell
      steps={STEPS}
      currentStep={step}
      stepDirection={stepDirection}
      onGoToStep={goToStep}
      onNext={handleNext}
      onBack={handleBack}
      nextLabel={nextLabel}
      nextDisabled={nextDisabled}
      showFooter={showFooter}
      creditsRemaining={12}
    >
      {step === 1 && (
        <PhotoStep
          imageBase64={hasPhoto ? SAMPLE_IMAGE : null}
          qualityScore={hasPhoto ? 82 : null}
          onUpload={() => setHasPhoto(true)}
          onStartFullCase={() => goToStep(2)}
          onStartQuickCase={() => goToStep(3)}
          onRemovePhoto={() => setHasPhoto(false)}
          creditsRemaining={12}
        />
      )}
      {step === 2 && (
        <PreferencesStep
          whiteningLevel={whiteningLevel}
          onSetWhiteningLevel={setWhiteningLevel}
        />
      )}
      {step === 3 && (
        <AnalyzingStep
          imageBase64={SAMPLE_IMAGE}
          progress={67}
          currentSubStep={3}
          onCancel={() => goToStep(1)}
        />
      )}
      {step === 4 && (
        <DSDStep />
      )}
      {step === 5 && (
        <ReviewStep
          analysisResult={analysisResult}
          selectedTeeth={selectedTeeth}
          toothTreatments={toothTreatments}
          patientName={sampleData.samplePatient.name}
          patientAge={sampleData.samplePatient.age}
          budget={budget}
          onToggleTooth={toggleTooth}
          onChangeTreatment={() => {}}
          onSetBudget={setBudget}
        />
      )}
      {step === 6 && (
        <ResultStep
          submissionComplete={true}
          protocolsReady={true}
          patientName={sampleData.samplePatient.name}
          toothSummary="11, 21, 12 (3 resinas) + 14 (gengivoplastia)"
          budgetLabel="Padrão"
          onViewCase={() => console.log('View case')}
          onNewCase={() => goToStep(1)}
        />
      )}
    </WizardShell>
  )
}
