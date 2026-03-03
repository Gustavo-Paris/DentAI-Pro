import '../../preview-theme.css'
import { useState } from 'react'
import { ClipboardCheck, Check, Sparkles, Shield, ChevronDown, Wand2 } from 'lucide-react'
import type { AnalysisResult, ToothDetection, TreatmentType, BudgetTier } from '../../../design/sections/wizard/types'
import sampleData from '../../../design/sections/wizard/data.json'

const TREATMENT_COLORS: Record<string, string> = {
  resina: '#3b82f6', porcelana: '#f59e0b', coroa: '#a855f7',
  implante: '#ef4444', endodontia: '#f43f5e', encaminhamento: '#6b7280',
  gengivoplastia: '#ec4899', recobrimento_radicular: '#14b8a6',
}
const TREATMENT_COLOR_FALLBACK = '#6b7280'

const DEFAULT_ANALYSIS = sampleData.sampleAnalysis as AnalysisResult

const TABS = [
  { key: 'dentes' as const, label: 'Dentes' },
  { key: 'tratamento' as const, label: 'Tratamento' },
  { key: 'paciente' as const, label: 'Paciente' },
  { key: 'resumo' as const, label: 'Resumo' },
]

interface ReviewStepProps {
  analysisResult?: AnalysisResult
  selectedTeeth?: string[]
  toothTreatments?: Record<string, TreatmentType>
  patientName?: string
  patientAge?: number | null
  budget?: BudgetTier
  onToggleTooth?: (tooth: string) => void
  onChangeTreatment?: (tooth: string, treatment: TreatmentType) => void
  onSetBudget?: (tier: BudgetTier) => void
}

