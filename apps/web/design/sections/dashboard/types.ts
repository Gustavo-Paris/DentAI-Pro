/** Dashboard KPI metrics */
export interface DashboardMetrics {
  totalCases: number
  totalPatients: number
  pendingSessions: number
  weeklySessions: number
  completionRate: number
  pendingTeeth: number
}

/** A recent session/case */
export interface DashboardSession {
  session_id: string
  patient_name: string | null
  created_at: string
  teeth: string[]
  evaluationCount: number
  completedCount: number
  treatmentTypes: string[]
  patientAge: number | null
  hasDSD: boolean
}

/** Clinical analytics data */
export interface ClinicalInsights {
  treatmentDistribution: Array<{ label: string; value: number; color: string }>
  topResin: string | null
  topResins: Array<{ name: string; count: number }>
  inventoryRate: number
  totalEvaluated: number
  avgCompletionHours: number | null
}

/** Weekly trend data point */
export interface WeeklyTrendPoint {
  label: string
  value: number
}

/** Pending draft info */
export interface DraftInfo {
  patientName: string
  teethCount: number
  savedAt: string
}

/** Dashboard tab identifiers */
export type DashboardTab = 'principal' | 'casos' | 'insights'

/** Cases filter options */
export type CasosFilter = 'todos' | 'progresso' | 'concluidos'

/** Insights period filter */
export type InsightsPeriod = '8sem' | '12sem' | '26sem'
