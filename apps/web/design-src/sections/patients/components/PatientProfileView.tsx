import type {
  PatientProfile,
  PatientMetrics,
  PatientSessionItem,
} from '../../../../design/sections/patients/types'

/* ── Helpers ── */
function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/* ── Props ── */
export interface PatientProfileViewProps {
  profile: PatientProfile
  metrics: PatientMetrics
  sessions: PatientSessionItem[]
  onBack?: () => void
  onEdit?: () => void
  onNewSession?: () => void
  onSelectSession?: (sessionId: string) => void
}

export function PatientProfileView({
  profile,
  metrics,
  sessions,
  onBack,
  onEdit,
  onNewSession,
  onSelectSession,
}: PatientProfileViewProps) {
  return (
    <div className="section-glow-bg min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      {/* Ambient glow */}
      <div className="glow-orb absolute left-[5%] top-[10%] h-56 w-56 bg-primary/10" />
      <div className="glow-orb glow-orb-slow absolute right-[10%] top-[40%] h-40 w-40 bg-accent/8" />

      <div className="relative z-10 mx-auto max-w-4xl space-y-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => onBack?.()}
            className="btn-press transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Pacientes
          </button>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M5 3l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-medium text-foreground">{profile.name}</span>
        </nav>

        {/* Header card */}
        <div className="glass-panel rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {/* Large avatar */}
            <div className="glow-icon flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">
              {getInitials(profile.name)}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-heading text-xl font-bold text-foreground sm:text-2xl">
                {profile.name}
              </h1>

              {/* Contact info */}
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                {profile.phone && (
                  <span className="flex items-center gap-1.5">
                    <PhoneIcon />
                    {profile.phone}
                  </span>
                )}
                {profile.email && (
                  <span className="flex items-center gap-1.5">
                    <MailIcon />
                    {profile.email}
                  </span>
                )}
              </div>

              {profile.notes && (
                <p className="mt-2 text-sm text-muted-foreground/80 leading-relaxed">
                  {profile.notes}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => onEdit?.()}
                className="btn-press glass-panel inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <EditIcon />
                Editar
              </button>
              <button
                type="button"
                onClick={() => onNewSession?.()}
                className="btn-glow btn-press inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <PlusIcon />
                Nova Sessao
              </button>
            </div>
          </div>
        </div>

        {/* Metrics KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Sessoes"
            value={String(metrics.totalSessions)}
            icon={<CalendarIcon />}
          />
          <MetricCard
            label="Casos"
            value={String(metrics.totalCases)}
            icon={<FolderIcon />}
          />
          <MetricCard
            label="Concluidos"
            value={String(metrics.completedCases)}
            icon={<CheckIcon />}
            accent
          />
          <MetricCard
            label="Primeira Visita"
            value={formatShortDate(metrics.firstVisit)}
            icon={<ClockIcon />}
            small
          />
        </div>

        {/* Session history */}
        <div className="space-y-3">
          <h2 className="text-heading text-lg font-semibold text-foreground">
            Historico de Sessoes
          </h2>

          {sessions.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhuma sessao registrada.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {sessions.map((s) => (
                <SessionCard
                  key={s.session_id}
                  session={s}
                  onSelect={() => onSelectSession?.(s.session_id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Metric Card ── */
function MetricCard({
  label,
  value,
  icon,
  accent,
  small,
}: {
  label: string
  value: string
  icon: React.ReactNode
  accent?: boolean
  small?: boolean
}) {
  return (
    <div className="glass-panel card-elevated rounded-2xl p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p
        className={`mt-2 font-bold ${
          accent ? 'text-primary' : 'text-foreground'
        } ${small ? 'text-base' : 'text-xl'}`}
      >
        {value}
      </p>
    </div>
  )
}

/* ── Session Card ── */
function SessionCard({
  session,
  onSelect,
}: {
  session: PatientSessionItem
  onSelect: () => void
}) {
  const progress =
    session.evaluationCount > 0
      ? (session.completedCount / session.evaluationCount) * 100
      : 0
  const isComplete = session.completedCount === session.evaluationCount

  return (
    <button
      type="button"
      onClick={onSelect}
      className="glass-panel card-elevated group flex w-full flex-col gap-3 rounded-2xl p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:p-5"
    >
      {/* Date + tooth badges */}
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm font-semibold text-foreground">
          {formatDate(session.created_at)}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {session.teeth.map((t) => (
            <span
              key={t}
              className="inline-flex h-6 min-w-[1.75rem] items-center justify-center rounded-md bg-primary/10 px-1.5 text-[11px] font-semibold text-primary"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="flex shrink-0 items-center gap-3 sm:w-48">
        <div className="flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                backgroundColor: isComplete
                  ? 'var(--color-success)'
                  : 'var(--color-primary)',
              }}
            />
          </div>
        </div>
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          {session.completedCount}/{session.evaluationCount}
        </span>
      </div>

      {/* Chevron */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="hidden shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 sm:block"
      >
        <path
          d="M7.5 5L12.5 10L7.5 15"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

/* ── Icons ── */
function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path
        d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
