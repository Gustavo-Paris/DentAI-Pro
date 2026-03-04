import '../../preview-theme.css'
import { useState } from 'react'
import {
  Search,
  Plus,
  Users,
  Calendar,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import type {
  PatientListItem,
  PatientSortOption,
} from '../../../design/sections/patients/types'
import mockData from '../../../design/sections/patients/data.json'

const SORT_OPTIONS: { key: PatientSortOption; label: string }[] = [
  { key: 'recent', label: 'Recentes' },
  { key: 'name-asc', label: 'Nome A-Z' },
  { key: 'name-desc', label: 'Nome Z-A' },
  { key: 'cases', label: 'Mais Casos' },
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const ITEMS_PER_PAGE = 3

export default function PatientListPreview() {
  const patients = mockData.samplePatients as PatientListItem[]

  const [sortOption, setSortOption] = useState<PatientSortOption>('recent')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredPatients = patients
    .filter((p) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        if (
          !p.name.toLowerCase().includes(query) &&
          !(p.phone && p.phone.toLowerCase().includes(query)) &&
          !(p.email && p.email.toLowerCase().includes(query))
        )
          return false
      }
      return true
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'recent': {
          const dateA = a.lastVisit ? new Date(a.lastVisit).getTime() : 0
          const dateB = b.lastVisit ? new Date(b.lastVisit).getTime() : 0
          return dateB - dateA
        }
        case 'name-asc':
          return a.name.localeCompare(b.name, 'pt-BR')
        case 'name-desc':
          return b.name.localeCompare(a.name, 'pt-BR')
        case 'cases':
          return b.caseCount - a.caseCount
        default:
          return 0
      }
    })

  const totalFiltered = filteredPatients.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / ITEMS_PER_PAGE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE
  const paginatedPatients = filteredPatients.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  return (
    <div className="min-h-screen section-glow-bg">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb w-64 h-64 bg-primary/10 -top-20 -right-20" />
        <div className="glow-orb glow-orb-slow w-48 h-48 bg-accent/10 bottom-40 -left-20" />
      </div>

      {/* Content */}
      <div className="relative max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-heading">Pacientes</h1>
          <button className="flex items-center gap-2 bg-primary text-primary-foreground btn-press btn-glow rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring">
            <Plus className="w-4 h-4" />
            Novo Paciente
          </button>
        </div>

        {/* Search */}
        <div className="glass-panel rounded-xl px-4 py-3 flex items-center gap-3">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="bg-transparent text-foreground placeholder:text-muted-foreground text-sm w-full outline-none focus-visible:ring-0"
          />
        </div>

        {/* Sort pills */}
        <div className="glass-panel rounded-xl px-3 py-2 inline-flex gap-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => {
                setSortOption(opt.key)
                setCurrentPage(1)
              }}
              className={`rounded-full px-3 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                sortOption === opt.key
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Patient Cards */}
        {paginatedPatients.length > 0 ? (
          <div className="space-y-4">
            {paginatedPatients.map((patient) => (
              <div
                key={patient.id}
                className="glass-panel rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm shrink-0">
                    {getInitials(patient.name)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Top: name + case count */}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground truncate">
                        {patient.name}
                      </span>
                      <span className="bg-muted rounded-full text-xs px-2 py-0.5 text-muted-foreground whitespace-nowrap ml-2">
                        {patient.caseCount > 0
                          ? `${patient.caseCount} avaliacoes`
                          : 'Sem avaliacoes'}
                      </span>
                    </div>

                    {/* Contact info */}
                    <div className="flex gap-4 mt-1">
                      {patient.phone && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {patient.phone}
                        </span>
                      )}
                      {patient.email && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          {patient.email}
                        </span>
                      )}
                    </div>

                    {/* Last visit */}
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {patient.lastVisit
                          ? new Date(patient.lastVisit).toLocaleDateString('pt-BR')
                          : 'Sem visitas'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}

        {/* Pagination footer */}
        {totalFiltered > 0 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              Mostrando {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, totalFiltered)} de{' '}
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

/* -- Empty State -- */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="p-4 rounded-full bg-muted">
        <Users className="w-8 h-8 text-muted-foreground" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-lg font-medium text-foreground">Nenhum paciente encontrado</p>
        <p className="text-sm text-muted-foreground max-w-sm text-center">
          Tente ajustar a busca ou cadastre um novo paciente
        </p>
      </div>
      <button className="flex items-center gap-2 bg-primary text-primary-foreground btn-press btn-glow rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring">
        <Sparkles className="w-4 h-4" />
        Cadastrar Paciente
      </button>
    </div>
  )
}
