/** Session in the list view */
export interface EvalSession {
  session_id: string
  patient_name: string
  created_at: string
  teeth: string[]
  evaluationCount: number
  completedCount: number
  treatmentTypes: string[]
  patientAge: number
  hasDSD: boolean
}

/** Filter for session list */
export type SessionStatusFilter = 'todos' | 'progresso' | 'concluidos'

/** Treatment type filter */
export type TreatmentFilter = 'todos' | 'resina' | 'porcelana' | 'endodontia' | 'gengivoplastia' | 'coroa' | 'implante' | 'encaminhamento'

/** Individual evaluation in detail view */
export interface EvalItem {
  id: string
  tooth: string
  treatment_type: string
  status: 'completed' | 'planned' | 'error'
  resinName: string | null
  resinManufacturer: string | null
  checklistCurrent: number
  checklistTotal: number
}

/** Session header info */
export interface SessionHeader {
  patient_name: string
  created_at: string
  teeth: string[]
  completedCount: number
  evaluationCount: number
  hasDSD: boolean
  treatmentTypes: string[]
}

/** Evaluation group (teeth with same treatment) */
export interface EvalGroup {
  treatmentType: string
  label: string
  evaluations: EvalItem[]
  resinName?: string
}

/** Protocol layer for stratification */
export interface ProtoLayer {
  order: number
  name: string
  resin_brand: string
  shade: string
  thickness: string
  purpose: string
  technique: string
  optional?: boolean
}

/** Alternative simplified protocol */
export interface ProtoAlternative {
  resin: string
  shade: string
  technique: string
  tradeoff: string
}

/** Finishing step */
export interface FinishingStep {
  order: number
  tool: string
  speed: string
  time: string
  tip: string
}

/** Resin recommendation */
export interface ResinRecommendation {
  name: string
  manufacturer: string
  type: string
  opacity: string
  resistance: string
  polishing: string
  aesthetics: string
  justification: string
  isFromInventory: boolean
}

/** DSD layer for toggling */
export interface DSDLayer {
  type: string
  label: string
  active: boolean
}

/** Case summary clinical data */
export interface CaseSummary {
  patientAge: number
  tooth: string
  region: string
  cavityClass: string
  restorationSize: string
  toothColor: string
  aestheticLevel: string
  bruxism: boolean
  budget: string
}

/** Full protocol data for the Protocol view */
export interface ProtocolData {
  treatmentType: string
  treatmentLabel: string
  tooth: string
  region: string
  createdAt: string
  resin: ResinRecommendation
  layers: ProtoLayer[]
  alternative: ProtoAlternative
  finishing: {
    contouring: FinishingStep[]
    polishing: FinishingStep[]
    finalGlaze: string
    maintenanceAdvice: string
  }
  checklist: string[]
  alerts: string[]
  warnings: string[]
  confidence: 'alta' | 'média' | 'baixa'
  dsdLayers: DSDLayer[]
  caseSummary: CaseSummary
}

/** Tab identifiers for protocol view */
export type ProtocolTab = 'protocolo' | 'acabamento' | 'checklist' | 'dsd'
