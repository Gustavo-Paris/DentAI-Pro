import '../../preview-theme.css'
import {
  Phone,
  Mail,
  FileText,
  ChevronRight,
  Plus,
  Calendar,
  ClipboardList,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
} from 'lucide-react'

/* -----------------------------------------------------------------------
   PatientProfilePreview — Polished patient profile detail page.
   Uses Design OS preview-theme tokens, glass panels, glow orbs,
   staggered animations. Hardcoded sample data from data.json.
   ----------------------------------------------------------------------- */

const profile = {
  name: 'Maria Clara Oliveira',
  initials: 'MC',
  phone: '(11) 98765-4321',
  email: 'maria.clara@email.com',
  notes:
    'Paciente com histórico de sensibilidade dentária. Preferência por tratamentos estéticos. Alergia a látex.',
}

const metrics = [
  { value: '5', label: 'Avaliações', color: 'text-primary' },
  { value: '12', label: 'Casos', color: 'text-foreground' },
  { value: '9', label: 'Concluídos', color: 'text-primary' },
  { value: '20/ago', label: 'Primeira Visita', color: 'text-foreground' },
]

const sessions = [
  {
    id: 'sess-101',
    date: '03 Mar 2026',
    teeth: ['11', '21', '12', '22'],
    done: 4,
    total: 4,
  },
  {
    id: 'sess-102',
    date: '15 Fev 2026',
    teeth: ['14', '15', '24'],
    done: 3,
    total: 3,
  },
  {
    id: 'sess-103',
    date: '10 Jan 2026',
    teeth: ['36', '46'],
    done: 1,
    total: 2,
  },
  {
    id: 'sess-104',
    date: '22 Nov 2025',
    teeth: ['37', '47', '38'],
    done: 1,
    total: 3,
  },
]

