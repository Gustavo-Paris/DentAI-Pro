import React, { useState } from 'react'
import {
  Calendar,
  Layers,
  Scissors,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Sample data (hardcoded for visual mockup)                          */
/* ------------------------------------------------------------------ */

const BRAND_NAME = 'ToSmile.ai'

const evaluations = [
  {
    tooth: '11',
    treatmentType: 'resina',
    treatmentLabel: 'Resina Composta',
    status: 'completed' as const,
    aiIndication:
      'Restauração direta em resina composta com estratificação anatômica. Classe IV com envolvimento incisal. Protocolo de 4 camadas: opaco, dentina, esmalte e efeitos incisais.',
  },
  {
    tooth: '12',
    treatmentType: 'resina',
    treatmentLabel: 'Resina Composta',
    status: 'completed' as const,
    aiIndication:
      'Restauração direta classe III mesial. Protocolo de 3 camadas com resina Filtek Z350 XT. Cor corpo A2, esmalte A1.',
  },
  {
    tooth: '21',
    treatmentType: 'resina',
    treatmentLabel: 'Resina Composta',
    status: 'completed' as const,
    aiIndication:
      'Restauração direta em resina composta. Classe IV com fratura incisal. Estratificação com 4 camadas incluindo efeitos incisais com corante Kolor+.',
  },
  {
    tooth: '22',
    treatmentType: 'resina',
    treatmentLabel: 'Resina Composta',
    status: 'completed' as const,
    aiIndication:
      'Restauração direta classe III distal. Protocolo simplificado de 2 camadas. Resina Filtek Z350 XT cor A2B e WE.',
  },
  {
    tooth: '13',
    treatmentType: 'gengivoplastia',
    treatmentLabel: 'Gengivoplastia',
    status: 'planned' as const,
    aiIndication:
      'Gengivoplastia para correção de assimetria gengival. Redução de 1.5mm na margem gengival vestibular para harmonização do sorriso.',
  },
]

const dsdLayers = [
  { type: 'natural', label: 'Natural', includesGingivo: false },
  { type: 'whitening', label: 'Clareamento', includesGingivo: false },
  { type: 'gingival', label: 'Gengival', includesGingivo: true },
]

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function getTreatmentStyle(type: string) {
  const map: Record<string, { bg: string; text: string }> = {
    resina: { bg: 'bg-primary/10', text: 'text-primary' },
    gengivoplastia: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-600',
    },
    faceta: { bg: 'bg-violet-500/10', text: 'text-violet-600' },
    clareamento: { bg: 'bg-sky-500/10', text: 'text-sky-600' },
  }
  return map[type] || { bg: 'bg-muted', text: 'text-muted-foreground' }
}

function TreatmentIcon({ type }: { type: string }) {
  if (type === 'gengivoplastia') return <Scissors className="h-4 w-4" />
  return <Layers className="h-4 w-4" />
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SharedHeader() {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <span className="text-lg font-semibold tracking-[0.2em] font-display text-gradient-brand">
          {BRAND_NAME}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
          <Clock className="w-3 h-3" />
          Visualização compartilhada
        </span>
      </div>
    </header>
  )
}

function SummaryCard() {
  return (
    <div className="glass-panel rounded-xl shadow-sm mb-6 animate-[fade-in-up_0.6s_ease-out_both]">
      <div className="p-5">
        <h1 className="text-xl font-semibold font-display text-heading mb-2">
          Avaliação Odontológica
        </h1>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            05 de março de 2026
          </div>
          <span>5 dentes avaliados</span>
          <span>4/5 concluídos</span>
        </div>
      </div>
    </div>
  )
}

