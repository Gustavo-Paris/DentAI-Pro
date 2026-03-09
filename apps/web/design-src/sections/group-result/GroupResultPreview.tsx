/* eslint-disable no-console */
import '../../preview-theme.css'
import { useState } from 'react'

/* -----------------------------------------------------------------------
   GroupResultPreview -- High-fidelity visual preview of the Group Result
   detail page. Unified protocol shared across multiple teeth.
   Uses preview-theme.css tokens and glass utilities.
   Hardcoded sample data from design/sections/group-result/data.json.
   ----------------------------------------------------------------------- */

/* ── Layer stratification colors (semantic tokens from preview-theme.css) ── */
function getLayerColor(name: string) {
  const n = name.toLowerCase()
  if (n.includes('opac') || n.includes('mascaramento'))
    return {
      border: 'rgb(var(--layer-opaco-rgb))',
      bg: 'color-mix(in srgb, rgb(249 115 22) 8%, transparent)',
      numberBg: 'color-mix(in srgb, rgb(249 115 22) 15%, transparent)',
    }
  if (n.includes('dentina') || n.includes('corpo'))
    return {
      border: 'rgb(var(--layer-dentina-rgb))',
      bg: 'color-mix(in srgb, rgb(245 158 11) 8%, transparent)',
      numberBg: 'color-mix(in srgb, rgb(245 158 11) 15%, transparent)',
    }
  if (n.includes('efeito') || n.includes('incisai') || n.includes('corante'))
    return {
      border: 'rgb(var(--layer-effect-rgb))',
      bg: 'color-mix(in srgb, rgb(139 92 246) 8%, transparent)',
      numberBg: 'color-mix(in srgb, rgb(139 92 246) 15%, transparent)',
    }
  if (n.includes('esmalte'))
    return {
      border: 'rgb(var(--layer-esmalte-rgb))',
      bg: 'color-mix(in srgb, rgb(16 185 129) 8%, transparent)',
      numberBg: 'color-mix(in srgb, rgb(16 185 129) 15%, transparent)',
    }
  return {
    border: 'var(--color-border)',
    bg: 'transparent',
    numberBg: 'var(--color-muted)',
  }
}

/* ── Sample data ── */
const groupTeeth = ['11', '21', '12', '22']

const layers = [
  { order: 1, name: 'Dentina / Corpo', shade: 'A2D', brand: 'Z350 XT', thickness: '0.8mm', technique: 'Incrementos obliquos respeitando anatomia individual de cada dente', purpose: 'Reproduzir massa de dentina para todos os elementos do grupo' },
  { order: 2, name: 'Efeitos Incisais', shade: 'CT', brand: 'Z350 XT', thickness: '0.3mm', technique: 'Aplicar entre mamelos, manter simetria bilateral', purpose: 'Opalescencia e translucidez uniforme no grupo anterior', optional: true },
  { order: 3, name: 'Esmalte Vestibular', shade: 'WE', brand: 'Z350 XT', thickness: '0.5mm', technique: 'Camada unica, texturizar superficie para naturalidade', purpose: 'Camada final com translucidez e continuidade cromatica entre dentes' },
]

const checklist = [
  { text: 'Isolamento absoluto em todos os elementos', checked: true },
  { text: 'Condicionamento acido seletivo por 15s', checked: true },
  { text: 'Adesivo universal em 2 camadas ativas', checked: true },
  { text: 'Fotopolimerizacao individual por dente', checked: false },
  { text: 'Ajuste oclusal bilateral verificado', checked: false },
  { text: 'Acabamento com discos sequenciais', checked: false },
  { text: 'Polimento final com pasta diamantada', checked: false },
]

