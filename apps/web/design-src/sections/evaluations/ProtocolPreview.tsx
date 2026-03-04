import '../../preview-theme.css'
import { useState } from 'react'
import {
  Layers,
  CheckCircle,
  Sparkles,
  AlertTriangle,
  Info,
  ChevronDown,
  RefreshCw,
  Download,
  Image as ImageIcon,
} from 'lucide-react'
import type { ProtocolData, ProtocolTab } from '../../../design/sections/evaluations/types'
import mockData from '../../../design/sections/evaluations/data.json'

const protocol = mockData.sampleProtocol as ProtocolData

const TABS: { key: ProtocolTab; label: string }[] = [
  { key: 'protocolo', label: 'Protocolo' },
  { key: 'acabamento', label: 'Acabamento' },
  { key: 'checklist', label: 'Checklist' },
  { key: 'dsd', label: 'DSD' },
]

function getLayerColor(name: string): {
  borderColor: string
  bgColor: string
  numberBg: string
} {
  const n = name.toLowerCase()
  if (n.includes('dentina') || n.includes('corpo'))
    return {
      borderColor: 'rgb(var(--layer-dentina-rgb))',
      bgColor: 'color-mix(in srgb, rgb(245 158 11) 8%, transparent)',
      numberBg: 'color-mix(in srgb, rgb(245 158 11) 15%, transparent)',
    }
  if (n.includes('efeito') || n.includes('corante') || n.includes('incisai'))
    return {
      borderColor: 'rgb(var(--layer-effect-rgb))',
      bgColor: 'color-mix(in srgb, rgb(139 92 246) 8%, transparent)',
      numberBg: 'color-mix(in srgb, rgb(139 92 246) 15%, transparent)',
    }
  if (n.includes('esmalte'))
    return {
      borderColor: 'rgb(var(--layer-translucido-rgb))',
      bgColor: 'color-mix(in srgb, rgb(96 165 250) 8%, transparent)',
      numberBg: 'color-mix(in srgb, rgb(96 165 250) 15%, transparent)',
    }
  if (n.includes('incisal'))
    return {
      borderColor: 'rgb(var(--layer-incisal-rgb))',
      bgColor: 'color-mix(in srgb, rgb(20 184 166) 8%, transparent)',
      numberBg: 'color-mix(in srgb, rgb(20 184 166) 15%, transparent)',
    }
  return {
    borderColor: 'var(--color-border)',
    bgColor: 'transparent',
    numberBg: 'var(--color-muted)',
  }
}

