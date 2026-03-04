import '../../preview-theme.css'
import { useState } from 'react'
import {
  Calendar,
  User,
  Image as ImageIcon,
  Share2,
  MessageCircle,
  CheckCircle,
  Trash2,
  Eye,
  Lightbulb,
  X,
  ChevronRight,
} from 'lucide-react'
import type { EvalItem, EvalGroup, SessionHeader } from '../../../design/sections/evaluations/types'
import sampleData from '../../../design/sections/evaluations/data.json'

const TREATMENT_COLOR_VARS: Record<string, string> = {
  resina: 'var(--color-primary)',
  porcelana: 'var(--color-treatment-porcelana)',
  gengivoplastia: 'var(--color-treatment-gengivoplastia)',
  endodontia: 'var(--color-treatment-endodontia)',
  coroa: 'var(--color-treatment-coroa)',
  implante: 'var(--color-treatment-implante)',
  encaminhamento: 'var(--color-treatment-encaminhamento)',
  recobrimento: 'var(--color-treatment-recobrimento)',
}

const TREATMENT_LABELS: Record<string, string> = {
  resina: 'Resina Composta',
  porcelana: 'Porcelana',
  gengivoplastia: 'Gengivoplastia',
  endodontia: 'Endodontia',
  coroa: 'Coroa',
  implante: 'Implante',
  encaminhamento: 'Encaminhamento',
  recobrimento: 'Recobrimento',
}

function groupEvaluations(evals: EvalItem[]): EvalGroup[] {
  const map = new Map<string, EvalItem[]>()
  for (const ev of evals) {
    const key = ev.treatment_type
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(ev)
  }
  return Array.from(map.entries()).map(([type, items]) => ({
    treatmentType: type,
    label: TREATMENT_LABELS[type] ?? type,
    evaluations: items,
    resinName: type === 'resina' && items[0]?.resinName ? items[0].resinName : undefined,
  }))
}

