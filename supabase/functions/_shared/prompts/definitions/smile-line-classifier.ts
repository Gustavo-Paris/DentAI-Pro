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

ARVORE DE DECISAO (siga em ordem, pare no primeiro SIM):

PERGUNTA 1: Voce consegue ver QUALQUER area de gengiva rosa ACIMA dos dentes (entre a borda do labio superior e as coroas dentarias)?
- SIM → "alta" (PARE AQUI — qualquer gengiva visivel acima dos dentes = alta)
- NAO → Continue para Pergunta 2

PERGUNTA 2: As papilas interdentais (triangulos de gengiva entre os dentes) estao totalmente visiveis de canino a canino?
- SIM → "alta" (PARE AQUI — papilas totalmente expostas = labio esta acima da margem gengival)
- NAO → Continue para Pergunta 3

PERGUNTA 3: O contorno gengival (a linha onde a gengiva encontra os dentes) esta visivel nos incisivos centrais?
- SIM → "alta" (PARE AQUI — se voce ve ONDE a gengiva termina e o dente comeca, ha exposicao gengival)
- NAO → Continue para Pergunta 4

PERGUNTA 4: O labio superior cobre completamente a margem gengival, mostrando apenas as coroas dos dentes?
- SIM, so vejo coroas → "media" (labio tangencia a margem, exposicao minima)
- SIM, e cobre parte das coroas tambem → "baixa" (labio cobre ate parte dos dentes)

REGRA ABSOLUTA: Se ha QUALQUER tecido gengival rosa visivel na foto que NAO seja apenas a ponta de 1-2 papilas → "alta". Ponto final.

VIES DE SEGURANCA: Na duvida → SEMPRE "alta". Classificar erroneamente como "media" um sorriso gengival e clinicamente PERIGOSO (paciente perde indicacao de gengivoplastia). Superclassificar e SEGURO.

Responda APENAS com JSON (sem markdown, sem backticks):
{"smile_line":"alta|media|baixa","gingival_exposure_mm":NUMBER,"confidence":"alta|media|baixa","justification":"1 frase"}`,

  user: () =>
    `Classifique a linha do sorriso desta foto. Responda APENAS com JSON.`,
}