export default function PatientProfilePreview() {
  return (
    <div className="section-glow-bg relative min-h-screen">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="glow-orb"
          style={{
            width: 450,
            height: 450,
            top: '0%',
            left: '15%',
            background:
              'radial-gradient(circle, rgb(var(--color-primary-rgb) / 0.10) 0%, transparent 70%)',
          }}
        />
        <div
          className="glow-orb glow-orb-slow"
          style={{
            width: 350,
            height: 350,
            top: '40%',
            right: '5%',
            background:
              'radial-gradient(circle, rgb(var(--color-accent-rgb) / 0.08) 0%, transparent 70%)',
          }}
        />
        <div
          className="glow-orb glow-orb-reverse"
          style={{
            width: 300,
            height: 300,
            bottom: '5%',
            left: '50%',
            background:
              'radial-gradient(circle, rgb(var(--color-primary-rgb) / 0.06) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Breadcrumbs */}
        <nav
          className="flex items-center gap-1.5 text-xs text-muted-foreground animate-[fade-in-up_0.6s_ease-out_both]"
          aria-label="Breadcrumb"
        >
          <span className="hover:text-foreground cursor-pointer transition-colors">
            Dashboard
          </span>
          <span className="text-muted-foreground/50">/</span>
          <span className="hover:text-foreground cursor-pointer transition-colors">
            Pacientes
          </span>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-foreground font-medium">{profile.name}</span>
        </nav>

        {/* Header Card */}
        <div className="glass-panel rounded-xl p-5 sm:p-6 animate-[fade-in-up_0.6s_ease-out_0.05s_both]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-primary">
                  {profile.initials}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-heading neon-text tracking-tight">
                  {profile.name}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Perfil do Paciente
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium btn-press btn-glow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors">
                <Plus className="w-4 h-4" />
                Nova Avaliação
              </button>
              <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/50 btn-press focus-visible:ring-2 focus-visible:ring-ring transition-colors">
                <Pencil className="w-3.5 h-3.5" />
                Editar
              </button>
              <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 btn-press focus-visible:ring-2 focus-visible:ring-destructive transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
                Excluir
              </button>
            </div>
          </div>
        </div>

        {/* Contact Info Card */}
        <div className="glass-panel rounded-xl p-5 animate-[fade-in-up_0.6s_ease-out_0.1s_both]">
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <div className="flex items-center gap-2.5 text-foreground">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                <Phone className="w-4 h-4 text-primary" />
              </div>
              <span>{profile.phone}</span>
            </div>
            <div className="flex items-center gap-2.5 text-foreground">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <span>{profile.email}</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5 text-sm mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted shrink-0 mt-0.5">
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {profile.notes}
            </p>
          </div>
        </div>

        {/* Metrics KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-[fade-in-up_0.6s_ease-out_0.15s_both]">
          {metrics.map((stat, i) => {
            const icons = [ClipboardList, FileText, CheckCircle2, Calendar]
            const Icon = icons[i]
            const iconColors = [
              'text-primary',
              'text-accent',
              'text-success',
              'text-warning',
            ]
            const iconBgs = [
              'bg-primary/10',
              'bg-accent/10',
              'bg-success/10',
              'bg-warning/10',
            ]

            return (
              <div
                key={stat.label}
                className="glass-panel card-elevated rounded-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${iconBgs[i]}`}
                  >
                    <Icon className={`w-5 h-5 ${iconColors[i]}`} />
                  </div>
                  <div>
                    <p
                      className={`text-2xl font-bold leading-none ${stat.color}`}
                    >
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Session History */}
        <div>
          <div className="flex items-center justify-between mb-4 animate-[fade-in-up_0.6s_ease-out_0.2s_both]">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Histórico de Sessões
            </h2>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium btn-press btn-glow focus-visible:ring-2 focus-visible:ring-ring transition-colors">
              <Plus className="w-3.5 h-3.5" />
              Nova Avaliação
            </button>
          </div>

          <div className="space-y-3">
            {sessions.map((session, idx) => {
              const isCompleted = session.done === session.total
              const pct = Math.round((session.done / session.total) * 100)
              const delay = 0.25 + idx * 0.08

              return (
                <div
                  key={session.id}
                  className="glass-panel card-elevated rounded-xl relative overflow-hidden cursor-pointer group"
                  style={{
                    animation: `fade-in-up 0.6s ease-out ${delay}s both`,
                  }}
                >
                  {/* Left accent bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[3px]"
                    style={{
                      background: isCompleted
                        ? `linear-gradient(to bottom, rgb(var(--color-success-rgb)), rgb(var(--color-success-rgb) / 0.5))`
                        : `linear-gradient(to bottom, rgb(var(--color-primary-rgb)), rgb(var(--color-primary-rgb) / 0.5))`,
                    }}
                  />

                  <div className="p-4 pl-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          {session.date}
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isCompleted
                              ? 'bg-success/10 text-success'
                              : 'bg-warning/10 text-warning'
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Concluído
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              Em progresso
                            </>
                          )}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {session.teeth.map((tooth) => (
                            <span
                              key={tooth}
                              className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground"
                            >
                              Dente {tooth}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {session.total}{' '}
                          {session.total === 1 ? 'caso' : 'casos'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 min-w-[120px]">
                        <div
                          className="flex-1 h-2 rounded-full bg-muted overflow-hidden"
                          role="progressbar"
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background: isCompleted
                                ? 'rgb(var(--color-success-rgb))'
                                : 'rgb(var(--color-primary-rgb))',
                              boxShadow: isCompleted
                                ? '0 0 8px rgb(var(--color-success-rgb) / 0.3)'
                                : '0 0 8px rgb(var(--color-primary-rgb) / 0.3)',
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground tabular-nums whitespace-nowrap">
                          {session.done}/{session.total}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Load more */}
          <div
            className="pt-6 text-center"
            style={{
              animation: 'fade-in-up 0.6s ease-out 0.6s both',
            }}
          >
            <button className="px-5 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground btn-press focus-visible:ring-2 focus-visible:ring-ring transition-colors">
              Carregar mais
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
