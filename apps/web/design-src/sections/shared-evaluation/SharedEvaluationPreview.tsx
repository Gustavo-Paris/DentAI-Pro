import '../../preview-theme.css'
import { useState } from 'react'
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Scissors,
  FileText,
  GripVertical,
  ExternalLink,
} from 'lucide-react'

/* ------------------------------------------------------------------
   SharedEvaluationPreview — Public shared evaluation page mockup.
   No sidebar, own branded header. Uses Design OS preview-theme tokens,
   glass panels, glow orbs, staggered animations.
   ------------------------------------------------------------------ */

const BRAND_NAME = 'ToSmile.ai'

const evaluations = [
  {
    tooth: '11',
    type: 'resina',
    label: 'Resina Composta',
    status: 'completed' as const,
    indication:
      'Restauração direta em resina composta com estratificação anatômica. Classe IV com envolvimento incisal. Protocolo de 4 camadas: opaco, dentina, esmalte e efeitos incisais.',
  },
  {
    tooth: '12',
    type: 'resina',
    label: 'Resina Composta',
    status: 'completed' as const,
    indication:
      'Restauração direta classe III mesial. Protocolo de 3 camadas com resina Filtek Z350 XT. Cor corpo A2, esmalte A1.',
  },
  {
    tooth: '21',
    type: 'resina',
    label: 'Resina Composta',
    status: 'completed' as const,
    indication:
      'Restauração direta em resina composta. Classe IV com fratura incisal. Estratificação com 4 camadas incluindo efeitos incisais com corante Kolor+.',
  },
  {
    tooth: '22',
    type: 'resina',
    label: 'Resina Composta',
    status: 'completed' as const,
    indication:
      'Restauração direta classe III distal. Protocolo simplificado de 2 camadas. Resina Filtek Z350 XT cor A2B e WE.',
  },
  {
    tooth: '13',
    type: 'gengivoplastia',
    label: 'Gengivoplastia',
    status: 'planned' as const,
    indication:
      'Gengivoplastia para correção de assimetria gengival. Redução de 1.5mm na margem gengival vestibular para harmonização do sorriso.',
  },
]

const dsdLayers = [
  { type: 'natural', label: 'Natural' },
  { type: 'whitening', label: 'Clareamento' },
  { type: 'gingival', label: 'Gengival' },
]

function getTreatmentColor(type: string) {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    resina: {
      bg: 'bg-primary/10',
      text: 'text-primary',
      dot: 'rgb(var(--color-primary-rgb))',
    },
    gengivoplastia: {
      bg: 'bg-pink-500/10',
      text: 'text-pink-600',
      dot: '#ec4899',
    },
  }
  return (
    map[type] || {
      bg: 'bg-muted',
      text: 'text-muted-foreground',
      dot: 'rgb(var(--color-muted-foreground-rgb))',
    }
  )
}

function TreatmentIcon({ type }: { type: string }) {
  if (type === 'gengivoplastia') return <Scissors className="w-3.5 h-3.5" />
  return <Layers className="w-3.5 h-3.5" />
}

/* ------------------------------------------------------------------ */
/* Main Preview                                                        */
/* ------------------------------------------------------------------ */

