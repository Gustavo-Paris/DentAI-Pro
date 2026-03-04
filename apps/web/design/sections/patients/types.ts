/** Patient in the list view */
export interface PatientListItem {
  id: string
  name: string
  phone: string | null
  email: string | null
  caseCount: number
  lastVisit: string | null
}

/** Sort option for patient list */
export type PatientSortOption = 'recent' | 'name-asc' | 'name-desc' | 'cases'

/** Patient profile data */
export interface PatientProfile {
  id: string
  name: string
  phone: string | null
  email: string | null
  notes: string | null
}

/** Patient metrics */
export interface PatientMetrics {
  totalSessions: number
  totalCases: number
  completedCases: number
  firstVisit: string
}

/** Patient session in profile view */
export interface PatientSessionItem {
  session_id: string
  created_at: string
  teeth: string[]
  evaluationCount: number
  completedCount: number
}
