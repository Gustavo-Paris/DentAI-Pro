import { useState } from 'react'
import {
  Sparkles,
  Share2,
  Plus,
  CheckCircle,
  Trash2,
  Lightbulb,
  Camera,
  Eye,
  FileText,
  MoreVertical,
  ChevronRight,
} from 'lucide-react'
import type {
  SessionHeader,
  TreatmentGroup,
  EvaluationDetailItem,
  EvaluationStatus,
  TreatmentType,
} from '../../../../design/sections/evaluation-detail/types'

function getTreatmentStyle(type: TreatmentType | string): {
  bg: string
  text: string
} {
  const map: Record<string, { bg: string; text: string }> = {
    resina: { bg: 'bg-primary/10', text: 'text-primary' },
    faceta: {
      bg: 'bg-[rgb(var(--layer-translucido-rgb)/0.15)]',
      text: 'text-[rgb(var(--layer-translucido-rgb))]',
    },
    coroa: {
      bg: 'bg-[rgb(var(--layer-opaco-rgb)/0.15)]',
      text: 'text-[rgb(var(--layer-opaco-rgb))]',
    },
    gengivoplastia: {
      bg: 'bg-[rgb(var(--layer-dentina-rgb)/0.15)]',
      text: 'text-[rgb(var(--layer-dentina-rgb))]',
    },
    clareamento: {
      bg: 'bg-[rgb(var(--layer-effect-rgb)/0.15)]',
      text: 'text-[rgb(var(--layer-effect-rgb))]',
    },
    recobrimento_radicular: {
      bg: 'bg-[rgb(var(--layer-esmalte-rgb)/0.15)]',
      text: 'text-[rgb(var(--layer-esmalte-rgb))]',
    },
  }
  return map[type] || { bg: 'bg-muted', text: 'text-muted-foreground' }
}

function getStatusStyle(status: EvaluationStatus): {
  bg: string
  text: string
  label: string
} {
  const map: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    completed: {
      bg: 'bg-success/10',
      text: 'text-success',
      label: 'Concluido',
    },
    pending: {
      bg: 'bg-muted',
      text: 'text-muted-foreground',
      label: 'Pendente',
    },
    error: {
      bg: 'bg-destructive/10',
      text: 'text-destructive',
      label: 'Erro',
    },
  }
  return map[status] || map.pending
}

export interface EvaluationDetailProps {
  session: SessionHeader
  groups: TreatmentGroup[]
  onBack?: () => void
  onNewEvaluation?: () => void
  onShare?: () => void
  onAddTeeth?: () => void
  onMarkAllCompleted?: () => void
  onDeleteSession?: () => void
  onSelectEvaluation?: (evalId: string) => void
  onBulkComplete?: (ids: string[]) => void
}

