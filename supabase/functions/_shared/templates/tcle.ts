export interface TCLEParams {
  procedimento: string
  dente: string
  material: string
  riscos: string[]
  alternativas: string
  clinica: string
  dentista: string
  cro: string
  data: string
  paciente: string
}

export function generateTCLE(params: TCLEParams): string {
  const riscosText = params.riscos.length > 0
    ? params.riscos.map((r, i) => `${i + 1}. ${r}`).join('\n')
    : '- Riscos inerentes a qualquer procedimento odontologico (dor, sensibilidade, necessidade de retoque).'

  return `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO

Eu, ${params.paciente}, declaro que fui devidamente informado(a) pelo(a) Dr(a). ${params.dentista} (CRO: ${params.cro}), da clinica ${params.clinica}, sobre o tratamento odontologico ao qual serei submetido(a).

PROCEDIMENTO: ${params.procedimento}
ELEMENTO DENTAL: ${params.dente}
MATERIAL UTILIZADO: ${params.material}
DATA: ${params.data}

RISCOS E POSSIVEIS COMPLICACOES:
${riscosText}

ALTERNATIVAS DE TRATAMENTO:
${params.alternativas}

Declaro que:
1. Recebi explicacoes claras e em linguagem acessivel sobre o procedimento proposto.
2. Fui informado(a) sobre os riscos, beneficios e alternativas ao tratamento.
3. Tive a oportunidade de fazer perguntas e todas foram respondidas satisfatoriamente.
4. Compreendo que o resultado do tratamento pode variar de acordo com fatores individuais.
5. Estou ciente de que posso revogar este consentimento a qualquer momento antes do inicio do procedimento.

Consinto de forma livre e esclarecida com a realizacao do procedimento descrito acima.


_____________________________________________
Paciente: ${params.paciente}
Data: ${params.data}


_____________________________________________
Profissional: Dr(a). ${params.dentista}
CRO: ${params.cro}`
}
