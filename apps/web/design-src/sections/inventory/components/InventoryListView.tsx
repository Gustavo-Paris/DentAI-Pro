import type {
  InventoryResinItem,
  InventorySortOption,
  ResinType,
} from '../../../../design/sections/inventory/types'

/* ── Sort pill labels ── */
const SORT_OPTIONS: { value: InventorySortOption; label: string }[] = [
  { value: 'brand-asc', label: 'Marca A-Z' },
  { value: 'shade-asc', label: 'Cor A-Z' },
  { value: 'by-type', label: 'Por Tipo' },
]

/* ── Type colors (layer tokens) ── */
const TYPE_COLORS: Record<ResinType, string> = {
  Esmalte: 'var(--layer-esmalte-rgb)',
  Dentina: 'var(--layer-dentina-rgb)',
  Body: 'var(--layer-dentina-rgb)',
  Opaco: 'var(--layer-opaco-rgb)',
  'Translucido': 'var(--layer-translucido-rgb)',
  Universal: 'var(--layer-default-rgb)',
}

function getTypeRgb(type: ResinType): string {
  return TYPE_COLORS[type] || TYPE_COLORS.Universal
}

/* ── Props ── */
export interface InventoryListViewProps {
  resins: InventoryResinItem[]
  brands: string[]
  types: ResinType[]
  search?: string
  sort?: InventorySortOption
  filterBrand?: string | null
  filterType?: ResinType | null
  onSearch?: (value: string) => void
  onSortChange?: (sort: InventorySortOption) => void
  onFilterBrand?: (brand: string | null) => void
  onFilterType?: (type: ResinType | null) => void
  onAddResin?: () => void
  onImportCSV?: () => void
  onExportCSV?: () => void
  onSelectResin?: (id: string) => void
  onDeleteResin?: (id: string) => void
}

export function InventoryListView({
  resins,
  brands,
  types,
  search = '',
  sort = 'brand-asc',
  filterBrand = null,
  filterType = null,
  onSearch,
  onSortChange,
  onFilterBrand,
  onFilterType,
  onAddResin,
  onImportCSV,
  onExportCSV,
  onSelectResin,
  onDeleteResin,
}: InventoryListViewProps) {
  const isEmpty = resins.length === 0

  return (
    <div className="section-glow-bg min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      {/* Ambient glow */}
      <div className="glow-orb glow-orb-slow absolute left-[8%] top-[3%] h-64 w-64 bg-primary/10" />
      <div className="glow-orb glow-orb-reverse absolute right-[12%] top-[25%] h-52 w-52 bg-accent/8" />

      <div className="relative z-10 mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-heading text-2xl font-bold text-foreground sm:text-3xl">
            Estoque de Resinas
          </h1>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onImportCSV?.()}
              className="btn-press glass-panel inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <UploadIcon />
              Importar
            </button>
            <button
              type="button"
              onClick={() => onExportCSV?.()}
              className="btn-press glass-panel inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <DownloadIcon />
              Exportar
            </button>
            <button
              type="button"
              onClick={() => onAddResin?.()}
              className="btn-glow btn-press inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <PlusIcon />
              Adicionar Resina
            </button>
          </div>
        </div>

        {/* Type legend */}
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{
                backgroundColor: `rgb(${getTypeRgb(t)} / 0.12)`,
                color: `rgb(${getTypeRgb(t)})`,
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: `rgb(${getTypeRgb(t)})` }}
              />
              {t}
            </span>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearch?.(e.target.value)}
              placeholder="Buscar por cor, marca ou produto..."
              className="glass-panel w-full rounded-xl py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterBrand ?? ''}
              onChange={(e) =>
                onFilterBrand?.(e.target.value || null)
              }
              className="glass-panel rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todas Marcas</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select
              value={filterType ?? ''}
              onChange={(e) =>
                onFilterType?.((e.target.value as ResinType) || null)
              }
              className="glass-panel rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos Tipos</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
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

        {/* Resin cards or empty state */}
        {isEmpty ? (
          <EmptyState onAddResin={onAddResin} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {resins.map((r) => (
                <ResinCard
                  key={r.id}
                  resin={r}
                  onSelect={() => onSelectResin?.(r.id)}
                  onDelete={() => onDeleteResin?.(r.id)}
                />
              ))}
            </div>

            {/* Tip banner */}
            {resins.length < 5 && (
              <div className="glass-panel flex items-start gap-3 rounded-2xl border-l-4 border-l-primary/40 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <InfoIcon />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Dica: cadastre mais resinas
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Quanto mais completo seu estoque, melhores serao as
                    recomendacoes da IA para alternativas simplificadas.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ── Resin Card ── */
function ResinCard({
  resin,
  onSelect,
  onDelete,
}: {
  resin: InventoryResinItem
  onSelect: () => void
  onDelete: () => void
}) {
  const typeRgb = getTypeRgb(resin.type)
  const isGradient = resin.shadeColor.startsWith('linear-gradient')

  return (
    <div className="glass-panel card-elevated group relative rounded-2xl p-4 transition-colors">
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
      >
        {/* Shade swatch */}
        <div
          className="h-12 w-12 shrink-0 rounded-xl border border-border/50 shadow-sm"
          style={{
            background: isGradient ? resin.shadeColor : resin.shadeColor,
          }}
        />

        <div className="min-w-0 flex-1">
          {/* Shade + type */}
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-foreground">
              {resin.shade}
            </span>
            <span
              className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
              style={{
                backgroundColor: `rgb(${typeRgb} / 0.12)`,
                color: `rgb(${typeRgb})`,
              }}
            >
              {resin.type}
            </span>
          </div>

          {/* Brand + line */}
          <p className="mt-0.5 text-sm text-muted-foreground">
            {resin.brand}
          </p>
          <p className="text-xs text-muted-foreground/70">{resin.product_line}</p>

          {/* Opacity */}
          {resin.opacity && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Opacidade: {resin.opacity}
            </p>
          )}
        </div>
      </button>

      {/* Delete button (hover) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground/40 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Remover ${resin.shade}`}
      >
        <TrashIcon />
      </button>
    </div>
  )
}

/* ── Empty State ── */
function EmptyState({ onAddResin }: { onAddResin?: () => void }) {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-primary">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
          <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" />
          <path d="M8 15s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="text-heading text-lg font-semibold text-foreground">
        Seu estoque esta vazio
      </h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Adicione suas resinas para que a IA possa recomendar alternativas
        simplificadas baseadas no seu estoque real.
      </p>
      <button
        type="button"
        onClick={() => onAddResin?.()}
        className="btn-glow btn-press mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Adicionar Resina
      </button>
    </div>
  )
}

/* ── Icons ── */
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <polyline points="17,8 12,3 7,8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-primary">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