export default function SharedEvaluationPreview() {
  const [activeLayer, setActiveLayer] = useState(0)

  return (
    <div className="section-glow-bg relative min-h-screen">
      {/* Glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="glow-orb"
          style={{
            width: 450,
            height: 450,
            top: '-5%',
            right: '10%',
            background:
              'radial-gradient(circle, rgb(var(--color-primary-rgb) / 0.10) 0%, transparent 70%)',
          }}
        />
        <div
          className="glow-orb glow-orb-slow"
          style={{
            width: 350,
            height: 350,
            bottom: '10%',
            left: '-5%',
            background:
              'radial-gradient(circle, rgb(var(--color-accent-rgb) / 0.08) 0%, transparent 70%)',
          }}
        />
        <div
          className="glow-orb glow-orb-reverse"
          style={{
            width: 280,
            height: 280,
            top: '50%',
            left: '60%',
            background:
              'radial-gradient(circle, rgb(var(--accent-violet-rgb, 139 92 246) / 0.06) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Brand Header */}
      <header
        className="relative border-b backdrop-blur-sm animate-[fade-in-up_0.6s_ease-out_both]"
        style={{
          borderColor: 'rgb(var(--color-border-rgb) / 0.5)',
          background: 'rgb(var(--color-background-rgb) / 0.8)',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-lg font-bold tracking-[0.2em] font-display text-gradient-brand">
            {BRAND_NAME}
          </span>
          <span className="inline-flex items-center gap-1.5 glass-panel rounded-full px-3 py-1 text-xs font-medium text-muted-foreground">
            <Clock className="w-3 h-3" />
            Visualização compartilhada
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Summary Card */}
        <div className="glass-panel rounded-xl p-5 animate-[fade-in-up_0.6s_ease-out_0.05s_both]">
          <h1 className="text-xl font-bold text-heading font-display neon-text mb-3">
            Avaliação Odontológica
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              05 de março de 2026
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-primary" />5 dentes avaliados
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-success" />4 concluídos
            </div>
          </div>
        </div>

        {/* DSD Simulation Card */}
        <div className="glass-panel rounded-xl overflow-hidden animate-[fade-in-up_0.6s_ease-out_0.1s_both]">
          <div className="p-5 pb-0">
            <h2 className="text-lg font-bold text-heading font-display mb-4">
              Simulação DSD
            </h2>

            {/* Layer Switcher */}
            <div className="flex flex-wrap gap-2 mb-4">
              {dsdLayers.map((layer, idx) => (
                <button
                  key={layer.type}
                  onClick={() => setActiveLayer(idx)}
                  aria-pressed={idx === activeLayer}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-150 btn-press focus-visible:ring-2 focus-visible:ring-ring ${
                    idx === activeLayer
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'border border-border text-foreground hover:bg-muted'
                  }`}
                >
                  {layer.label}
                </button>
              ))}
            </div>
          </div>

          {/* Before/After Comparison Area */}
          <div className="relative w-full aspect-[16/9] overflow-hidden">
            <div className="absolute inset-0 flex">
              {/* Before side */}
              <div
                className="w-1/2 relative overflow-hidden"
                style={{
                  background:
                    'linear-gradient(135deg, rgb(var(--color-muted-rgb)) 0%, rgb(var(--color-muted-rgb) / 0.7) 100%)',
                }}
              >
                <div className="absolute inset-0 ai-grid-pattern opacity-40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {/* Tooth silhouette grid */}
                  <div className="flex gap-1 mb-3 opacity-20">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="rounded-sm"
                        style={{
                          width: i <= 2 || i >= 5 ? 10 : 14,
                          height: i <= 2 || i >= 5 ? 22 : 28,
                          background:
                            'rgb(var(--color-muted-foreground-rgb) / 0.4)',
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
                    Foto Original
                  </span>
                </div>
              </div>

              {/* After side */}
              <div
                className="w-1/2 relative overflow-hidden"
                style={{
                  background:
                    'linear-gradient(135deg, rgb(var(--color-primary-rgb) / 0.06) 0%, rgb(var(--color-primary-rgb) / 0.12) 100%)',
                }}
              >
                <div className="absolute inset-0 ai-grid-pattern opacity-30" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {/* Enhanced tooth silhouette grid */}
                  <div className="flex gap-1 mb-3 opacity-30">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="rounded-sm"
                        style={{
                          width: i <= 2 || i >= 5 ? 10 : 14,
                          height: i <= 2 || i >= 5 ? 22 : 28,
                          background: 'rgb(var(--color-primary-rgb) / 0.5)',
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'rgb(var(--color-primary-rgb) / 0.6)' }}
                  >
                    {dsdLayers[activeLayer].label}
                  </span>
                </div>
              </div>
            </div>

            {/* Center slider divider */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center">
              <div
                className="w-[2px] flex-1"
                style={{
                  background:
                    'linear-gradient(to bottom, transparent, rgb(var(--color-primary-rgb) / 0.6), transparent)',
                }}
              />
              <div
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shrink-0"
                style={{
                  boxShadow:
                    '0 0 20px rgb(var(--color-primary-rgb) / 0.3), var(--shadow-lg)',
                }}
              >
                <GripVertical className="w-4 h-4" />
              </div>
              <div
                className="w-[2px] flex-1"
                style={{
                  background:
                    'linear-gradient(to bottom, transparent, rgb(var(--color-primary-rgb) / 0.6), transparent)',
                }}
              />
            </div>

            {/* Corner labels */}
            <div className="absolute top-3 left-3">
              <span className="glass-panel rounded-md px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Antes
              </span>
            </div>
            <div className="absolute top-3 right-3">
              <span className="glass-panel rounded-md px-2 py-0.5 text-[10px] font-medium text-primary">
                Depois
              </span>
            </div>
          </div>

          {/* Proportions */}
          <div className="p-5">
            <div className="glass-panel rounded-lg p-4">
              <h3 className="text-sm font-semibold text-heading mb-3">
                Proporções Dentárias
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: '78%', label: 'Largura/Altura Central' },
                  { value: '67%', label: 'Lateral/Central' },
                  { value: '55%', label: 'Canino/Central' },
                ].map((prop) => (
                  <div key={prop.label} className="text-center">
                    <div className="text-xl font-bold text-primary">
                      {prop.value}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {prop.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Patient Document Card */}
        <div className="glass-panel rounded-xl p-5 animate-[fade-in-up_0.6s_ease-out_0.15s_both]">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-sm font-bold text-heading">
              Documento do Paciente
            </h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Paciente apresenta classe IV nos elementos 11 e 21 com envolvimento
            incisal. Classe III mesial no 12 e distal no 22. Assimetria gengival
            no 13 indicando gengivoplastia. Plano de tratamento inclui
            restaurações diretas em resina composta com estratificação anatômica
            e correção gengival.
          </p>
        </div>

        {/* Tooth Evaluation Cards */}
        <div className="space-y-3">
          {evaluations.map((e, idx) => {
            const color = getTreatmentColor(e.type)
            const isCompleted = e.status === 'completed'
            const delay = 0.2 + idx * 0.06

            return (
              <div
                key={e.tooth}
                className="glass-panel card-elevated rounded-xl p-4 flex gap-4"
                style={{
                  animation: `fade-in-up 0.6s ease-out ${delay}s both`,
                }}
              >
                {/* Tooth number */}
                <div
                  className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0"
                  style={{
                    borderLeft: `3px solid ${color.dot}`,
                  }}
                >
                  <span className="text-sm font-bold text-foreground">
                    {e.tooth}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-0.5 font-medium ${color.bg} ${color.text}`}
                    >
                      <TreatmentIcon type={e.type} />
                      {e.label}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 font-medium ${
                        isCompleted
                          ? 'bg-success/10 text-success'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                      {isCompleted ? 'Concluído' : 'Planejado'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {e.indication}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <footer
          className="text-center pt-6 pb-2 space-y-1"
          style={{ animation: 'fade-in-up 0.6s ease-out 0.5s both' }}
        >
          <p className="text-sm font-medium text-foreground/70">
            Clínica Odontológica Sorrisos
          </p>
          <p className="text-xs text-muted-foreground">
            Gerado por{' '}
            <span className="font-semibold text-gradient-brand">
              {BRAND_NAME}
            </span>
          </p>
          <p className="text-[11px] text-muted-foreground/60">
            Apoio à decisão clínica
          </p>
        </footer>

        {/* ---- Expired State Preview ---- */}
        <div className="mt-10 pt-8 border-t border-dashed border-border">
          <p className="text-xs text-muted-foreground mb-6 text-center uppercase tracking-wider font-medium">
            Estado: Link Expirado
          </p>

          <div className="glass-panel rounded-xl p-8 text-center">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5"
              style={{
                background: 'rgb(var(--color-warning-rgb) / 0.1)',
              }}
            >
              <AlertTriangle className="w-8 h-8 text-warning" />
            </div>
            <h2 className="text-xl font-bold text-heading font-display mb-2">
              Link Expirado
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
              Este link de compartilhamento não está mais disponível. Solicite
              um novo link ao profissional responsável.
            </p>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium btn-press btn-glow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors">
              <ExternalLink className="w-4 h-4" />
              Ir para {BRAND_NAME}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
