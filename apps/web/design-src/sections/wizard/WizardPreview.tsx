import '../../preview-theme.css'
import { useState, useCallback, useEffect, useRef } from 'react'
import { WizardShell } from './components'
import { PhotoStep } from './components'
import { PreferencesStep } from './components'
import { AnalyzingStep } from './components'
import { DSDStep } from './components'
import { ReviewStep } from './components'
import { ResultStep } from './components'
import type {
  WizardStep,
  AnalysisResult,
  TreatmentType,
  BudgetTier,
  WhiteningLevel,
  PatientData,
} from '../../../design/sections/wizard/types'
import sampleData from '../../../design/sections/wizard/data.json'

const STEPS: WizardStep[] = sampleData.steps.full as WizardStep[]

const SAMPLE_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUyOTNiIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NDc0OGIiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj5EZW50YWwgUGhvdG88L3RleHQ+PC9zdmc+'

const SAMPLE_ANALYSIS = sampleData.sampleAnalysis as AnalysisResult

const INITIAL_TREATMENTS: Record<string, TreatmentType> = {
  '11': 'resina',
  '21': 'resina',
  '12': 'resina',
  '22': 'resina',
  '13': 'resina',
  '23': 'resina',
  '14': 'gengivoplastia',
}

const SAMPLE_PATIENT: PatientData = {
  name: sampleData.samplePatient.name,
  birthDate: sampleData.samplePatient.birthDate,
  age: sampleData.samplePatient.age,
}

