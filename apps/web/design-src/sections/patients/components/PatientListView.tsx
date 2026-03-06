import type {
  PatientListItem,
  PatientSortOption,
} from '../../../../design/sections/patients/types'

/* ── Sort pill labels ── */
const SORT_OPTIONS: { value: PatientSortOption; label: string }[] = [
  { value: 'recent', label: 'Recentes' },
  { value: 'name-asc', label: 'Nome A-Z' },
  { value: 'name-desc', label: 'Nome Z-A' },
  { value: 'cases', label: 'Mais Casos' },
]

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

function formatRelativeDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
  )
  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return `${diffDays} dias atras`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

/* ── Props ── */
export interface PatientListViewProps {
  patients: PatientListItem[]
  search?: string
  sort?: PatientSortOption
  currentPage?: number
  totalPages?: number
  onSearch?: (value: string) => void
  onSortChange?: (sort: PatientSortOption) => void
  onPageChange?: (page: number) => void
  onNewPatient?: () => void
  onSelectPatient?: (id: string) => void
}

export function PatientListView({
  patients,
  search = '',
  sort = 'recent',
  currentPage = 1,
  totalPages = 1,
  onSearch,
  onSortChange,
  onPageChange,
  onNewPatient,
  onSelectPatient,
}: PatientListViewProps) {
  const isEmpty = patients.length === 0

  return (
    <div className="section-glow-bg min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      {/* Ambient glow orbs */}
      <div className="glow-orb glow-orb-slow absolute left-[10%] top-[5%] h-64 w-64 bg-primary/10" />
      <div className="glow-orb glow-orb-reverse absolute right-[15%] top-[30%] h-48 w-48 bg-accent/8" />

      <div className="relative z-10 mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-heading text-2xl font-bold text-foreground sm:text-3xl">
            Pacientes
          </h1>
          <button
            type="button"
            onClick={() => onNewPatient?.()}
            className="btn-glow btn-press inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="shrink-0"
            >
              <path
                d="M8 3v10M3 8h10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Novo Paciente
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M12.5 12.5L16 16"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch?.(e.target.value)}
            placeholder="Buscar por nome, telefone ou email..."
            className="glass-panel w-full rounded-xl py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Sort pills */}
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSortChange?.(opt.value)}
              className={`btn-press rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                sort === opt.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'glass-panel text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Patient cards or empty state */}
        {isEmpty ? (
          <EmptyState onNewPatient={onNewPatient} />
        ) : (
          <>
            <div className="grid gap-3">
              {patients.map((p) => (
                <PatientCard
                  key={p.id}
                  patient={p}
                  onSelect={() => onSelectPatient?.(p.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-1 pt-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => onPageChange?.(currentPage - 1)}
                  className="btn-press rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Anterior
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => onPageChange?.(page)}
                      className={`btn-press h-9 w-9 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        page === currentPage
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => onPageChange?.(currentPage + 1)}
                  className="btn-press rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Proximo
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ── Patient Card ── */
function PatientCard({
  patient,
  onSelect,
}: {
  patient: PatientListItem
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="glass-panel card-elevated group flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5"
    >
      {/* Avatar */}
      <div className="glow-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary transition-colors">
        {getInitials(patient.name)}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground sm:text-base">
          {patient.name}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {patient.phone && (
            <span className="flex items-center gap-1">
              <PhoneIcon />
              {patient.phone}
            </span>
          )}
          {patient.email && (
            <span className="flex items-center gap-1 truncate">
              <MailIcon />
              {patient.email}
            </span>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="hidden shrink-0 items-end gap-4 text-right sm:flex">
        <div>
          <p className="text-xs text-muted-foreground">Casos</p>
          <p className="text-sm font-semibold text-foreground">
            {patient.caseCount}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Ultima visita</p>
          <p className="text-sm font-medium text-foreground">
            {patient.lastVisit
              ? formatRelativeDate(patient.lastVisit)
              : '--'}
          </p>
        </div>
      </div>

      {/* Chevron */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5"
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

/* ── Empty State ── */
function EmptyState({ onNewPatient }: { onNewPatient?: () => void }) {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          className="text-primary"
        >
          <path
            d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle
            cx="9"
            cy="7"
            r="4"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M19 8v6M22 11h-6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h2 className="text-heading text-lg font-semibold text-foreground">
        Nenhum paciente encontrado
      </h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Adicione seu primeiro paciente para comecar a gerenciar suas avaliacoes clinicas.
      </p>
      <button
        type="button"
        onClick={() => onNewPatient?.()}
        className="btn-glow btn-press mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Novo Paciente
      </button>
    </div>
  )
}

/* ── Micro icons ── */
function PhoneIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path
        d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <rect
        x="2"
        y="4"
        width="20"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
