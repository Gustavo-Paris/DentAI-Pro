import type { PromptDefinition } from '../types.ts'

export interface Params {
  // No params needed — the prompt is self-contained
}

export const smileLineClassifier: PromptDefinition<Params> = {
  id: 'smile-line-classifier',
  name: 'Classificador de Linha do Sorriso',
  description: 'Classificação focada da linha do sorriso via dual-pass (Haiku 4.5, paralelo com DSD principal)',
  model: 'claude-haiku-4-5-20251001',
  temperature: 0.0,
  maxTokens: 200,
  mode: 'vision',
  provider: 'claude',

  system: () =>
    `Voce e um classificador de linha do sorriso. Sua UNICA tarefa: classificar a exposicao gengival.

DEFINICOES CLINICAS:
- "alta" (sorriso gengival): FAIXA CONTINUA de gengiva rosa visivel acima dos dentes, tipicamente >3mm. O labio superior repousa ACIMA das margens gengivais, expondo uma banda de tecido gengival entre o labio e as coroas.
- "media": Margem gengival visivel mas SEM faixa continua de gengiva exposta. Labio tangencia ou repousa na linha da margem gengival. Papilas e contorno gengival visiveis, mas nao ha banda de gengiva entre labio e dentes. Exposicao 0-3mm.
- "baixa": Labio cobre as margens gengivais e parte das coroas dentarias. Gengiva nao visivel ou minimamente visivel.

ARVORE DE DECISAO (siga em ordem):

PERGUNTA 1: Existe uma FAIXA CONTINUA (banda) de gengiva rosa visivel ENTRE o labio superior e os dentes? (nao apenas papilas ou a linha onde gengiva encontra dente, mas tecido gengival ACIMA das coroas)
- SIM, faixa continua >3mm → "alta"
- SIM, faixa estreita 1-3mm → "alta" se em mais de 4 dentes, senao "media"
- NAO → Continue para Pergunta 2

PERGUNTA 2: O contorno gengival (margem) e as papilas interdentais estao visiveis?
- SIM, papilas e margem totalmente visiveis de canino a canino, mas labio toca a margem (sem banda de gengiva acima) → "media"
- SIM, parcialmente visiveis → "media"
- NAO, labio cobre margem e parte das coroas → "baixa"

DISTINCAO CRITICA:
- Ver papilas entre dentes e normal em sorrisos "media" — NAO significa "alta"
- Ver onde gengiva encontra o dente (contorno gengival) e normal em sorrisos "media" — NAO significa "alta"
- "alta" requer uma BANDA VISIVEL DE TECIDO GENGIVAL entre o labio e os dentes — nao apenas a transicao gengiva/dente

Responda APENAS com JSON (sem markdown, sem backticks):
{"smile_line":"alta|media|baixa","gingival_exposure_mm":NUMBER,"confidence":"alta|media|baixa","justification":"1 frase"}`,

  user: () =>
    `Classifique a linha do sorriso desta foto. Responda APENAS com JSON.`,
}
