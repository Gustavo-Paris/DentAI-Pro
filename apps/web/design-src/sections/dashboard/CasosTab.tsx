import '../../preview-theme.css'
import { useState } from 'react'
import { FileEdit, FileText, Plus } from 'lucide-react'
import type { DashboardSession, DraftInfo, CasosFilter } from '../../../design/sections/dashboard/types'
import sampleData from '../../../design/sections/dashboard/data.json'

const TREATMENT_COLOR_VARS: Record<string, string> = {
  resina: 'var(--color-treatment-resina)',
  porcelana: 'var(--color-treatment-porcelana)',
  gengivoplastia: 'var(--color-treatment-gengivoplastia)',
  endodontia: 'var(--color-treatment-endodontia)',
  coroa: 'var(--color-treatment-coroa)',
  implante: 'var(--color-treatment-implante)',
  encaminhamento: 'var(--color-treatment-encaminhamento)',
  recobrimento: 'var(--color-treatment-recobrimento)',
}

const TREATMENT_LABELS: Record<string, string> = {
  resina: 'Resina',
  porcelana: 'Porcelana',
  gengivoplastia: 'Gengivoplastia',
  endodontia: 'Endodontia',
  coroa: 'Coroa',
  implante: 'Implante',
  encaminhamento: 'Encaminhamento',
  recobrimento: 'Recobrimento',
}

function formatRelativeDate(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 60) return `ha ${diffMinutes}min`
  if (diffHours < 24) return `ha ${diffHours}h`
  if (diffDays === 1) return 'ha 1 dia'
  return `ha ${diffDays} dias`
}

interface CasosTabProps {
  sessions?: DashboardSession[]
  draft?: DraftInfo | null
  totalCases?: number
  onContinueDraft?: () => void
  onDiscardDraft?: () => void
  onSelectSession?: (sessionId: string) => void
  onCreateCase?: () => void
}

export default function CasosTab({
  sessions = sampleData.sampleSessions as DashboardSession[],
  draft = sampleData.sampleDraft as DraftInfo,
  totalCases = sampleData.sampleMetrics.totalCases,
  onContinueDraft = () => {},
  onDiscardDraft = () => {},
  onSelectSession = () => {},
  onCreateCase = () => {},
}: CasosTabProps) {
  const [filter, setFilter] = useState<CasosFilter>('todos')

  const filteredSessions = sessions.filter((s) => {
    if (filter === 'todos') return true
    if (filter === 'concluidos') return s.completedCount === s.evaluationCount
    if (filter === 'progresso') return s.completedCount < s.evaluationCount
    return true
  })

  const filters: { key: CasosFilter; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'progresso', label: 'Em Progresso' },
    { key: 'concluidos', label: 'Concluidos' },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-foreground">Seus Casos</h2>
          <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
            {totalCases} casos
          </span>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
              filter === f.key
                ? 'bg-primary text-primary-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Draft Card */}
      {draft && (
        <div className="ai-shimmer-border rounded-xl">
          <div className="glass-panel rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileEdit className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Caso em progresso
              </span>
            </div>
            <div>
              <p className="font-medium text-foreground">{draft.patientName}</p>
              <p className="text-xs text-muted-foreground">
                {draft.teethCount} dentes &bull; Salvo {formatRelativeDate(draft.savedAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onContinueDraft}
                className="bg-primary text-primary-foreground btn-press btn-glow rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              >
                Continuar
              </button>
              <button
                onClick={onDiscardDraft}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring rounded-lg px-2 py-2"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Cards */}
      {filteredSessions.length > 0 ? (
        <div className="space-y-4">
          {filteredSessions.map((session) => {
            const isComplete =
              session.completedCount === session.evaluationCount
            const progressPercent =
              session.evaluationCount > 0
                ? (session.completedCount / session.evaluationCount) * 100
                : 0

            return (
              <div
                key={session.session_id}
                onClick={() => onSelectSession(session.session_id)}
                className="glass-panel rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4"
                style={{
                  borderLeftColor: isComplete
                    ? 'var(--color-success)'
                    : 'var(--color-primary)',
                }}
              >
                {/* Top row: patient name + age | date */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {session.patient_name ?? 'Paciente'}
                    </span>
                    {session.patientAge != null && (
                      <span className="text-xs text-muted-foreground">
                        {session.patientAge} anos
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeDate(session.created_at)}
                  </span>
                </div>

                {/* Treatment type chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {session.treatmentTypes.map((type) => {
                    const color =
                      TREATMENT_COLOR_VARS[type] ?? 'var(--color-muted-foreground)'
                    return (
                      <span
                        key={type}
                        className="text-xs rounded-full px-2 py-0.5 font-medium"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
                          color,
                        }}
                      >
                        {TREATMENT_LABELS[type] ?? type}
                      </span>
                    )
                  })}
                  {session.hasDSD && (
                    <span
                      className="text-xs rounded-full px-2 py-0.5 font-medium"
                      style={{
                        backgroundColor: `color-mix(in srgb, var(--color-primary) 10%, transparent)`,
                        color: 'var(--color-primary)',
                      }}
                    >
                      DSD
                    </span>
                  )}
                </div>

                {/* Progress bar + label */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progressPercent}%`,
                        backgroundColor: isComplete
                          ? 'var(--color-success)'
                          : 'var(--color-primary)',
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {session.completedCount}/{session.evaluationCount} protocolos
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState onCreateCase={onCreateCase} />
      )}
    </div>
  )
}

/* ── Empty State ── */

function EmptyState({ onCreateCase }: { onCreateCase: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="p-4 rounded-full bg-muted">
        <FileText className="w-8 h-8 text-muted-foreground" />
      </div>
      <div className="text-center space-y-1">
        <p className="font-medium text-foreground">Nenhum caso ainda</p>
        <p className="text-sm text-muted-foreground">
          Inicie sua primeira analise com IA
        </p>
      </div>
      <button
        onClick={onCreateCase}
        className="flex items-center gap-2 bg-primary text-primary-foreground btn-press btn-glow rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Plus className="w-4 h-4" />
        Criar Primeiro Caso
      </button>
    </div>
  )
}