export default function ProtocolPreview() {
  const [activeTab, setActiveTab] = useState<ProtocolTab>('protocolo')
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set())
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [activeDSDLayers, setActiveDSDLayers] = useState<Set<string>>(
    new Set(protocol.dsdLayers.filter((l) => l.active).map((l) => l.type)),
  )

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const toggleDSDLayer = (type: string) => {
    setActiveDSDLayers((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  return (
    <div className="section-glow-bg relative min-h-screen p-6 sm:p-8 space-y-6">
      {/* Glow orbs */}
      <div className="glow-orb w-64 h-64 -top-20 -right-20 bg-primary/10" />
      <div className="glow-orb glow-orb-slow w-48 h-48 bottom-40 -left-20 bg-accent/10" />

      {/* ── 1. Treatment Header ── */}
      <div className="glass-panel rounded-xl p-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <Layers className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-heading">{protocol.treatmentLabel}</h1>
            <p className="text-sm text-muted-foreground">
              Dente {protocol.tooth} &middot; {protocol.region} &middot;{' '}
              {new Date(protocol.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            Direta
          </span>
        </div>
      </div>

      {/* ── 2. Resin Recommendation Card ── */}
      <div className="ai-shimmer-border rounded-xl">
        <div className="glass-panel rounded-xl p-5 space-y-4">
          {/* Top row */}
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <span className="text-lg font-semibold">{protocol.resin.name}</span>
            <span className="text-muted-foreground"> &mdash; {protocol.resin.manufacturer}</span>
          </div>

          {/* Properties grid */}
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ['Opacidade', protocol.resin.opacity],
                ['Resistencia', protocol.resin.resistance],
                ['Polimento', protocol.resin.polishing],
                ['Estetica', protocol.resin.aesthetics],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="bg-secondary/30 rounded-xl p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="text-sm font-medium mt-1">{value}</p>
              </div>
            ))}
          </div>

          {/* Separator */}
          <div className="h-px bg-border my-2" />

          {/* Justification */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {protocol.resin.justification}
          </p>

          {/* Inventory badge */}
          {protocol.resin.isFromInventory && (
            <span className="inline-block bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full border border-primary/20">
              &#10003; No Estoque
            </span>
          )}
        </div>
      </div>

      {/* ── 3. Tab Bar ── */}
      <div className="glass-panel rounded-xl px-3 py-2 inline-flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
              activeTab === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 4. Tab Content ── */}

      {/* Tab: Protocolo */}
      {activeTab === 'protocolo' && (
        <div className="space-y-4">
          {/* Layer Cards */}
          {protocol.layers.map((layer) => {
            const colors = getLayerColor(layer.name)
            return (
              <div
                key={layer.order}
                className="glass-panel rounded-xl p-4 border-l-4"
                style={{
                  borderLeftColor: colors.borderColor,
                  background: colors.bgColor,
                }}
              >
                {/* Header row */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full font-semibold flex items-center justify-center text-sm"
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

                {/* Content grid */}
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 mt-3">
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase tracking-wider">
                      Resina
                    </dt>
                    <dd className="text-sm font-medium">{layer.resin_brand}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase tracking-wider">Cor</dt>
                    <dd className="text-sm font-medium">{layer.shade}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase tracking-wider">
                      Espessura
                    </dt>
                    <dd className="text-sm font-medium">{layer.thickness}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-muted-foreground uppercase tracking-wider">
                      Tecnica
                    </dt>
                    <dd className="text-sm font-medium">{layer.technique}</dd>
                  </div>
                </dl>
              </div>
            )
          })}

          {/* Alternative Card */}
          <div className="glass-panel rounded-xl p-4 bg-muted/30">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Alternativa Simplificada</p>
                <p className="text-sm mt-1">
                  {protocol.alternative.resin} &mdash; {protocol.alternative.shade}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tecnica: {protocol.alternative.technique}
                </p>
                <div className="h-px bg-border my-2" />
                <p className="text-sm text-muted-foreground italic">
                  {protocol.alternative.tradeoff}
                </p>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {protocol.alerts.map((alert, idx) => (
            <div
              key={`alert-${idx}`}
              className="rounded-xl p-4 border border-primary/20 bg-primary/5 flex items-start gap-3"
            >
              <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm">{alert}</p>
            </div>
          ))}

          {/* Warnings */}
          {protocol.warnings.map((warning, idx) => (
            <div
              key={`warning-${idx}`}
              className="rounded-xl p-4 border border-warning/20 bg-warning/5 flex items-start gap-3"
            >
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
              <p className="text-sm">{warning}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Acabamento */}
      {activeTab === 'acabamento' && (
        <div className="space-y-6">
          {/* Contouring */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Contorno
            </h3>
            {protocol.finishing.contouring.map((step) => (
              <div key={step.order} className="glass-panel rounded-xl p-4 flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center shrink-0 text-sm">
                  {step.order}
                </div>
                <div>
                  <p className="font-medium text-sm">{step.tool}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.speed} &middot; {step.time}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 italic">{step.tip}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Polishing */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Polimento
            </h3>
            {protocol.finishing.polishing.map((step) => (
              <div key={step.order} className="glass-panel rounded-xl p-4 flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center shrink-0 text-sm">
                  {step.order}
                </div>
                <div>
                  <p className="font-medium text-sm">{step.tool}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.speed} &middot; {step.time}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 italic">{step.tip}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Final Glaze */}
          <div className="glass-panel rounded-xl p-4 bg-primary/5 border border-primary/10">
            <p className="font-medium text-sm">Glazeamento Final</p>
            <p className="text-sm text-muted-foreground mt-1">{protocol.finishing.finalGlaze}</p>
          </div>

          {/* Maintenance */}
          <div className="glass-panel rounded-xl p-4 bg-muted/30">
            <p className="font-medium text-sm">Manutencao</p>
            <p className="text-sm text-muted-foreground mt-1">
              {protocol.finishing.maintenanceAdvice}
            </p>
          </div>
        </div>
      )}

      {/* Tab: Checklist */}
      {activeTab === 'checklist' && (
        <div className="space-y-3">
          {/* Progress */}
          <div className="glass-panel rounded-xl p-4 flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-primary/20">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${(checkedItems.size / protocol.checklist.length) * 100}%`,
                }}
              />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {checkedItems.size}/{protocol.checklist.length} completos
            </span>
          </div>

          {/* Items */}
          {protocol.checklist.map((item, idx) => (
            <button
              key={idx}
              onClick={() => toggleCheck(idx)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  checkedItems.has(idx) ? 'bg-primary border-primary' : 'border-border'
                }`}
              >
                {checkedItems.has(idx) && (
                  <svg
                    className="w-3 h-3 text-primary-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span
                className={`text-sm ${checkedItems.has(idx) ? 'line-through text-muted-foreground' : ''}`}
              >
                {item}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Tab: DSD */}
      {activeTab === 'dsd' && (
        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-5">
            <h3 className="font-medium mb-4">Simulacao DSD</h3>
            {/* Image placeholder */}
            <div className="rounded-xl bg-muted h-64 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Antes / Depois</p>
              </div>
            </div>
            {/* Layer toggles */}
            <div className="flex gap-2 mt-4">
              {protocol.dsdLayers.map((layer) => {
                const isActive = activeDSDLayers.has(layer.type)
                return (
                  <button
                    key={layer.type}
                    onClick={() => toggleDSDLayer(layer.type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground border border-border'
                    }`}
                  >
                    {layer.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 5. Case Summary (collapsible) ── */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <button
          onClick={() => setSummaryOpen(!summaryOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="font-medium text-sm">Resumo Clinico</span>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${summaryOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {summaryOpen && (
          <div className="px-4 pb-4 grid grid-cols-2 gap-3">
            {(
              [
                ['Idade', `${protocol.caseSummary.patientAge} anos`],
                ['Dente', protocol.caseSummary.tooth],
                ['Regiao', protocol.caseSummary.region],
                ['Classe', protocol.caseSummary.cavityClass],
                ['Tamanho', protocol.caseSummary.restorationSize],
                ['Cor', protocol.caseSummary.toothColor],
                ['Nivel Estetico', protocol.caseSummary.aestheticLevel],
                ['Bruxismo', protocol.caseSummary.bruxism ? 'Sim' : 'Nao'],
                ['Budget', protocol.caseSummary.budget],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-sm font-medium mt-0.5">{value}</dd>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 6. Disclaimer ── */}
      <div className="rounded-xl p-4 border border-warning/20 bg-warning/5 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          Este protocolo e uma sugestao gerada por inteligencia artificial com base nos dados
          clinicos fornecidos. A decisao final sobre o tratamento e sempre do profissional
          responsavel.
        </p>
      </div>

      {/* ── 7. Footer Actions ── */}
      <div className="flex items-center justify-end gap-3">
        <button className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Recalcular
        </button>
        <button className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2">
          <Download className="h-4 w-4" />
          Baixar PDF
        </button>
        <button className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors btn-press btn-glow focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Novo Caso
        </button>
      </div>
    </div>
  )
}
