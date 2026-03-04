import '../../preview-theme.css'
import { useState } from 'react'
import { Search, Plus, Package, Upload, Download, Trash2, Lightbulb } from 'lucide-react'
import type { InventoryResinItem, InventorySortOption, ResinType } from '../../../design/sections/inventory/types'
import mockData from '../../../design/sections/inventory/data.json'

const RESIN_TYPES: ResinType[] = ['Esmalte', 'Dentina', 'Body', 'Opaco', 'Translúcido', 'Universal']

const SORT_OPTIONS: { key: InventorySortOption; label: string }[] = [
  { key: 'brand-asc', label: 'Marca A-Z' },
  { key: 'shade-asc', label: 'Cor A-Z' },
  { key: 'by-type', label: 'Por Tipo' },
]

function getTypeStyle(type: string): React.CSSProperties {
  const tokenMap: Record<string, string> = {
    'Esmalte': '--layer-esmalte-rgb',
    'Dentina': '--layer-dentina-rgb',
    'Opaco': '--layer-opaco-rgb',
    'Translúcido': '--layer-translucido-rgb',
    'Universal': '--layer-default-rgb',
  }
  const token = tokenMap[type]
  if (!token) return {} // Body — use Tailwind classes
  return {
    backgroundColor: `rgb(var(${token}) / 0.15)`,
    color: `rgb(var(${token}))`,
  }
}

function getContrastColor(color: string): string {
  if (color.includes('linear-gradient')) return '#374151'
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#374151' : '#FAFAFA'
}

export default function InventoryPreview() {
  const resins = mockData.sampleResins as InventoryResinItem[]

  const [sortOption, setSortOption] = useState<InventorySortOption>('brand-asc')
  const [searchQuery, setSearchQuery] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const filteredResins = resins
    .filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        if (
          !r.shade.toLowerCase().includes(q) &&
          !r.brand.toLowerCase().includes(q) &&
          !r.product_line.toLowerCase().includes(q)
        )
          return false
      }
      if (brandFilter && r.brand !== brandFilter) return false
      if (typeFilter && r.type !== typeFilter) return false
      return true
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'brand-asc':
          return a.brand.localeCompare(b.brand, 'pt-BR') || a.shade.localeCompare(b.shade)
        case 'shade-asc':
          return a.shade.localeCompare(b.shade)
        case 'by-type':
          return a.type.localeCompare(b.type, 'pt-BR') || a.brand.localeCompare(b.brand, 'pt-BR')
        default:
          return 0
      }
    })

  return (
    <div className="section-glow-bg relative min-h-screen p-6 sm:p-8 space-y-6">
      {/* Glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="glow-orb glow-orb-1" />
        <div className="glow-orb glow-orb-2" />
        <div className="glow-orb glow-orb-3" />
      </div>

      {/* Content */}
      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-heading">Estoque de Resinas</h1>
            <p className="text-sm text-muted-foreground">Gerencie suas resinas compostas</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="glass-panel rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5 hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring">
              <Upload className="h-3.5 w-3.5" />
              Importar CSV
            </button>
            <button className="glass-panel rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5 hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring">
              <Download className="h-3.5 w-3.5" />
              Exportar CSV
            </button>
            <button className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium btn-press btn-glow flex items-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-ring">
              <Plus className="h-4 w-4" />
              Adicionar Resina
            </button>
          </div>
        </div>

        {/* Type Legend Strip */}
        <div className="glass-panel rounded-xl p-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground mr-1">Tipos:</span>
          {RESIN_TYPES.map((type) => (
            <span
              key={type}
              className={`rounded-full px-3 py-1 text-xs font-medium ${type === 'Body' ? 'bg-muted text-muted-foreground' : ''}`}
              style={type === 'Body' ? {} : getTypeStyle(type)}
            >
              {type}
            </span>
          ))}
        </div>

        {/* Search + Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="glass-panel rounded-xl flex-1 flex items-center gap-2 px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Buscar por cor, marca ou produto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-foreground placeholder:text-muted-foreground text-sm w-full outline-none focus-visible:ring-0"
            />
          </div>
          <div className="glass-panel rounded-xl px-3 py-2">
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="bg-transparent border-none text-sm text-foreground outline-none cursor-pointer"
            >
              <option value="">Todas as Marcas</option>
              {mockData.brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div className="glass-panel rounded-xl px-3 py-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent border-none text-sm text-foreground outline-none cursor-pointer"
            >
              <option value="">Todos os Tipos</option>
              {mockData.types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort Pills */}
        <div className="glass-panel rounded-xl px-3 py-2 inline-flex gap-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortOption(opt.key)}
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

        {/* Resin Card Grid */}
        {filteredResins.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredResins.map((resin) => (
              <div
                key={resin.id}
                className="glass-panel rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
              >
                {/* Shade swatch */}
                <div
                  className="h-16 w-full flex items-center justify-center"
                  style={
                    resin.shadeColor.includes('linear-gradient')
                      ? { background: resin.shadeColor }
                      : { backgroundColor: resin.shadeColor }
                  }
                >
                  <span
                    className="text-sm font-semibold"
                    style={{ color: getContrastColor(resin.shadeColor) }}
                  >
                    {resin.shade}
                  </span>
                </div>
                {/* Info */}
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{resin.shade}</span>
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 font-medium ${resin.type === 'Body' ? 'bg-muted text-muted-foreground' : ''}`}
                      style={resin.type === 'Body' ? {} : getTypeStyle(resin.type)}
                    >
                      {resin.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {resin.brand} · {resin.product_line}
                  </p>
                  <div className="flex justify-end">
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity transition-colors p-1 rounded hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-ring">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}

        {/* Tip Banner */}
        {filteredResins.length > 0 && filteredResins.length <= 10 && (
          <div className="glass-panel rounded-xl p-4 flex items-start gap-3 border-l-4 border-primary">
            <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Dica</p>
              <p className="text-xs text-muted-foreground">
                Importe seu estoque completo via CSV para ter acesso rapido a todas as suas resinas
                durante a avaliacao.
              </p>
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
        <Package className="w-8 h-8 text-muted-foreground" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-lg font-medium text-foreground">Nenhuma resina encontrada</p>
        <p className="text-sm text-muted-foreground max-w-sm text-center">
          Ajuste os filtros ou adicione novas resinas ao seu estoque
        </p>
      </div>
      <button className="flex items-center gap-2 bg-primary text-primary-foreground btn-press btn-glow rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring">
        <Plus className="w-4 h-4" />
        Adicionar Resina
      </button>
    </div>
  )
}
