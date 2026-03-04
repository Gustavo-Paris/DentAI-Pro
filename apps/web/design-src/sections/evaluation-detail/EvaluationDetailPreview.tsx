import '../../preview-theme.css'
import { useState } from 'react'
import {
  Sparkles, Share2, Plus, CheckCircle, Trash2, Lightbulb,
  Camera, Eye, FileText, MoreVertical, ChevronRight, ImageIcon,
} from 'lucide-react'
import type {
  SessionHeader, TreatmentGroup, EvaluationDetailItem, EvaluationStatus,
} from '../../../design/sections/evaluation-detail/types'
import mockData from '../../../design/sections/evaluation-detail/data.json'

function getTreatmentStyle(type: string): { bg: string; text: string } {
  const map: Record<string, { bg: string; text: string }> = {
    resina: { bg: 'bg-primary/10', text: 'text-primary' },
    faceta: { bg: 'bg-[rgb(var(--layer-translucido-rgb)/0.15)]', text: 'text-[rgb(var(--layer-translucido-rgb))]' },
    coroa: { bg: 'bg-[rgb(var(--layer-opaco-rgb)/0.15)]', text: 'text-[rgb(var(--layer-opaco-rgb))]' },
    gengivoplastia: { bg: 'bg-[rgb(var(--layer-dentina-rgb)/0.15)]', text: 'text-[rgb(var(--layer-dentina-rgb))]' },
    clareamento: { bg: 'bg-[rgb(var(--layer-effect-rgb)/0.15)]', text: 'text-[rgb(var(--layer-effect-rgb))]' },
    recobrimento_radicular: { bg: 'bg-[rgb(var(--layer-esmalte-rgb)/0.15)]', text: 'text-[rgb(var(--layer-esmalte-rgb))]' },
  }
  return map[type] || { bg: 'bg-muted', text: 'text-muted-foreground' }
}

function getStatusStyle(status: EvaluationStatus): { bg: string; text: string; label: string } {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    completed: { bg: 'bg-success/10', text: 'text-success', label: 'Concluido' },
    pending: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Pendente' },
    error: { bg: 'bg-destructive/10', text: 'text-destructive', label: 'Erro' },
  }
  return map[status] || map.pending
}

export default function EvaluationDetailPreview() {
  const session = mockData.sessionHeader as SessionHeader
  const groups = mockData.treatmentGroups as TreatmentGroup[]
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  return (
    <div className="section-glow-bg relative min-h-screen p-6 sm:p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="glow-orb glow-orb-1" />
        <div className="glow-orb glow-orb-2" />
        <div className="glow-orb glow-orb-3" />
      </div>

      <div className="relative space-y-6">
        {/* -- 1. Breadcrumb -- */}
        <nav className="flex items-center gap-1 text-sm">
          <span className="text-primary font-medium">Avaliacoes</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{session.patient_name}</span>
        </nav>

        {/* -- 2. Session Header Card -- */}
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="bg-gradient-to-br from-primary/5 to-transparent p-5">
            <div className="flex flex-col sm:flex-row gap-5">
              {/* Photo placeholder */}
              <div className="w-full sm:w-48 h-32 rounded-xl bg-muted flex items-center justify-center shrink-0 relative group cursor-pointer">
                <Camera className="h-8 w-8 text-muted-foreground" />
                {session.has_dsd && (
                  <div className="absolute inset-0 rounded-xl bg-primary/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="h-5 w-5 text-primary-foreground mr-1.5" />
                    <span className="text-sm font-medium text-primary-foreground">Ver DSD</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="text-xl font-semibold text-heading">{session.patient_name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {new Date(session.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                {/* Tooth badges */}
                <div className="flex flex-wrap gap-1.5">
                  {session.teeth.map(tooth => (
                    <span key={tooth} className="text-xs rounded-full px-2.5 py-0.5 border border-border font-medium text-foreground">
                      {tooth}
                    </span>
                  ))}
                </div>

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium text-foreground">{session.completed_count}/{session.total_count} completos</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-primary/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(session.completed_count / session.total_count) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* -- 3. Action Buttons Row -- */}
        <div className="flex flex-wrap gap-2">
          <button className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium btn-press btn-glow flex items-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-ring">
            <Sparkles className="h-4 w-4" />
            Nova Avaliacao
          </button>
          <button className="glass-panel rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring text-foreground">
            <Share2 className="h-4 w-4" />
            Compartilhar
          </button>
          <button className="glass-panel rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring text-foreground">
            <Plus className="h-4 w-4" />
            Adicionar Dentes
          </button>
          <button className="glass-panel rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring text-foreground">
            <CheckCircle className="h-4 w-4" />
            Marcar Todos Concluidos
          </button>
          <button className="glass-panel rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring text-destructive">
            <Trash2 className="h-4 w-4" />
            Excluir Sessao
          </button>
        </div>

        {/* -- 4. Treatment Groups -- */}
        <div className="space-y-4">
          {groups.map(group => {
            const treatStyle = getTreatmentStyle(group.treatment_type)
            return (
              <div key={group.treatment_type} className="space-y-3">
                {/* Group header */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs rounded-full px-2.5 py-1 font-medium ${treatStyle.bg} ${treatStyle.text}`}>
                    {group.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {group.evaluations.length} {group.evaluations.length === 1 ? 'dente' : 'dentes'}
                  </span>
                </div>

                {/* Evaluation rows */}
                <div className="glass-panel rounded-xl overflow-hidden divide-y divide-border/50">
                  {group.evaluations.map(eval_ => {
                    const statusStyle = getStatusStyle(eval_.status)
                    const isSelected = selectedIds.has(eval_.id)
                    return (
                      <div
                        key={eval_.id}
                        className={`p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => {
                            const next = new Set(selectedIds)
                            if (isSelected) next.delete(eval_.id)
                            else next.add(eval_.id)
                            setSelectedIds(next)
                          }}
                          className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                            isSelected ? 'bg-primary border-primary' : 'border-border hover:border-primary/50'
                          }`}
                        >
                          {isSelected && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                        </button>

                        {/* Tooth number */}
                        <span className="text-sm font-semibold text-foreground w-8">{eval_.tooth}</span>

                        {/* Treatment badge */}
                        <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${treatStyle.bg} ${treatStyle.text}`}>
                          {group.label}
                        </span>

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Protocol indicator */}
                        {eval_.has_protocol && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            Protocolo
                          </span>
                        )}

                        {/* Status badge */}
                        <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusStyle.label}
                        </span>

                        {/* Actions */}
                        <button className="p-1.5 rounded-lg hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring">
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

        {/* -- 5. Tip Banner -- */}
        <div className="glass-panel rounded-xl p-4 flex items-start gap-3 border-l-4 border-primary">
          <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Dica</p>
            <p className="text-xs text-muted-foreground">
              Voce pode adicionar mais dentes a esta sessao ou exportar o protocolo em PDF para compartilhar com o paciente.
            </p>
          </div>
        </div>
      </div>

      {/* -- 6. Floating Selection Bar -- */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 glass-panel rounded-full px-4 py-2.5 flex items-center gap-3 shadow-lg">
          <span className="text-sm font-medium text-foreground">
            {selectedIds.size} selecionado{selectedIds.size > 1 ? 's' : ''}
          </span>
          <button className="bg-primary text-primary-foreground rounded-full px-4 py-1.5 text-sm font-medium btn-press transition-colors focus-visible:ring-2 focus-visible:ring-ring">
            Concluir
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="p-1.5 rounded-full hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="text-xs text-muted-foreground">Limpar</span>
          </button>
        </div>
      )}
    </div>
  )
}
