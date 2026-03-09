/* eslint-disable no-console */
import '../../preview-theme.css'
import { useState } from 'react'

/* -----------------------------------------------------------------------
   ResultPreview -- High-fidelity visual preview of the single-tooth
   Result detail page. Uses preview-theme.css tokens and glass utilities.
   Hardcoded sample data from design/sections/result/data.json.
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
const layers = [
  { order: 1, name: 'Camada Opaca / Mascaramento', shade: 'OA2', brand: 'Z350 XT', thickness: '0.3mm', technique: 'Aplicar em camada fina e uniforme no fundo da cavidade', purpose: 'Mascarar substrato escurecido e criar base opaca para estratificacao' },
  { order: 2, name: 'Dentina / Corpo', shade: 'A2D', brand: 'Z350 XT', thickness: '1.0mm', technique: 'Inserir em incrementos obliquos, respeitando a anatomia interna', purpose: 'Reproduzir a massa de dentina com cor e opacidade adequadas' },
  { order: 3, name: 'Efeitos Incisais', shade: 'CT', brand: 'Z350 XT', thickness: '0.3mm', technique: 'Aplicar pequenas porcoes entre mamelos de dentina', purpose: 'Simular opalescencia e translucidez do terco incisal', optional: true },
  { order: 4, name: 'Esmalte Palatino', shade: 'A2E', brand: 'Z350 XT', thickness: '0.5mm', technique: 'Moldar com matriz de silicone previamente confeccionada', purpose: 'Reconstruir parede palatina e conferir translucidez natural' },
  { order: 5, name: 'Esmalte Vestibular', shade: 'WE', brand: 'Z350 XT', thickness: '0.5mm', technique: 'Aplicar em camada unica, esculpir anatomia de superficie', purpose: 'Camada final de esmalte com translucidez e brilho natural' },
]

const tabs = [
  { key: 'protocolo', label: 'Protocolo' },
  { key: 'acabamento', label: 'Acabamento' },
  { key: 'checklist', label: 'Checklist' },
  { key: 'dsd', label: 'DSD' },
] as const

type TabKey = (typeof tabs)[number]['key']

const checklist = [
  'Isolamento absoluto instalado',
  'Condicionamento acido 37% por 15s em esmalte',
  'Aplicacao do adesivo em 2 camadas ativas',
  'Fotopolimerizacao adequada de cada incremento',
  'Verificacao oclusal com papel articular',
  'Acabamento com discos de granulacao decrescente',
  'Polimento final com pasta diamantada',
]

const alternatives = [
  { name: 'Harmonize', manufacturer: 'Kerr', reason: 'Tecnologia ARC que se adapta a cor dos dentes adjacentes, boa opcao para casos esteticos anteriores.' },
  { name: 'Empress Direct', manufacturer: 'Ivoclar Vivadent', reason: 'Excelente mimetismo optico com sistema de camadas simplificado.' },
]

const properties = [
  { label: 'Opacidade', value: 'Translucida' },
  { label: 'Resistencia', value: 'Alta' },
  { label: 'Polimento', value: 'Excelente' },
  { label: 'Estetica', value: 'Superior' },
]

export default function ResultPreview() {
  const [activeTab, setActiveTab] = useState<TabKey>('protocolo')
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set())

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

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
          width: 350,
          height: 350,
          bottom: '10%',
          right: '5%',
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
          <span className="text-foreground font-medium">Dente 21</span>
        </nav>

        {/* ── Treatment Type Header Card ── */}
        <div
          className="glass-panel rounded-xl p-5"
          style={{ animation: 'fade-in-up 0.6s ease-out 0.15s both' }}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 14.5M14.25 3.104c.251.023.501.05.75.082M19.8 14.5l-2.039 2.039a2.25 2.25 0 01-1.591.659H7.83a2.25 2.25 0 01-1.591-.659L4.2 14.5m15.6 0l.4.4m-16 0l-.4.4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-heading text-xl font-semibold neon-text">Resina Composta</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Dente 21 &mdash; anterior superior
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">05 Mar 2026, 10:30</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium shrink-0">
              Direta
            </span>
          </div>
        </div>

        {/* ── Resin Recommendation Card ── */}
        <div
          className="ai-shimmer-border rounded-xl"
          style={{ animation: 'fade-in-up 0.6s ease-out 0.2s both' }}
        >
          <div className="glass-panel rounded-xl p-5 space-y-4 ai-glow">
            {/* Resin name + badges */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-heading text-lg font-semibold">Filtek Z350 XT</h2>
                  <p className="text-sm text-muted-foreground">3M ESPE</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border font-medium">
                  Nanoparticulada
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium glow-badge">
                  No seu estoque
                </span>
              </div>
            </div>

            {/* Properties grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {properties.map((stat) => (
                <div key={stat.label} className="glass-panel rounded-xl p-3 card-elevated">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className="text-sm font-semibold mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Justification */}
            <div className="border-t border-border pt-4">
              <h4 className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">
                Justificativa IA
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Z350 XT foi selecionada por sua excelente capacidade de mimetismo estetico em restauracoes
                anteriores de Classe IV. Sua nanotecnologia proporciona polimento superior e longevidade
                cromatica, essencial para a regiao anterior com nivel estetico alto.
              </p>
            </div>
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div
          className="glass-panel rounded-xl px-3 py-2 inline-flex gap-1"
          style={{ animation: 'fade-in-up 0.6s ease-out 0.25s both' }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Protocolo ── */}
        {activeTab === 'protocolo' && (
          <div className="space-y-4" style={{ animation: 'fade-in-up 0.6s ease-out 0.3s both' }}>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Protocolo de Estratificacao
            </h3>

            {/* Layer cards */}
            {layers.map((layer, i) => {
              const colors = getLayerColor(layer.name)
              return (
                <div
                  key={layer.order}
                  className="glass-panel rounded-xl p-4 border-l-[3px]"
                  style={{
                    borderLeftColor: colors.border,
                    background: colors.bg,
                    animation: `fade-in-up 0.6s ease-out ${0.3 + i * 0.06}s both`,
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
        )}

        {/* ── Tab: Acabamento ── */}
        {activeTab === 'acabamento' && (
          <div className="space-y-4" style={{ animation: 'fade-in-up 0.6s ease-out 0.1s both' }}>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Acabamento e Polimento
            </h3>

            {[
              { order: 1, title: 'Contorno inicial', desc: 'Ponta diamantada FF (granulacao ultrafina) em alta rotacao com irrigacao', tip: 'Movimentos leves e unidirecionais' },
              { order: 2, title: 'Discos de lixa sequenciais', desc: 'Sof-Lex Pop-On (3M) — grosso, medio, fino, ultrafino', tip: 'Trocar disco a cada 10-15 segundos de uso' },
              { order: 3, title: 'Tiras de lixa interproximal', desc: 'Para contorno e acabamento das faces proximais', tip: 'Respeitar ponto de contato' },
              { order: 4, title: 'Polimento final', desc: 'Pasta diamantada (Diamond Excel FGM) com disco de feltro', tip: 'Pressao leve, movimentos circulares por 30s' },
            ].map((step) => (
              <div key={step.order} className="glass-panel rounded-xl p-4 flex gap-3 card-elevated">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center shrink-0 text-sm">
                  {step.order}
                </div>
                <div>
                  <p className="font-medium text-sm">{step.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{step.desc}</p>
                  <p className="text-sm text-muted-foreground mt-1 italic">{step.tip}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Checklist ── */}
        {activeTab === 'checklist' && (
          <div className="space-y-4" style={{ animation: 'fade-in-up 0.6s ease-out 0.1s both' }}>
            {/* Progress */}
            <div className="glass-panel rounded-xl p-4 flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-primary/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(checkedItems.size / checklist.length) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                {checkedItems.size}/{checklist.length} completos
              </span>
            </div>

            {/* Items */}
            <div className="glass-panel rounded-xl divide-y divide-border/50 overflow-hidden">
              {checklist.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleCheck(idx)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      checkedItems.has(idx) ? 'bg-success border-success' : 'border-border'
                    }`}
                  >
                    {checkedItems.has(idx) && (
                      <svg className="w-3 h-3 text-success-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm ${checkedItems.has(idx) ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {item}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: DSD ── */}
        {activeTab === 'dsd' && (
          <div className="space-y-4" style={{ animation: 'fade-in-up 0.6s ease-out 0.1s both' }}>
            <div className="glass-panel rounded-xl p-5">
              <h3 className="text-heading font-medium mb-4">Simulacao DSD</h3>
              <div className="rounded-xl bg-muted/50 h-64 flex items-center justify-center border border-border/50">
                <div className="text-center text-muted-foreground">
                  <svg className="w-12 h-12 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  <p className="text-sm">Antes / Depois</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                {['Natural', 'Clareamento', 'Gengival', 'Composicao'].map((layer, i) => (
                  <button
                    key={layer}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring cursor-pointer ${
                      i === 0
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground border border-border'
                    }`}
                  >
                    {layer}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Outras Alternativas ── */}
        <div style={{ animation: 'fade-in-up 0.6s ease-out 0.5s both' }}>
          <h3 className="text-heading font-semibold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
            Outras Alternativas
          </h3>
          <div className="space-y-3">
            {alternatives.map((alt) => (
              <div key={alt.name} className="glass-panel rounded-xl p-4 card-elevated">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-foreground">{alt.name}</span>
                  <span className="text-sm text-muted-foreground">{alt.manufacturer}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{alt.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── AI Disclaimer ── */}
        <div
          className="rounded-xl p-4 border border-warning/20 bg-warning/5 flex items-start gap-3"
          style={{ animation: 'fade-in-up 0.6s ease-out 0.55s both' }}
        >
          <svg className="w-5 h-5 text-warning shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Este protocolo e uma sugestao gerada por inteligencia artificial com base nos dados clinicos
            fornecidos. A decisao final sobre o tratamento e sempre do profissional responsavel.
          </p>
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
          <button
            onClick={() => console.log('baixar pdf')}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Baixar PDF
          </button>
          <button
            onClick={() => console.log('novo caso')}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors btn-press btn-glow focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Novo Caso
          </button>
        </div>
      </div>
    </div>
  )
}