export default function SessionDetailPreview() {
  const header = sampleData.sampleSessionHeader as SessionHeader
  const evaluations = sampleData.sampleEvaluations as EvalItem[]
  const groups = groupEvaluations(evaluations)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const progressPercent =
    header.evaluationCount > 0
      ? (header.completedCount / header.evaluationCount) * 100
      : 0

  return (
    <div className="space-y-4">
      {/* ── 1. Breadcrumb ── */}
      <nav className="flex items-center gap-1">
        <span className="text-sm text-primary font-medium">Avaliacoes</span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{header.patient_name}</span>
      </nav>

      {/* ── 2. Session Header Card ── */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="bg-gradient-to-br from-primary/5 to-transparent p-5">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Photo placeholder */}
            <div className="rounded-lg bg-muted w-full md:w-32 h-32 flex items-center justify-center shrink-0">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>

            {/* Info column */}
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-foreground">{header.patient_name}</h1>

              <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  03/03/2026
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {header.evaluationCount} dentes
                </span>
              </div>

              {/* Tooth badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {header.teeth.map((tooth) => (
                  <span
                    key={tooth}
                    className="text-xs rounded-full px-2 py-0.5 border border-border text-foreground"
                  >
                    {tooth}
                  </span>
                ))}
              </div>

              {/* Progress */}
              <div className="flex items-center gap-3 mt-3">
                <span className="text-xs text-muted-foreground">Progresso</span>
                <div className="h-2 flex-1 max-w-[200px] rounded-full bg-primary/20 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progressPercent}%`,
                      backgroundColor: 'var(--color-primary)',
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {header.completedCount}/{header.evaluationCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Action Buttons Row ── */}
      <div className="flex flex-wrap gap-2">
        <button className="flex items-center gap-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring rounded-lg px-3 py-2 border border-border text-foreground hover:bg-muted">
          <Share2 className="w-4 h-4" />
          Compartilhar
        </button>
        <button className="flex items-center gap-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring rounded-lg px-3 py-2 border border-border text-foreground hover:bg-muted">
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </button>
        <button className="flex items-center gap-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring rounded-lg px-3 py-2 border border-border text-foreground hover:bg-muted">
          <CheckCircle className="w-4 h-4" />
          Concluir Todos
        </button>
        <button className="flex items-center gap-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring rounded-lg px-3 py-2 text-destructive hover:bg-destructive/10">
          <Trash2 className="w-4 h-4" />
          Excluir
        </button>
      </div>

      {/* ── 4. Evaluation Groups ── */}
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.treatmentType}>
            {/* Group header (only when >1 evaluation) */}
            {group.evaluations.length > 1 && (
              <div className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-lg mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {group.evaluations.length} dentes
                  </span>
                </div>
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring rounded px-1.5 py-1">
                  <Eye className="w-3.5 h-3.5" />
                  Ver Protocolo
                </button>
              </div>
            )}

            {/* Tooth cards */}
            {group.evaluations.map((ev) => {
              const isCompleted = ev.status === 'completed'
              const isSelected = selectedIds.has(ev.id)
              const borderColor = isCompleted
                ? 'var(--color-success)'
                : TREATMENT_COLOR_VARS[ev.treatment_type] ?? 'var(--color-primary)'

              return (
                <div
                  key={ev.id}
                  className="glass-panel rounded-xl p-4 border-l-4 mb-2 hover:shadow-md transition-shadow cursor-pointer"
                  style={{ borderLeftColor: borderColor }}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {/* Checkbox */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSelection(ev.id)
                        }}
                        className={`w-5 h-5 rounded border-2 cursor-pointer flex items-center justify-center shrink-0 transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                          isSelected
                            ? 'bg-primary border-primary'
                            : 'border-border hover:border-primary/50'
                        }`}
                        aria-label={`Selecionar dente ${ev.tooth}`}
                      >
                        {isSelected && (
                          <svg
                            className="w-3 h-3 text-primary-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      {/* Tooth number */}
                      <span className="font-semibold text-foreground">{ev.tooth}</span>
                    </div>

                    {/* Status badge */}
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-xs rounded-full px-2 py-0.5 font-medium"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--color-success) 10%, transparent)',
                          color: 'var(--color-success)',
                        }}
                      >
                        <CheckCircle className="w-3 h-3" />
                        Concluido
                      </span>
                    ) : (
                      <span className="text-xs rounded-full px-2 py-0.5 bg-muted text-muted-foreground font-medium">
                        {ev.checklistCurrent}/{ev.checklistTotal}
                      </span>
                    )}
                  </div>

                  {/* Resin info */}
                  {ev.resinName && (
                    <div className="mt-2 p-2 rounded-lg bg-muted/30">
                      <p className="text-sm font-medium text-foreground">{ev.resinName}</p>
                      {ev.resinManufacturer && (
                        <p className="text-xs text-muted-foreground">{ev.resinManufacturer}</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* ── 5. Tip Banner ── */}
      <div className="rounded-xl p-4 border border-primary/20 bg-primary/5 mt-4">
        <div className="flex items-center gap-3">
          <Lightbulb className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Adicione mais dentes</p>
            <p className="text-xs text-muted-foreground">2 dentes pendentes nesta sessao</p>
          </div>
          <button className="text-sm bg-primary text-primary-foreground rounded-lg px-3 py-1.5 btn-press focus-visible:ring-2 focus-visible:ring-ring transition-colors font-medium">
            Adicionar
          </button>
        </div>
      </div>

      {/* ── 6. Floating Selection Bar ── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 glass-panel rounded-full px-4 py-2 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">
              {selectedIds.size} selecionado{selectedIds.size > 1 ? 's' : ''}
            </span>
            <button className="text-sm bg-primary text-primary-foreground rounded-lg px-3 py-1.5 btn-press focus-visible:ring-2 focus-visible:ring-ring transition-colors font-medium">
              Concluir
            </button>
            <button
              onClick={clearSelection}
              className="w-7 h-7 rounded-full hover:bg-muted transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Limpar selecao"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
