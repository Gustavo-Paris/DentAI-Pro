import { useState } from 'react'
import {
  ClipboardCheck,
  Check,
  Sparkles,
  Shield,
  ChevronDown,
  Wand2,
} from 'lucide-react'
import type {
  AnalysisResult,
  ToothDetection,
  TreatmentType,
  BudgetTier,
  PatientData,
} from '../../../../design/sections/wizard/types'
import DentalArchDiagram from './DentalArchDiagram'

const TREATMENT_BORDER_COLORS: Record<string, string> = {
  resina: 'var(--color-primary)',
  porcelana: 'var(--color-warning)',
  coroa: '#a855f7',
  implante: 'var(--color-destructive)',
  endodontia: '#f43f5e',
  encaminhamento: 'var(--color-muted-foreground)',
  gengivoplastia: '#ec4899',
  recobrimento_radicular: 'var(--color-success)',
}

const PRIORITY_COLORS: Record<string, string> = {
  alta: 'bg-destructive/10 text-destructive',
  'média': 'bg-warning/10 text-warning',
  baixa: 'bg-muted text-muted-foreground',
}

const CONFIDENCE_STYLES: Record<string, string> = {
  alta: 'from-success/10 to-success/5 border-success/20 text-success',
  'média': 'from-warning/10 to-warning/5 border-warning/20 text-warning',
  baixa: 'from-destructive/10 to-destructive/5 border-destructive/20 text-destructive',
}

const TREATMENT_OPTIONS: TreatmentType[] = [
  'resina',
  'porcelana',
  'coroa',
  'implante',
  'endodontia',
  'encaminhamento',
  'gengivoplastia',
  'recobrimento_radicular',
]

interface ReviewStepProps {
  analysisResult?: AnalysisResult | null
  selectedTeeth?: string[]
  toothTreatments?: Record<string, TreatmentType>
  patientData?: PatientData | null
  budget?: BudgetTier
  clinicalNotes?: string
  onToggleTooth?: (tooth: string) => void
  onChangeTreatment?: (tooth: string, treatment: TreatmentType) => void
  onUpdatePatient?: (data: Partial<PatientData>) => void
  onSetBudget?: (tier: BudgetTier) => void
}

