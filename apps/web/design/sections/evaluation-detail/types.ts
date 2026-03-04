/** Treatment type */
export type TreatmentType = 'resina' | 'faceta' | 'coroa' | 'gengivoplastia' | 'clareamento' | 'recobrimento_radicular'

/** Evaluation status */
export type EvaluationStatus = 'completed' | 'pending' | 'error'

/** Single evaluation item */
export interface EvaluationDetailItem {
  id: string
  tooth: string
  treatment_type: TreatmentType
  status: EvaluationStatus
  has_protocol: boolean
}

/** Session header data */
export interface SessionHeader {
  patient_name: string
  date: string
  teeth: string[]
  completed_count: number
  total_count: number
  has_photo: boolean
  has_dsd: boolean
}

/** Treatment group */
export interface TreatmentGroup {
  treatment_type: TreatmentType
  label: string
  evaluations: EvaluationDetailItem[]
}