export default function GroupResultPreview() {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(
    new Set(checklist.map((c, i) => (c.checked ? i : -1)).filter((i) => i >= 0)),
  )

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const progressPct = Math.round((checkedItems.size / checklist.length) * 100)

  return (
    <div className="section-glow-bg relative min-h-screen overflow-hidden">
      {/* Glow orbs */}
      <div
        className="glow-orb"
        style={{
          width: 450,
          height: 450,
          top: '0%',
          left: '15%',
          background: 'radial-gradient(circle, rgb(var(--color-primary-rgb) / 0.10) 0%, transparent 70%)',
        }}
      />
      <div
        className="glow-orb glow-orb-slow glow-orb-reverse"
        style={{
          width: 380,
          height: 380,
          bottom: '15%',
          right: '8%',
          background: 'radial-gradient(circle, rgb(var(--color-accent-rgb) / 0.08) 0%, transparent 70%)',
        }}
      />

      {/* AI grid */}
      <div className="ai-grid-pattern absolute inset-0 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* ── Breadcrumbs ── */}
        <nav
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
          style={{ animation: 'fade-in-up 0.6s ease-out 0.1s both' }}
        >
          <span className="hover:text-foreground cursor-pointer transition-colors">Dashboard</span>
          <span className="opacity-40">/</span>
          <span className="hover:text-foreground cursor-pointer transition-colors">Avaliacao</span>
          <span className="opacity-40">/</span>
          <span className="text-foreground font-medium">Protocolo Unificado (4 dentes)</span>
        </nav>

        {/* ── Page Title + Actions ── */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ animation: 'fade-in-up 0.6s ease-out 0.15s both' }}
        >
          <h1 className="text-heading text-2xl font-semibold tracking-tight neon-text">
            Resina Composta &mdash; Protocolo Unificado
          </h1>
          <button
            onClick={() => console.log('marcar todos concluidos')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-ring cursor-pointer shrink-0"
          >
            <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            Marcar Todos Concluidos
          </button>
        </div>

        {/* ── Treatment Type Header Card ── */}
        <div
          className="glass-panel rounded-xl p-5"
          style={{ animation: 'fade-in-up 0.6s ease-out 0.2s both' }}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10 shrink-0">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-heading text-xl font-semibold">Protocolo Unificado</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Resina Composta</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {groupTeeth.map((tooth) => (
                  <span
                    key={tooth}
                    className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground bg-muted/30"
                  >
                    Dente {tooth}
                  </span>
                ))}
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium shrink-0">
              {groupTeeth.length} dentes
            </span>
          </div>
        </div>

        {/* ── Resin Recommendation Card ── */}
        <div
          className="ai-shimmer-border rounded-xl"
          style={{ animation: 'fade-in-up 0.6s ease-out 0.25s both' }}
        >
          <div className="glass-panel rounded-xl p-5 ai-glow">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-heading text-lg font-semibold">Filtek Z350 XT</h3>
                  <p className="text-sm text-muted-foreground">3M ESPE</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border font-medium shrink-0">
                Nanoparticulada
              </span>
            </div>
            <div className="rounded-lg bg-primary/5 border border-primary/10 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Aplique protocolo identico para:{' '}
                <strong className="text-foreground font-semibold">
                  {groupTeeth.join(', ')}
                </strong>
              </p>
            </div>
          </div>
        </div>

        {/* ── Protocolo de Estratificacao ── */}
        <div style={{ animation: 'fade-in-up 0.6s ease-out 0.3s both' }}>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Protocolo de Estratificacao
          </h3>

          <div className="space-y-3">
            {layers.map((layer, i) => {
              const colors = getLayerColor(layer.name)
              return (
                <div
                  key={layer.order}
                  className="glass-panel rounded-xl p-4 border-l-[3px]"
                  style={{
                    borderLeftColor: colors.border,
                    background: colors.bg,
                    animation: `fade-in-up 0.6s ease-out ${0.35 + i * 0.06}s both`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full font-semibold flex items-center justify-center text-sm shrink-0"
                      style={{ backgroundColor: colors.numberBg }}
                    >
                      {layer.order}
                    </div>
                    <span className="font-medium text-foreground">{layer.name}</span>
                    {layer.optional && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Opcional
                      </span>
                    )}
                  </div>

                  <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 mt-3">
                    <div>
                      <dt className="text-xs text-muted-foreground uppercase tracking-wider">Resina</dt>
                      <dd className="text-sm font-medium">{layer.brand}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground uppercase tracking-wider">Cor</dt>
                      <dd className="text-sm font-medium">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-sm font-medium"
                          style={{ backgroundColor: colors.numberBg }}
                        >
                          {layer.shade}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground uppercase tracking-wider">Espessura</dt>
                      <dd className="text-sm font-medium">{layer.thickness}</dd>
                    </div>
                    <div className="col-span-2 sm:col-span-4">
                      <dt className="text-xs text-muted-foreground uppercase tracking-wider">Tecnica</dt>
                      <dd className="text-sm font-medium">{layer.technique}</dd>
                    </div>
                  </dl>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Checklist Clinico ── */}
        <div style={{ animation: 'fade-in-up 0.6s ease-out 0.5s both' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Checklist Clinico
            </h3>
            <span className="text-xs text-muted-foreground">
              {checkedItems.size}/{checklist.length} concluidos
            </span>
          </div>

          {/* Progress bar */}
          <div className="glass-panel rounded-xl p-4 mb-3">
            <div className="h-2 rounded-full bg-primary/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Checklist items */}
          <div className="glass-panel rounded-xl divide-y divide-border/50 overflow-hidden">
            {checklist.map((item, idx) => {
              const isChecked = checkedItems.has(idx)
              return (
                <button
                  key={idx}
                  onClick={() => toggleCheck(idx)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isChecked ? 'bg-success border-success' : 'border-border'
                    }`}
                  >
                    {isChecked && (
                      <svg className="w-3 h-3 text-success-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-sm transition-colors ${
                      isChecked ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}
                  >
                    {item.text}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Footer Actions ── */}
        <div
          className="flex items-center justify-end gap-3 pt-4 border-t border-border"
          style={{ animation: 'fade-in-up 0.6s ease-out 0.6s both' }}
        >
          <button
            onClick={() => console.log('recalcular')}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Recalcular
          </button>
        </div>
      </div>
    </div>
  )
}