function ConfidenceBanner({ confidence }: { confidence: string }) {
  const colors = {
    alta: 'from-success/10 to-success/5 border-success/20 text-success',
    média: 'from-warning/10 to-warning/5 border-warning/20 text-warning',
    baixa: 'from-destructive/10 to-destructive/5 border-destructive/20 text-destructive',
  }
  const cls = colors[confidence as keyof typeof colors] || colors.média

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${cls} border`}>
      <Sparkles className="w-4 h-4 shrink-0" />
      <div className="flex-1">
        <span className="text-sm font-medium">Confiança {confidence}</span>
        <span className="text-xs opacity-70 ml-2">na análise da IA</span>
      </div>
    </div>
  )
}

function ToothCard({
  tooth,
  selected,
  treatment,
  onToggle,
}: {
  tooth: ToothDetection
  selected: boolean
  treatment: TreatmentType
  onToggle: () => void
}) {
  const color = TREATMENT_COLORS[treatment] || TREATMENT_COLOR_FALLBACK
  const priorityColors = {
    alta: 'bg-destructive/10 text-destructive',
    média: 'bg-warning/10 text-warning',
    baixa: 'bg-muted text-muted-foreground',
  }

  return (
    <div
      className={`relative rounded-lg border p-3 cursor-pointer transition-all ${
        selected
          ? 'border-primary/40 bg-primary/5 shadow-sm'
          : 'border-border hover:border-primary/20'
      }`}
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
      onClick={onToggle}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-sm">{tooth.tooth}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${priorityColors[tooth.priority]}`}>
            {tooth.priority}
          </span>
        </div>
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
          selected ? 'bg-primary border-primary' : 'border-border'
        }`}>
          {selected && <Check className="w-3 h-3 text-primary-foreground" />}
        </div>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">
        {tooth.findings.join('. ')}
      </p>
      {selected && (
        <div className="mt-2 flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Tratamento:</span>
          <button className="inline-flex items-center gap-1 text-xs font-medium text-foreground
                           px-2 py-0.5 rounded bg-muted hover:bg-muted/80">
            {treatment}
            <ChevronDown className="w-3 h-3" />
          </button>
          <button className="p-0.5 text-muted-foreground hover:text-primary" title="Restaurar sugestão IA">
            <Wand2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}

function CaseSummary({
  selectedCount,
  patientName,
  patientAge,
  confidence,
}: {
  selectedCount: number
  patientName: string
  patientAge: number | null
  confidence: string
}) {
  const complexity = selectedCount <= 2 ? 'simples' : selectedCount <= 5 ? 'moderado' : 'complexo'
  const complexityColor = {
    simples: 'text-success',
    moderado: 'text-warning',
    complexo: 'text-destructive',
  }

  return (
    <div className="ai-glow rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Resumo do Caso</h4>
        <div className={`flex items-center gap-1 text-xs font-medium ${complexityColor[complexity]}`}>
          <Shield className="w-3.5 h-3.5" />
          {complexity}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Paciente</span>
          <p className="font-medium">{patientName || '—'}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Idade</span>
          <p className="font-medium">{patientAge ? `${patientAge} anos` : '—'}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Dentes</span>
          <p className="font-medium">{selectedCount} selecionados</p>
        </div>
        <div>
          <span className="text-muted-foreground">Confiança IA</span>
          <p className="font-medium capitalize">{confidence}</p>
        </div>
      </div>
    </div>
  )
}

function DentesTab({
  teeth,
  selectedTeeth,
  treatments,
  onToggleTooth,
}: {
  teeth: ToothDetection[]
  selectedTeeth: string[]
  treatments: Record<string, TreatmentType>
  onToggleTooth: (tooth: string) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Dentes Detectados</h3>
        <div className="flex gap-1.5">
          {[
            { label: 'Todos', title: undefined },
            { label: 'Obrigatórios', title: 'Dentes com alta prioridade detectados pela IA' },
            { label: 'Limpar', title: undefined },
          ].map(({ label, title }) => (
            <button
              key={label}
              title={title}
              className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground
                         hover:bg-primary/10 hover:text-primary transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {teeth.map(tooth => (
          <ToothCard
            key={tooth.tooth}
            tooth={tooth}
            selected={selectedTeeth.includes(tooth.tooth)}
            treatment={treatments[tooth.tooth] || tooth.treatment_type}
            onToggle={() => onToggleTooth(tooth.tooth)}
          />
        ))}
      </div>
    </div>
  )
}

function TratamentoTab({
  teeth,
  selectedTeeth,
  treatments,
}: {
  teeth: ToothDetection[]
  selectedTeeth: string[]
  treatments: Record<string, TreatmentType>
}) {
  // Group selected teeth by treatment type
  const groups = new Map<string, string[]>()
  for (const tooth of teeth) {
    if (!selectedTeeth.includes(tooth.tooth)) continue
    const type = treatments[tooth.tooth] || tooth.treatment_type
    const arr = groups.get(type) || []
    arr.push(tooth.tooth)
    groups.set(type, arr)
  }

  return (
    <div className="space-y-3">
      {Array.from(groups.entries()).map(([type, toothIds]) => (
        <div
          key={type}
          className="flex items-center gap-3 p-3 rounded-lg border border-border"
          style={{ borderLeftWidth: 4, borderLeftColor: TREATMENT_COLORS[type] || TREATMENT_COLOR_FALLBACK }}
        >
          <div className="flex-1">
            <p className="text-sm font-medium capitalize">{type}</p>
            <p className="text-xs text-muted-foreground">
              {toothIds.length} dente{toothIds.length > 1 ? 's' : ''}: {toothIds.join(', ')}
            </p>
          </div>
        </div>
      ))}
      {groups.size === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhum dente selecionado</p>
      )}
    </div>
  )
}

function PacienteTab({
  patientName,
  patientAge,
}: {
  patientName: string
  patientAge: number | null
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nome do Paciente</label>
        <input
          type="text"
          defaultValue={patientName}
          readOnly
          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Idade</label>
        <input
          type="text"
          defaultValue={patientAge ? `${patientAge} anos` : ''}
          readOnly
          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Notas Clínicas</label>
        <textarea
          rows={3}
          placeholder="Notas clínicas opcionais..."
          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm resize-none"
        />
      </div>
    </div>
  )
}

function ResumoTab({
  selectedCount,
  patientName,
  patientAge,
  confidence,
  budget,
  onSetBudget,
}: {
  selectedCount: number
  patientName: string
  patientAge: number | null
  confidence: string
  budget: BudgetTier
  onSetBudget: (tier: BudgetTier) => void
}) {
  return (
    <div className="space-y-4">
      {/* Budget toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
        <span className="text-sm font-medium">Orçamento</span>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(['padrao', 'premium'] as BudgetTier[]).map(tier => (
            <button
              key={tier}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                budget === tier
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => onSetBudget(tier)}
            >
              {tier === 'padrao' ? 'Padrão' : 'Premium'}
            </button>
          ))}
        </div>
      </div>

      {/* Case summary */}
      <CaseSummary
        selectedCount={selectedCount}
        patientName={patientName}
        patientAge={patientAge}
        confidence={confidence}
      />
    </div>
  )
}

export default function ReviewStep({
  analysisResult = DEFAULT_ANALYSIS,
  selectedTeeth: initialSelectedTeeth,
  toothTreatments: initialToothTreatments,
  patientName = sampleData.samplePatient.name,
  patientAge = sampleData.samplePatient.age,
  budget: controlledBudget,
  onToggleTooth: externalToggle,
  onChangeTreatment = () => {},
  onSetBudget: externalSetBudget,
}: ReviewStepProps = {}) {
  // Internal state for standalone preview
  const [internalSelected, setInternalSelected] = useState<string[]>(['11', '21', '12', '14'])
  const [internalBudget, setInternalBudget] = useState<BudgetTier>('padrao')
  const [activeTab, setActiveTab] = useState<'dentes' | 'tratamento' | 'paciente' | 'resumo'>('dentes')

  const selectedTeeth = initialSelectedTeeth ?? internalSelected
  const toothTreatments = initialToothTreatments ?? { '11': 'resina' as TreatmentType, '21': 'resina' as TreatmentType, '12': 'resina' as TreatmentType, '14': 'gengivoplastia' as TreatmentType }
  const budget = controlledBudget ?? internalBudget

  const onToggleTooth = externalToggle ?? ((tooth: string) => {
    setInternalSelected(prev => prev.includes(tooth) ? prev.filter(t => t !== tooth) : [...prev, tooth])
  })
  const onSetBudget = externalSetBudget ?? setInternalBudget

  return (
    <div className="wizard-stage space-y-5">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 glow-icon">
          <ClipboardCheck className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-heading neon-text">Revisão</h2>
      </div>

      {/* Confidence (always visible) */}
      <ConfidenceBanner confidence={analysisResult.confidence} />

      {/* Tab bar */}
      <div className="wizard-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`wizard-tab ${activeTab === tab.key ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'dentes' && (
        <DentesTab
          teeth={analysisResult.detected_teeth}
          selectedTeeth={selectedTeeth}
          treatments={toothTreatments}
          onToggleTooth={onToggleTooth}
        />
      )}
      {activeTab === 'tratamento' && (
        <TratamentoTab
          teeth={analysisResult.detected_teeth}
          selectedTeeth={selectedTeeth}
          treatments={toothTreatments}
        />
      )}
      {activeTab === 'paciente' && (
        <PacienteTab
          patientName={patientName}
          patientAge={patientAge}
        />
      )}
      {activeTab === 'resumo' && (
        <ResumoTab
          selectedCount={selectedTeeth.length}
          patientName={patientName}
          patientAge={patientAge}
          confidence={analysisResult.confidence}
          budget={budget}
          onSetBudget={onSetBudget}
        />
      )}
    </div>
  )
}