export default function WizardPreview() {
  const [step, setStep] = useState(1)
  const [prevStep, setPrevStep] = useState(1)
  const [hasPhoto, setHasPhoto] = useState(false)
  const [whiteningLevel, setWhiteningLevel] =
    useState<WhiteningLevel | null>(null)
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([
    '11',
    '21',
    '12',
    '22',
    '13',
    '23',
    '14',
  ])
  const [toothTreatments, setToothTreatments] =
    useState<Record<string, TreatmentType>>(INITIAL_TREATMENTS)
  const [budget, setBudget] = useState<BudgetTier>('padrao')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [analyzeProgress, setAnalyzeProgress] = useState(0)
  const [analyzeSubStep, setAnalyzeSubStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionComplete, setSubmissionComplete] = useState(false)
  const [submissionStep, setSubmissionStep] = useState(0)

  const stepDirection =
    step >= prevStep ? ('forward' as const) : ('backward' as const)

  const goToStep = useCallback(
    (target: number) => {
      setPrevStep(step)
      setStep(target)
      if (target > 1) setHasPhoto(true)
    },
    [step],
  )

  const handleNext = useCallback(() => {
    if (step === 5) {
      // Submit
      goToStep(6)
      setIsSubmitting(true)
      setSubmissionStep(0)
      return
    }
    if (step < 6) goToStep(step + 1)
  }, [step, goToStep])

  const handleBack = useCallback(() => {
    if (step > 1) goToStep(step - 1)
  }, [step, goToStep])

  const toggleTooth = useCallback((tooth: string) => {
    setSelectedTeeth((prev) =>
      prev.includes(tooth)
        ? prev.filter((t) => t !== tooth)
        : [...prev, tooth],
    )
  }, [])

  const changeTreatment = useCallback(
    (tooth: string, treatment: TreatmentType) => {
      setToothTreatments((prev) => ({ ...prev, [tooth]: treatment }))
    },
    [],
  )

  // Refs to prevent Strict Mode double-fire from killing timers
  const analysisStarted = useRef(false)
  const submissionStarted = useRef(false)

  // Simulate analysis when entering step 3
  useEffect(() => {
    if (step !== 3 || analysisComplete) {
      analysisStarted.current = false
      return
    }
    if (analysisStarted.current) return
    analysisStarted.current = true
    setIsAnalyzing(true)
    setAnalyzeProgress(0)
    setAnalyzeSubStep(0)

    const interval = setInterval(() => {
      setAnalyzeProgress((p) => {
        if (p >= 95) return 95
        return p + 5
      })
      setAnalyzeSubStep((s) => Math.min(s + 1, 5))
    }, 333)

    const timeout = setTimeout(() => {
      clearInterval(interval)
      setIsAnalyzing(false)
      setAnalysisComplete(true)
      setAnalyzeProgress(100)
      setAnalyzeSubStep(6)
    }, 2000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [step, analysisComplete])

  // Simulate submission when entering step 6
  useEffect(() => {
    if (step !== 6 || !isSubmitting) {
      submissionStarted.current = false
      return
    }
    if (submissionStarted.current) return
    submissionStarted.current = true

    const interval = setInterval(() => {
      setSubmissionStep((s) => {
        if (s >= 4) return 4
        return s + 1
      })
    }, 600)

    const timeout = setTimeout(() => {
      clearInterval(interval)
      setIsSubmitting(false)
      setSubmissionComplete(true)
    }, 3000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [step, isSubmitting])

  // Determine footer state
  const nextDisabled =
    (step === 1 && !hasPhoto) || (step === 3 && isAnalyzing)
  const nextLabel = step === 5 ? 'Criar Caso' : 'Continuar'
  const showFooter = step !== 6 && !(step === 3 && isAnalyzing)

  const toothSummary = (() => {
    const resinaTeeth = selectedTeeth.filter(
      (t) => (toothTreatments[t] || 'resina') === 'resina',
    )
    const gingivoTeeth = selectedTeeth.filter(
      (t) => toothTreatments[t] === 'gengivoplastia',
    )
    const parts: string[] = []
    if (resinaTeeth.length > 0)
      parts.push(
        `${resinaTeeth.join(', ')} (${resinaTeeth.length} resina${resinaTeeth.length > 1 ? 's' : ''})`,
      )
    if (gingivoTeeth.length > 0)
      parts.push(
        `${gingivoTeeth.join(', ')} (gengivoplastia)`,
      )
    return parts.join(' + ') || 'Nenhum'
  })()

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
          photoQualityScore={hasPhoto ? 82 : null}
          onUploadPhoto={() => {
            console.log('Upload photo')
            setHasPhoto(true)
          }}
          onGoToStep={goToStep}
          creditsRemaining={12}
        />
      )}
      {step === 2 && (
        <PreferencesStep
          whiteningLevel={whiteningLevel}
          onSetWhiteningLevel={(level) => {
            console.log('Set whitening:', level)
            setWhiteningLevel(level)
          }}
          creditsRemaining={12}
        />
      )}
      {step === 3 && (
        <AnalyzingStep
          isAnalyzing={isAnalyzing}
          analysisResult={analysisComplete ? SAMPLE_ANALYSIS : null}
          imageBase64={SAMPLE_IMAGE}
          progress={analyzeProgress}
          currentSubStep={analyzeSubStep}
          onAbortAnalysis={() => {
            console.log('Abort analysis')
            setIsAnalyzing(false)
            goToStep(1)
          }}
        />
      )}
      {step === 4 && (
        <DSDStep
          photoQualityScore={82}
          beforeImage={SAMPLE_IMAGE}
          afterImage={SAMPLE_IMAGE}
        />
      )}
      {step === 5 && (
        <ReviewStep
          analysisResult={SAMPLE_ANALYSIS}
          selectedTeeth={selectedTeeth}
          toothTreatments={toothTreatments}
          patientData={SAMPLE_PATIENT}
          budget={budget}
          onToggleTooth={toggleTooth}
          onChangeTreatment={changeTreatment}
          onUpdatePatient={(data) =>
            console.log('Update patient:', data)
          }
          onSetBudget={(tier) => {
            console.log('Set budget:', tier)
            setBudget(tier)
          }}
        />
      )}
      {step === 6 && (
        <ResultStep
          isSubmitting={isSubmitting}
          submissionComplete={submissionComplete}
          submissionStep={submissionStep}
          patientName={SAMPLE_PATIENT.name}
          toothSummary={toothSummary}
          budgetLabel={budget === 'padrao' ? 'Padrao' : 'Premium'}
          onViewCase={() => console.log('View case')}
          onNewCase={() => {
            console.log('New case')
            setSubmissionComplete(false)
            setAnalysisComplete(false)
            setHasPhoto(false)
            goToStep(1)
          }}
        />
      )}
    </WizardShell>
  )
}
