import '../../preview-theme.css'
import { useState } from 'react'
import {
  ChevronRight,
  Phone,
  Mail,
  FileText,
  Pencil,
  Sparkles,
  Trash2,
  Calendar,
  CheckCircle,
  Clock,
} from 'lucide-react'
import type {
  PatientProfile,
  PatientMetrics,
  PatientSessionItem,
} from '../../../design/sections/patients/types'
import mockData from '../../../design/sections/patients/data.json'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function PatientProfilePreview() {
  const profile = mockData.sampleProfile as PatientProfile
  const metrics = mockData.sampleMetrics as PatientMetrics
  const sessions = mockData.sampleSessions as PatientSessionItem[]

  return (
    <section className="section-glow-bg relative min-h-screen p-6 sm:p-8 space-y-6">
      {/* Glow orbs */}
      <div className="glow-orb w-64 h-64 -top-20 -right-20 bg-primary/10" />
      <div className="glow-orb glow-orb-slow w-48 h-48 bottom-40 -left-20 bg-accent/10" />

      {/* ── 1. Breadcrumb ── */}
      <nav className="flex items-center gap-1">
        <span className="text-sm text-primary font-medium">Pacientes</span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{profile.name}</span>
      </nav>

      {/* ── 2. Header Card ── */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="bg-gradient-to-br from-primary/5 to-transparent p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary text-xl font-semibold flex items-center justify-center shrink-0">
              {getInitials(profile.name)}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-heading">{profile.name}</h1>
              <p className="text-sm text-muted-foreground">Perfil do Paciente</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 self-start flex-wrap">
              <button className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium btn-press btn-glow transition-colors focus-visible:ring-2 focus-visible:ring-ring">
                <Sparkles className="h-4 w-4" />
                Nova Avaliacao
              </button>
              <button className="flex items-center gap-1.5 border border-border rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring">
                <Pencil className="h-4 w-4" />
                Editar
              </button>
              <button className="flex items-center gap-1.5 text-destructive rounded-lg px-3 py-2 text-sm font-medium hover:bg-destructive/10 transition-colors focus-visible:ring-2 focus-visible:ring-ring">
                <Trash2 className="h-4 w-4" />
                Excluir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Contact Info ── */}
      <div className="glass-panel rounded-xl p-4">
        <div className="flex flex-wrap gap-4 text-sm">
          {profile.phone && (
            <span className="flex items-center gap-1.5 text-foreground">
              <Phone className="w-4 h-4 text-muted-foreground" />
              {profile.phone}
            </span>
          )}
          {profile.email && (
            <span className="flex items-center gap-1.5 text-foreground">
              <Mail className="w-4 h-4 text-muted-foreground" />
              {profile.email}
            </span>
          )}
          {profile.notes && (
            <>
              <div className="w-full mt-2 pt-2 border-t border-border" />
              <span className="flex items-start gap-1.5 text-muted-foreground">
                <FileText className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="whitespace-pre-wrap">{profile.notes}</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── 4. Metrics KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-foreground">{metrics.totalSessions}</p>
          <p className="text-xs text-muted-foreground">Avaliacoes</p>
        </div>
        <div className="glass-panel rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-foreground">{metrics.totalCases}</p>
          <p className="text-xs text-muted-foreground">Casos</p>
        </div>
        <div className="glass-panel rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-primary">{metrics.completedCases}</p>
          <p className="text-xs text-muted-foreground">Concluidos</p>
        </div>
        <div className="glass-panel rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-foreground">
            {new Date(metrics.firstVisit).toLocaleDateString('pt-BR')}
          </p>
          <p className="text-xs text-muted-foreground">Primeira Visita</p>
        </div>
      </div>

      {/* ── 5. Session History ── */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Historico de Sessoes
        </h3>

        <div className="space-y-3">
          {sessions.map((session) => {
            const isCompleted = session.completedCount === session.evaluationCount
            const progressPercent =
              session.evaluationCount > 0
                ? (session.completedCount / session.evaluationCount) * 100
                : 0

            return (
              <div
                key={session.session_id}
                className="glass-panel rounded-xl p-4 border-l-4 hover:shadow-md transition-shadow cursor-pointer"
                style={{
                  borderLeftColor: isCompleted
                    ? 'var(--color-success)'
                    : 'var(--color-primary)',
                }}
              >
                {/* Top row */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {new Date(session.created_at).toLocaleDateString('pt-BR')}
                  </span>

                  {/* Status badge */}
                  {isCompleted ? (
                    <span
                      className="text-xs rounded-full px-2 py-0.5 font-medium flex items-center gap-1"
                      style={{
                        backgroundColor:
                          'color-mix(in srgb, var(--color-success) 10%, transparent)',
                        color: 'var(--color-success)',
                      }}
                    >
                      <CheckCircle className="h-3 w-3" />
                      Concluido
                    </span>
                  ) : (
                    <span className="text-xs rounded-full px-2 py-0.5 font-medium flex items-center gap-1 bg-muted text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Em Progresso
                    </span>
                  )}
                </div>

                {/* Teeth badges */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {session.teeth.map((tooth) => (
                    <span
                      key={tooth}
                      className="text-xs rounded-full px-2 py-0.5 border border-border text-foreground"
                    >
                      {tooth}
                    </span>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-3 mt-2">
                  <div className="h-2 flex-1 rounded-full bg-primary/20 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progressPercent}%`,
                        backgroundColor: isCompleted
                          ? 'var(--color-success)'
                          : 'var(--color-primary)',
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {session.completedCount}/{session.evaluationCount}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
