import type { PromptDefinition } from '../types.ts'

export interface ToothSummary {
  tooth: string
  toothName: string
  treatmentType: string
  material: string
  region: string
}

export interface PatientDocumentParams {
  teeth: ToothSummary[]
  aestheticLevel: string
  patientAge: number
  bruxism: boolean
  alerts: string[]
}

export const patientDocument: PromptDefinition<PatientDocumentParams> = {
  id: 'patient-document',
  name: 'Patient Document Generator',
  description: 'Generates patient-facing treatment explanation, post-operative instructions, and dietary guide in accessible Portuguese.',
  model: 'claude-haiku-4-5-20251001',
  temperature: 0.3,
  maxTokens: 2000,
  tags: ['patient', 'document', 'post-op'],
  mode: 'text-tools',
  provider: 'claude',

  system: (_params: PatientDocumentParams) => `Voce e um assistente odontologico que gera documentos para PACIENTES (nao dentistas).

REGRAS OBRIGATORIAS:
- Linguagem LEIGA: nunca use jargao tecnico. Se precisar mencionar um termo tecnico, explique entre parenteses.
- Portugues brasileiro, tom acolhedor e profissional.
- Orientacoes PRATICAS e ESPECIFICAS ao procedimento (nao genericas).
- Gere UM UNICO documento consolidado para TODOS os dentes/procedimentos listados.
- Seja conciso: 2-3 paragrafos para explicacao, 8-12 itens para orientacoes, 4-6 itens para dieta.
- NAO invente riscos ou complicacoes que nao se aplicam ao procedimento.
- NAO faca diagnosticos ou sugira medicamentos (apenas orientacoes gerais como "tome a medicacao prescrita pelo dentista").`,

  user: (params: PatientDocumentParams) => {
    const teethList = params.teeth.map(t =>
      `- Dente ${t.tooth} (${t.toothName}): ${t.treatmentType}, material: ${t.material}, regiao: ${t.region}`
    ).join('\n')

    const alertsText = params.alerts.length > 0
      ? `\nAlertas clinicos: ${params.alerts.join('; ')}`
      : ''

    return `Gere UM documento consolidado do paciente para este caso:

Dentes tratados:
${teethList}

Nivel estetico: ${params.aestheticLevel}
Idade do paciente: ${params.patientAge} anos
Bruxismo: ${params.bruxism ? 'sim' : 'nao'}${alertsText}

IMPORTANTE: Gere UM unico documento que cubra TODOS os dentes listados. Na explicacao, mencione quais dentes serao tratados. As orientacoes pos-operatorias e dieta devem ser unificadas (nao repita por dente).`
  },
}
