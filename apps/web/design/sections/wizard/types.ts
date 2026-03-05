/** Wizard step definition */
export interface WizardStep {
  id: number
  key: string
  label: string
  icon: string
}

/** Whitening level selection */
export type WhiteningLevel = 'natural' | 'hollywood'

/** Budget tier */
export type BudgetTier = 'padrao' | 'premium'

/** Treatment priority */
export type Priority = 'alta' | 'média' | 'baixa'

/** AI confidence level */
export type ConfidenceLevel = 'alta' | 'média' | 'baixa'

/** Treatment type */
export type TreatmentType =
  | 'resina'
  | 'porcelana'
  | 'coroa'
  | 'implante'
  | 'endodontia'
  | 'encaminhamento'
  | 'gengivoplastia'
  | 'recobrimento_radicular'

/** Detected tooth from AI analysis */
export interface ToothDetection {
  tooth: string
  treatment_type: TreatmentType
  priority: Priority
  findings: string[]
}

/** AI analysis result */
export interface AnalysisResult {
  confidence: ConfidenceLevel
  detected_teeth: ToothDetection[]
  observations: string[]
}

/** Patient data entered at review step */
export interface PatientData {
  name: string
  birthDate: string
  age: number
}

/** Wizard page props */
export interface WizardProps {
  /** Current step (1-6) */
  currentStep: number
  /** Step direction for animations */
  stepDirection: 'forward' | 'backward'
  /** Whether this is a quick case flow */
  isQuickCase: boolean
  /** Steps metadata */
  steps: WizardStep[]
  /** Uploaded photo base64 */
  imageBase64: string | null
  /** Photo quality score (0-100) */
  photoQualityScore: number | null
  /** Patient whitening preference */
  whiteningLevel: WhiteningLevel | null
  /** AI analysis result */
  analysisResult: AnalysisResult | null
  /** Selected teeth for treatment */
  selectedTeeth: string[]
  /** Per-tooth treatment overrides */
  toothTreatments: Record<string, TreatmentType>
  /** Patient form data */
  patientData: PatientData | null
  /** Budget tier */
  budget: BudgetTier
  /** Whether AI is processing */
  isAnalyzing: boolean
  /** Whether case is being submitted */
  isSubmitting: boolean
  /** Whether submission completed */
  submissionComplete: boolean
  /** Credits remaining */
  creditsRemaining: number

  /** Navigate to a step */
  onGoToStep: (step: number) => void
  /** Upload photo */
  onUploadPhoto: (file: File) => void
  /** Start AI analysis */
  onAnalyze: () => void
  /** Abort running analysis */
  onAbortAnalysis: () => void
  /** Set whitening level */
  onSetWhiteningLevel: (level: WhiteningLevel) => void
  /** Toggle tooth selection */
  onToggleTooth: (tooth: string) => void
  /** Change tooth treatment type */
  onChangeTreatment: (tooth: string, treatment: TreatmentType) => void
  /** Update patient data */
  onUpdatePatient: (data: Partial<PatientData>) => void
  /** Set budget tier */
  onSetBudget: (tier: BudgetTier) => void
  /** Submit case */
  onSubmit: () => void
}