function ConfidenceBanner({ confidence }: { confidence: string }) {
  const cls =
    CONFIDENCE_STYLES[confidence as keyof typeof CONFIDENCE_STYLES] ||
    CONFIDENCE_STYLES['média']

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${cls} border`}
    >
      <Sparkles className="w-4 h-4 shrink-0" />
      <div className="flex-1">
        <span className="text-sm font-medium">Confianca {confidence}</span>
        <span className="text-xs opacity-70 ml-2">na analise da IA</span>
      </div>
    </div>
  )
}

function ToothCard({
  tooth,
  selected,
  treatment,
  onToggle,
  onChangeTreatment,
}: {
  tooth: ToothDetection
  selected: boolean
  treatment: TreatmentType
  onToggle: () => void
  onChangeTreatment: (treatment: TreatmentType) => void
}) {
  const [showDropdown, setShowDropdown] = useState(false)
  const borderColor =
    TREATMENT_BORDER_COLORS[treatment] || 'var(--color-muted-foreground)'
  const priorityCls = PRIORITY_COLORS[tooth.priority] || PRIORITY_COLORS.baixa

  return (
    <div
      className={`relative rounded-lg border p-3 cursor-pointer transition-all hover:shadow-sm
                 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                   selected
                     ? 'border-primary/40 bg-primary/5 shadow-sm'
                     : 'border-border hover:border-primary/20'
                 }`}
      style={{ borderLeftWidth: 4, borderLeftColor: borderColor }}
      onClick={onToggle}
      tabIndex={0}
      role="checkbox"
      aria-checked={selected}
      aria-label={`Dente ${tooth.tooth}, ${treatment}, prioridade ${tooth.priority}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-sm text-foreground">
            {tooth.tooth}
          </span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full ${priorityCls}`}
          >
            {tooth.priority}
          </span>
        </div>
        <div
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
            selected ? 'bg-primary border-primary' : 'border-border'
          }`}
        >
          {selected && (
            <Check className="w-3 h-3 text-primary-foreground" />
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">
        {tooth.findings.join('. ')}
      </p>

      {/* Treatment dropdown */}
      {selected && (
        <div className="mt-2 flex items-center gap-1 relative">
          <span className="text-xs text-muted-foreground">Tratamento:</span>
          <button
            className="inline-flex items-center gap-1 text-xs font-medium text-foreground
                     px-2 py-0.5 rounded bg-muted hover:bg-muted/80 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              setShowDropdown(!showDropdown)
            }}
          >
            {treatment.replace('_', ' ')}
            <ChevronDown className="w-3 h-3" />
          </button>
          <button
            className="p-0.5 text-muted-foreground hover:text-primary transition-colors"
            title="Restaurar sugestao IA"
            onClick={(e) => {
              e.stopPropagation()
              onChangeTreatment(tooth.treatment_type)
            }}
          >
            <Wand2 className="w-3 h-3" />
          </button>

          {/* Dropdown menu */}
          {showDropdown && (
            <div
              className="absolute top-full left-0 mt-1 z-20 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px]"
              onClick={(e) => e.stopPropagation()}
            >
              {TREATMENT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors capitalize ${
                    opt === treatment
                      ? 'text-primary font-medium'
                      : 'text-foreground'
                  }`}
                  onClick={() => {
                    onChangeTreatment(opt)
                    setShowDropdown(false)
                  }}
                >
                  {opt.replace('_', ' ')}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CaseSummaryCard({
  selectedCount,
  patientName,
  confidence,
  budget,
}: {
  selectedCount: number
  patientName: string
  confidence: string
  budget: BudgetTier
}) {
  const complexity =
    selectedCount <= 2
      ? 'simples'
      : selectedCount <= 5
        ? 'moderado'
        : 'complexo'
  const complexityColor: Record<string, string> = {
    simples: 'text-success',
    moderado: 'text-warning',
    complexo: 'text-destructive',
  }

  return (
    <div className="ai-glow rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">
          Resumo do Caso
        </h4>
        <div
          className={`flex items-center gap-1 text-xs font-medium ${complexityColor[complexity] || ''}`}
        >
          <Shield className="w-3.5 h-3.5" />
          {complexity}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-muted-foreground">Paciente</span>
          <p className="font-medium text-foreground">
            {patientName || '\u2014'}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Orcamento</span>
          <p className="font-medium text-foreground capitalize">
            {budget === 'padrao' ? 'Padrao' : 'Premium'}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Dentes</span>
          <p className="font-medium text-foreground">
            {selectedCount} selecionados
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Confianca IA</span>
          <p className="font-medium text-foreground capitalize">
            {confidence}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ReviewStep({
  analysisResult = null,
  selectedTeeth = [],
  toothTreatments = {},
  patientData = null,
  budget = 'padrao',
  onToggleTooth,
  onChangeTreatment,
  onUpdatePatient,
  onSetBudget,
}: ReviewStepProps) {
  if (!analysisResult) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">
          Nenhuma analise disponivel
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 glow-icon">
          <ClipboardCheck className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-heading neon-text">
          Revisao
        </h2>
      </div>

      {/* Case summary card */}
      <CaseSummaryCard
        selectedCount={selectedTeeth.length}
        patientName={patientData?.name || ''}
        confidence={analysisResult.confidence}
        budget={budget}
      />

      {/* Confidence banner */}
      <ConfidenceBanner confidence={analysisResult.confidence} />

      {/* Dental arch diagram */}
      <div className="glass-panel rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 text-center">
          Arcada Dental
        </h3>
        <DentalArchDiagram
          selectedTeeth={selectedTeeth}
          toothTreatments={toothTreatments}
          onToggleTooth={onToggleTooth}
        />
      </div>

      {/* Tooth cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">
            Dentes Detectados
          </h3>
          <span className="text-xs text-muted-foreground">
            {selectedTeeth.length} de{' '}
            {analysisResult.detected_teeth.length} selecionados
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {analysisResult.detected_teeth.map((tooth) => (
            <ToothCard
              key={tooth.tooth}
              tooth={tooth}
              selected={selectedTeeth.includes(tooth.tooth)}
              treatment={
                toothTreatments[tooth.tooth] || tooth.treatment_type
              }
              onToggle={() => onToggleTooth?.(tooth.tooth)}
              onChangeTreatment={(t) =>
                onChangeTreatment?.(tooth.tooth, t)
              }
            />
          ))}
        </div>
      </div>

      {/* Patient form */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          Dados do Paciente
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Nome do Paciente
            </label>
            <input
              type="text"
              defaultValue={patientData?.name || ''}
              placeholder="Nome completo"
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm
                       focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
              onChange={(e) =>
                onUpdatePatient?.({ name: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Data de Nascimento
            </label>
            <input
              type="date"
              defaultValue={patientData?.birthDate || ''}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm
                       focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
              onChange={(e) =>
                onUpdatePatient?.({ birthDate: e.target.value })
              }
            />
            {patientData?.age && (
              <span className="text-xs text-muted-foreground mt-1 block">
                {patientData.age} anos
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Budget toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
        <span className="text-sm font-medium text-foreground">Orcamento</span>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(['padrao', 'premium'] as BudgetTier[]).map((tier) => (
            <button
              key={tier}
              className={`px-3 py-1.5 text-xs font-medium transition-colors
                         focus-visible:ring-2 focus-visible:ring-ring ${
                           budget === tier
                             ? 'bg-primary text-primary-foreground'
                             : 'text-muted-foreground hover:text-foreground'
                         }`}
              onClick={() => onSetBudget?.(tier)}
            >
              {tier === 'padrao' ? 'Padrao' : 'Premium'}
            </button>
          ))}
        </div>
      </div>

      {/* Clinical notes */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Notas Clinicas
        </label>
        <textarea
          rows={3}
          placeholder="Notas clinicas opcionais..."
          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm resize-none
                   focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
        />
      </div>
    </div>
  )
}
