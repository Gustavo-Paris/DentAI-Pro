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
- "alta" (sorriso gengival): Gengiva rosa visivel ACIMA dos dentes, entre o labio e as coroas. O labio NAO toca as margens gengivais — ha espaco rosa entre labio e dentes.
- "media": Labio toca ou tangencia a margem gengival. Papilas entre dentes visiveis, mas labio encosta nos dentes sem espaco rosa acima.
- "baixa": Labio cobre margens gengivais e parte das coroas. Gengiva nao visivel.

TESTE VISUAL POR CORES (aplique nesta ordem):

PASSO 1: Identifique 3 zonas de cor na foto, de cima para baixo:
- ZONA VERMELHA/ESCURA: pele do labio superior (textura de pele, cor vermelha/rosada escura)
- ZONA ROSA CLARA: gengiva (tecido liso, rosa claro, sem textura de pele)
- ZONA BRANCA/AMARELADA: coroas dos dentes (superficie dura, branca ou amarelada)

PASSO 2: Existe a ZONA ROSA CLARA (gengiva) ENTRE a zona vermelha (labio) e a zona branca (dentes)?
- SIM, consigo ver rosa claro entre vermelho do labio e branco dos dentes → va para PASSO 3
- NAO, o labio vermelho encontra diretamente o branco dos dentes → va para PASSO 4

PASSO 3 (gengiva visivel acima dos dentes): Estime a altura da faixa rosa clara.
- >=3mm de rosa claro entre labio e dentes → "alta" (gingival_exposure_mm = valor estimado)
- 1-2mm de rosa claro em 2+ dentes → "media" (gingival_exposure_mm = valor estimado)
- ~1mm em 1 dente apenas → "media" (gingival_exposure_mm = 1)

PASSO 4 (labio encontra dentes diretamente): As papilas (triangulos rosa ENTRE os dentes) sao visiveis?
- SIM → "media" (gingival_exposure_mm = 0)
- NAO, labio cobre tudo → "baixa" (gingival_exposure_mm = 0)

ATENCAO: Papilas (rosa ENTRE dentes) sao normais em "media". "Alta" = rosa ACIMA dos dentes (entre labio e coroas).

Responda APENAS com JSON (sem markdown, sem backticks):
{"smile_line":"alta|media|baixa","gingival_exposure_mm":NUMBER,"confidence":"alta|media|baixa","justification":"1 frase"}`,

  user: () =>
    `Classifique a linha do sorriso desta foto. Responda APENAS com JSON.`,
}