export default function EvaluationDetail({
  session,
  groups,
  onBack,
  onNewEvaluation,
  onShare,
  onAddTeeth,
  onMarkAllCompleted,
  onDeleteSession,
  onSelectEvaluation,
  onBulkComplete,
}: EvaluationDetailProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="section-glow-bg relative min-h-screen p-6 sm:p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="glow-orb glow-orb-slow"
          style={{
            width: 450,
            height: 450,
            top: '-8%',
            right: '5%',
            background: 'radial-gradient(circle, rgb(var(--color-primary-rgb) / 0.10) 0%, transparent 70%)',
          }}
        />
        <div
          className="glow-orb glow-orb-reverse"
          style={{
            width: 350,
            height: 350,
            bottom: '15%',
            left: '-5%',
            background: 'radial-gradient(circle, rgb(var(--color-accent-rgb) / 0.08) 0%, transparent 70%)',
          }}
        />
        <div
          className="glow-orb"
          style={{
            width: 280,
            height: 280,
            top: '45%',
            left: '55%',
            background: 'radial-gradient(circle, rgb(var(--accent-violet-rgb, 139 92 246) / 0.06) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* AI grid overlay */}
      <div className="ai-grid-pattern absolute inset-0 pointer-events-none" />

      <div className="relative space-y-6">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-1 text-sm"
          style={{ animation: 'fade-in-up 0.6s ease-out 0.1s both' }}
        >
          <button
            onClick={() => onBack?.()}
            className="text-primary font-medium hover:underline focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Avaliacoes
          </button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {session.patient_name}
          </span>
        </nav>

        {/* Session Header Card */}
        <div
          className="glass-panel rounded-xl overflow-hidden"
          style={{ animation: 'fade-in-up 0.6s ease-out 0.15s both' }}
        >
          <div className="bg-gradient-to-br from-primary/5 to-transparent p-4 sm:p-5">
            <div className="flex gap-4">
              {/* Photo thumbnail */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-muted flex items-center justify-center shrink-0 relative group cursor-pointer">
                <Camera className="h-6 w-6 text-muted-foreground" />
                {session.has_dsd && (
                  <div className="absolute inset-0 rounded-xl bg-primary/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="h-4 w-4 text-primary-foreground mr-1" />
                    <span className="text-xs font-medium text-primary-foreground">
                      DSD
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-2.5">
                <div>
                  <h1 className="text-heading text-lg font-semibold neon-text truncate">
                    {session.patient_name}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {new Date(session.date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                {/* Tooth badges */}
                <div className="flex flex-wrap gap-1">
                  {session.teeth.map((tooth) => (
                    <span
                      key={tooth}
                      className="text-[11px] rounded-full px-2 py-0.5 border border-border font-medium text-foreground"
                    >
                      {tooth}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium text-foreground">
                  {session.completed_count}/{session.total_count} completos
                </span>
              </div>
              <div className="h-2 rounded-full bg-primary/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${(session.completed_count / session.total_count) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div
          className="flex flex-wrap gap-2"
          style={{ animation: 'fade-in-up 0.6s ease-out 0.2s both' }}
        >
          <button
            onClick={() => onNewEvaluation?.()}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium btn-press btn-glow flex items-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Sparkles className="h-4 w-4" />
            Nova Avaliacao
          </button>
          <button
            onClick={() => onShare?.()}
            className="glass-panel rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring text-foreground"
          >
            <Share2 className="h-4 w-4" />
            Compartilhar
          </button>
          <button
            onClick={() => onAddTeeth?.()}
            className="glass-panel rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring text-foreground"
          >
            <Plus className="h-4 w-4" />
            Adicionar Dentes
          </button>
          <button
            onClick={() => onMarkAllCompleted?.()}
            className="glass-panel rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring text-foreground"
          >
            <CheckCircle className="h-4 w-4" />
            Marcar Todos Concluidos
          </button>
          <button
            onClick={() => onDeleteSession?.()}
            className="glass-panel rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Excluir Sessao
          </button>
        </div>

        {/* Treatment Groups */}
        <div className="space-y-4">
          {groups.map((group, idx) => {
            const treatStyle = getTreatmentStyle(group.treatment_type)
            return (
              <div
                key={group.treatment_type}
                className="space-y-3"
                style={{ animation: `fade-in-up 0.6s ease-out ${0.25 + idx * 0.05}s both` }}
              >
                {/* Group header */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs rounded-full px-2.5 py-1 font-medium ${treatStyle.bg} ${treatStyle.text}`}
                  >
                    {group.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {group.evaluations.length}{' '}
                    {group.evaluations.length === 1 ? 'dente' : 'dentes'}
                  </span>
                </div>

                {/* Evaluation rows */}
                <div className="glass-panel card-elevated rounded-xl overflow-hidden divide-y divide-border/50">
                  {group.evaluations.map((eval_) => {
                    const statusStyle = getStatusStyle(eval_.status)
                    const isSelected = selectedIds.has(eval_.id)
                    return (
                      <div
                        key={eval_.id}
                        className={`p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleSelection(eval_.id)}
                          className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                            isSelected
                              ? 'bg-primary border-primary'
                              : 'border-border hover:border-primary/50'
                          }`}
                          aria-label={`Selecionar dente ${eval_.tooth}`}
                        >
                          {isSelected && (
                            <CheckCircle className="h-3 w-3 text-primary-foreground" />
                          )}
                        </button>

                        {/* Tooth number */}
                        <span className="text-sm font-semibold text-foreground w-8">
                          {eval_.tooth}
                        </span>

                        {/* Treatment badge */}
                        <span
                          className={`text-xs rounded-full px-2 py-0.5 font-medium ${treatStyle.bg} ${treatStyle.text}`}
                        >
                          {group.label}
                        </span>

                        <div className="flex-1" />

                        {/* Protocol indicator */}
                        {eval_.has_protocol && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            Protocolo
                          </span>
                        )}

                        {/* Status badge */}
                        <span
                          className={`text-xs rounded-full px-2 py-0.5 font-medium ${statusStyle.bg} ${statusStyle.text}`}
                        >
                          {statusStyle.label}
                        </span>

                        {/* Actions */}
                        <button
                          onClick={() =>
                            onSelectEvaluation?.(eval_.id)
                          }
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={`Acoes dente ${eval_.tooth}`}
                        >
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Tip Banner */}
        <div className="glass-panel rounded-xl p-4 flex items-start gap-3 border-l-4 border-primary">
          <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Dica</p>
            <p className="text-xs text-muted-foreground">
              Voce pode adicionar mais dentes a esta sessao ou exportar o
              protocolo em PDF para compartilhar com o paciente.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Selection Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 glass-panel rounded-full px-4 py-2.5 flex items-center gap-3 shadow-lg">
          <span className="text-sm font-medium text-foreground">
            {selectedIds.size} selecionado
            {selectedIds.size > 1 ? 's' : ''}
          </span>
          <button
            onClick={() => onBulkComplete?.([...selectedIds])}
            className="bg-primary text-primary-foreground rounded-full px-4 py-1.5 text-sm font-medium btn-press transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          >
            Concluir
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="p-1.5 rounded-full hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Limpar selecao"
          >
            <span className="text-xs text-muted-foreground">Limpar</span>
          </button>
        </div>
      )}
    </div>
  )
}
