import { useState } from 'react'
import {
  Search,
  Plus,
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import type {
  EvalSession,
  SessionStatusFilter,
  TreatmentFilter,
} from '../../../../design/sections/evaluations/types'

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

const ITEMS_PER_PAGE = 5

export interface SessionListProps {
  sessions: EvalSession[]
  onNewCase?: () => void
  onSelectSession?: (sessionId: string) => void
}

export default function SessionList({
  sessions,
  onNewCase,
  onSelectSession,
}: SessionListProps) {
  const [statusFilter, setStatusFilter] =
    useState<SessionStatusFilter>('todos')
  const [treatmentFilter, setTreatmentFilter] =
    useState<TreatmentFilter>('todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const statusFilters: { key: SessionStatusFilter; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'progresso', label: 'Em Progresso' },
    { key: 'concluidos', label: 'Concluidos' },
  ]

  const treatmentFilters: { key: TreatmentFilter; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'resina', label: 'Resina' },
    { key: 'porcelana', label: 'Porcelana' },
    { key: 'endodontia', label: 'Endodontia' },
    { key: 'gengivoplastia', label: 'Gengivoplastia' },
    { key: 'coroa', label: 'Coroa' },
    { key: 'implante', label: 'Implante' },
    { key: 'encaminhamento', label: 'Encaminhamento' },
  ]

  const filteredSessions = sessions.filter((s) => {
    if (
      statusFilter === 'concluidos' &&
      s.completedCount !== s.evaluationCount
    )
      return false
    if (
      statusFilter === 'progresso' &&
      s.completedCount === s.evaluationCount
    )
      return false
    if (
      treatmentFilter !== 'todos' &&
      !s.treatmentTypes.includes(treatmentFilter)
    )
      return false
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      if (!s.patient_name.toLowerCase().includes(query)) return false
    }
    return true
  })

  const totalFiltered = filteredSessions.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / ITEMS_PER_PAGE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE
  const paginatedSessions = filteredSessions.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  )

  return (
    <div className="min-h-screen section-glow-bg">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb glow-orb-slow w-48 h-48 bg-primary/10 top-20 right-10" />
        <div className="glow-orb glow-orb-reverse w-36 h-36 bg-accent/8 bottom-32 left-10" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Avaliacoes</h1>
          <button
            onClick={() => onNewCase?.()}
            className="flex items-center gap-2 bg-primary text-primary-foreground btn-press btn-glow rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="w-4 h-4" />
            Novo Caso
          </button>
        </div>

        {/* Search */}
        <div className="glass-panel rounded-xl px-4 py-3 flex items-center gap-3">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Buscar por paciente..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="bg-transparent text-foreground placeholder:text-muted-foreground text-sm w-full outline-none focus-visible:ring-0"
          />
        </div>

        {/* Status filter pills */}
        <div className="glass-panel rounded-xl px-3 py-2 inline-flex gap-2">
          {statusFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setStatusFilter(f.key)
                setCurrentPage(1)
              }}
              className={`rounded-full px-3 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                statusFilter === f.key
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Treatment filter pills */}
        <div className="glass-panel rounded-xl px-3 py-2 inline-flex gap-2 flex-wrap">
          {treatmentFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setTreatmentFilter(f.key)
                setCurrentPage(1)
              }}
              className={`rounded-full px-3 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                treatmentFilter === f.key
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Session Cards */}
        {paginatedSessions.length > 0 ? (
          <div className="space-y-4">
            {paginatedSessions.map((session, index) => {
              const isComplete =
                session.completedCount === session.evaluationCount
              const progressPercent =
                session.evaluationCount > 0
                  ? (session.completedCount / session.evaluationCount) * 100
                  : 0
              const isFirst = index === 0 && safeCurrentPage === 1

              const card = (
                <div
                  onClick={() => onSelectSession?.(session.session_id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ')
                      onSelectSession?.(session.session_id)
                  }}
                  className="glass-panel rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4"
                  style={{
                    borderLeftColor: isComplete
                      ? 'var(--color-success)'
                      : 'var(--color-primary)',
                  }}
                >
                  {/* Top row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {session.patient_name}
                      </span>
                      {session.patientAge != null && (
                        <span className="text-xs text-muted-foreground">
                          {session.patientAge} anos
                        </span>
                      )}
                      {isFirst && (
                        <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-medium">
                          Novo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Treatment chips */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {session.treatmentTypes.map((type) => {
                      const color =
                        TREATMENT_COLOR_VARS[type] ??
                        'var(--color-muted-foreground)'
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
                          backgroundColor:
                            'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                          color: 'var(--color-primary)',
                        }}
                      >
                        DSD
                      </span>
                    )}
                  </div>

                  {/* Middle row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {session.teeth.length} dentes:
                      </span>
                      {session.teeth.map((tooth) => (
                        <span
                          key={tooth}
                          className="text-xs rounded-full px-2 py-0.5 border border-border text-foreground"
                        >
                          {tooth}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 ml-2">
                      <Calendar className="w-3 h-3" />
                      <span>{formatRelativeDate(session.created_at)}</span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-primary/20 overflow-hidden">
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
                      {session.completedCount}/{session.evaluationCount}{' '}
                      protocolos
                    </span>
                  </div>
                </div>
              )

              if (isFirst) {
                return (
                  <div
                    key={session.session_id}
                    className="ai-shimmer-border rounded-xl"
                  >
                    {card}
                  </div>
                )
              }
              return <div key={session.session_id}>{card}</div>
            })}
          </div>
        ) : (
          <EmptyState onNewCase={() => onNewCase?.()} />
        )}

        {/* Pagination */}
        {totalFiltered > 0 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              Mostrando {startIndex + 1}-
              {Math.min(startIndex + ITEMS_PER_PAGE, totalFiltered)} de{' '}
              {totalFiltered}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[28px] h-7 rounded-lg text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                      page === safeCurrentPage
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={safeCurrentPage >= totalPages}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ onNewCase }: { onNewCase: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="p-4 rounded-full bg-muted">
        <FileText className="w-8 h-8 text-muted-foreground" />
      </div>
      <div className="text-center space-y-1">
        <p className="font-medium text-foreground">
          Nenhuma avaliacao encontrada
        </p>
        <p className="text-sm text-muted-foreground">
          Tente ajustar os filtros ou inicie um novo caso
        </p>
      </div>
      <button
        onClick={onNewCase}
        className="flex items-center gap-2 bg-primary text-primary-foreground btn-press btn-glow rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Sparkles className="w-4 h-4" />
        Criar Novo Caso
      </button>
    </div>
  )
}