function DSDSimulationCard() {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <div className="glass-panel rounded-xl shadow-sm mb-6 overflow-hidden animate-[fade-in-up_0.6s_ease-out_0.1s_both]">
      <div className="p-5">
        <h2 className="text-lg font-semibold font-display text-heading mb-4">
          Simulação DSD
        </h2>

        {/* Layer Switcher */}
        <div className="flex flex-wrap gap-2 mb-4">
          {dsdLayers.map((layer, idx) => (
            <button
              key={layer.type}
              onClick={() => setActiveIndex(idx)}
              aria-pressed={idx === activeIndex}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 focus-visible:ring-2 focus-visible:ring-ring ${
                idx === activeIndex
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border border-border text-foreground hover:bg-muted'
              }`}
            >
              {layer.label}
              {layer.includesGingivo && (
                <span className="ml-1 rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-[10px]">
                  Gengiva
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Before/After Comparison Placeholder */}
        <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-muted">
          <div className="absolute inset-0 flex">
            {/* Before side */}
            <div className="w-1/2 bg-gradient-to-br from-muted to-muted-foreground/5 flex items-center justify-center border-r-2 border-dashed border-border">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                  <span className="text-2xl text-muted-foreground/40">A</span>
                </div>
                <span className="text-xs text-muted-foreground">Antes</span>
              </div>
            </div>
            {/* After side */}
            <div className="w-1/2 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl text-primary/40">D</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {dsdLayers[activeIndex].label}
                </span>
              </div>
            </div>
          </div>
          {/* Slider handle */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-primary/60 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg text-xs font-bold">
              &lt;&gt;
            </div>
          </div>
        </div>

        {/* Proportions */}
        <div className="mt-4 glass-panel rounded-lg p-4">
          <h3 className="text-sm font-semibold text-heading mb-3">
            Proporções Dentárias
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-primary">78%</div>
              <div className="text-[11px] text-muted-foreground">
                Largura/Altura Central
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-primary">67%</div>
              <div className="text-[11px] text-muted-foreground">
                Lateral/Central
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-primary">55%</div>
              <div className="text-[11px] text-muted-foreground">
                Canino/Central
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PatientDocumentCard() {
  return (
    <div className="glass-panel rounded-xl shadow-sm mb-6 p-5 animate-[fade-in-up_0.6s_ease-out_0.15s_both]">
      <h2 className="text-sm font-semibold text-heading mb-2">
        Documento do Paciente
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Paciente apresenta classe IV nos elementos 11 e 21 com envolvimento
        incisal. Classe III mesial no 12 e distal no 22. Assimetria gengival no
        13 indicando gengivoplastia. Plano de tratamento inclui restaurações
        diretas em resina composta com estratificação anatômica e correção
        gengival.
      </p>
    </div>
  )
}

function ToothCard({
  tooth,
  treatmentType,
  treatmentLabel,
  status,
  aiIndication,
}: {
  tooth: string
  treatmentType: string
  treatmentLabel: string
  status: 'completed' | 'planned'
  aiIndication: string
}) {
  const style = getTreatmentStyle(treatmentType)
  const isCompleted = status === 'completed'

  return (
    <div className="glass-panel rounded-xl p-4 flex gap-4">
      {/* Tooth number */}
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
        <span className="text-sm font-bold text-foreground">{tooth}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-0.5 font-medium ${style.bg} ${style.text}`}
          >
            <TreatmentIcon type={treatmentType} />
            {treatmentLabel}
          </span>
          <span
            className={`text-xs rounded-full px-2 py-0.5 font-medium ${
              isCompleted
                ? 'bg-success/10 text-success'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {isCompleted ? 'Concluído' : 'Planejado'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
          {aiIndication}
        </p>
      </div>
    </div>
  )
}

function FooterAttribution() {
  return (
    <p className="text-center text-xs text-muted-foreground mt-8">
      Clínica Odontológica Sorrisos &middot; Gerado por {BRAND_NAME} &middot;
      Apoio à decisão clínica
    </p>
  )
}

/* ------------------------------------------------------------------ */
/* Expired state preview                                              */
/* ------------------------------------------------------------------ */

function ExpiredPreview() {
  return (
    <div className="min-h-[300px] bg-background flex items-center justify-center px-4 rounded-xl border border-dashed border-border">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold font-display mb-2 text-heading">
          Link Expirado
        </h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Este link de compartilhamento não está mais disponível. Solicite um
          novo link ao profissional responsável.
        </p>
        <button className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-ring">
          Ir para {BRAND_NAME}
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Main Preview                                                       */
/* ------------------------------------------------------------------ */

export default function SharedEvaluationPreview() {
  return (
    <div className="section-glow-bg relative min-h-screen">
      {/* Glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="glow-orb glow-orb-slow w-72 h-72 bg-primary/10 -top-24 -right-24" />
        <div className="glow-orb glow-orb-reverse w-48 h-48 bg-accent/8 bottom-32 -left-16" />
      </div>

      {/* Header */}
      <SharedHeader />

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl relative">
        {/* Summary */}
        <SummaryCard />

        {/* DSD Simulation */}
        <DSDSimulationCard />

        {/* Patient Document */}
        <PatientDocumentCard />

        {/* Tooth Cards */}
        <div className="space-y-4 animate-[fade-in-up_0.6s_ease-out_0.2s_both]">
          {evaluations.map((e) => (
            <ToothCard
              key={e.tooth}
              tooth={e.tooth}
              treatmentType={e.treatmentType}
              treatmentLabel={e.treatmentLabel}
              status={e.status}
              aiIndication={e.aiIndication}
            />
          ))}
        </div>

        {/* Footer */}
        <FooterAttribution />

        {/* Expired State Preview (for reference) */}
        <div className="mt-12 pt-8 border-t border-dashed border-border">
          <p className="text-xs text-muted-foreground mb-4 text-center uppercase tracking-wider">
            Estado: Link Expirado
          </p>
          <ExpiredPreview />
        </div>
      </main>
    </div>
  )
}
