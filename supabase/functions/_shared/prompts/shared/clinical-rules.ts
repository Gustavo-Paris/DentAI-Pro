/**
 * Shared clinical rules extracted from prompt definitions to eliminate duplication.
 * Used by analyze-dental-photo.ts (unified clinical + aesthetic prompt).
 */

/**
 * Visagism conditional rules: face shape analysis, temperament, smile arc, incisal hierarchy.
 * Used by the unified analyze-dental-photo prompt.
 */
export const VISAGISM_RULES = `=== VISAGISMO (CONDICIONAL A VISIBILIDADE FACIAL) ===

REGRA CRITICA: Visagismo (formato facial + temperamento) SO se a FACE COMPLETA for visivel (olhos, testa, contorno mandibular).

SE apenas sorriso (labios/dentes/queixo parcial) SEM rosto completo:
- NAO determine formato facial nem temperamento
- Use face_shape="oval" e perceived_temperament="fleumatico" (valores neutros)
- Adicione observacao: "Visagismo nao realizado - foto da face completa indisponivel."
- Arco do sorriso e corredor bucal PODEM ser avaliados (nao dependem do rosto inteiro)

SE face completa visivel, aplique:

FORMATO FACIAL:
| Formato     | Caracteristica                          | Dentes recomendados                    |
|-------------|----------------------------------------|---------------------------------------|
| Oval        | Testa ligeiramente > queixo            | Ovais, contornos suaves               |
| Quadrado    | Mandibula marcada, angulos definidos   | Retangulares com angulos              |
| Triangular  | Testa larga, queixo fino               | Triangulares, bordos estreitos cerv.  |
| Retangular  | Face alongada                          | Mais largos p/ compensar verticalmente|
| Redondo     | Bochechas proeminentes                 | Ovais, incisal levemente plano        |

TEMPERAMENTO PERCEBIDO:
| Temperamento | Tracos                      | Dentes                                |
|-------------|----------------------------|---------------------------------------|
| Colerico    | Linhas retas, dominante    | Centrais dominantes, bordos retos     |
| Sanguineo   | Curvas suaves, extrovertido| Arredondados, sorriso amplo           |
| Melancolico | Linhas delicadas, refinado | Detalhes finos, caracterizacoes       |
| Fleumatico  | Equilibrado, calmo         | Proporcoes classicas, harmonia        |

CORRELACAO (so quando ambos determinados):
- Rosto quadrado + expressao forte -> NAO recomendar dentes ovais delicados
- Rosto oval + expressao suave -> NAO recomendar dentes quadrados angulosos`

/**
 * Smile arc analysis rules shared between prompts.
 */
export const SMILE_ARC_RULES = `=== ARCO DO SORRISO (SMILE ARC) ===

Curva incisal deve seguir contorno do labio inferior:
- CONSONANTE (ideal): Bordos incisais acompanham curvatura do labio inferior
- PLANO: Bordos formam linha reta (menos estetico, aparencia "velha")
- REVERSO: Bordos concavos em relacao ao labio (problema estetico serio)

HIERARQUIA INCISAL ANATOMICA (OBRIGATORIO):
- Incisivo Central (11/21) = dente MAIS LONGO do arco
- Canino (13/23) >= Incisivo Lateral (12/22)
- Lateral pode ser igual ou LIGEIRAMENTE mais curto que canino
- ERRO FATAL: Classificar centrais como mais CURTOS que laterais
- ERRO FATAL: Classificar laterais como mais LONGOS que centrais
- Se foto sugere lateral > central, reconsidere: pode ser restauracao previa ou desgaste do central`

/**
 * Buccal corridor rules shared between prompts.
 */
export const BUCCAL_CORRIDOR_RULES = `=== CORREDOR BUCAL ===

Espaco escuro lateral ao sorrir:
- Excessivo = sorriso "vazio" | Ausente = sorriso "apertado"

REGRA DE CONSERVADORISMO: Na duvida entre "adequado" e "excessivo", SEMPRE classifique como "adequado". Pequeno espaco escuro lateral e NORMAL. So "excessivo" quando sombras AMPLAS e EVIDENTES.

SE corredor bucal "excessivo":
1. Adicionar encaminhamento ortodontico p/ expansao maxilar
2. Se pre-molares CLARAMENTE lingualizados, sugerir faceta vestibular (prioridade baixa)
3. Incluir nas observations: "Corredor bucal excessivo pode indicar atresia maxilar."
PROIBIDO: Classificar como "excessivo" sem NENHUMA sugestao de tratamento.

REGRA SOBRE PRE-MOLARES (14/15/24/25):
- Pre-molares naturalmente tem MENOR proeminencia vestibular - isso e NORMAL
- So diagnostique lingualizacao quando CLARAMENTE EVIDENTE
- Se corredor bucal "adequado", NAO diagnostique lingualizacao
- Na duvida sobre posicao de pre-molares, NAO sugira tratamento`

/**
 * Gingival evaluation criteria shared between prompts.
 */
export const GINGIVAL_CRITERIA = `=== AVALIACAO GENGIVAL ===

CLASSIFICACAO DA LINHA DO SORRISO (DEFINICOES CLINICAS):
- "alta" (sorriso gengival): Gengiva rosa visivel ACIMA dos dentes, entre labio e coroas. O labio NAO toca as margens gengivais — ha faixa rosa (>=3mm) entre onde o labio termina e onde os dentes comecam. TESTE: se entre a borda do labio e o topo dos dentes existe rosa → "alta".
- "media": Labio TOCA ou tangencia a margem gengival — sem espaco rosa entre labio e dentes. Papilas interdentais visiveis ENTRE os dentes (triangulos rosa entre coroas) sao normais para "media".
- "baixa": Labio cobre completamente a margem gengival e parte das coroas. Gengiva NAO visivel.
DISTINCAO CRITICA: "alta" = faixa rosa HORIZONTAL acima dos dentes (entre labio e coroas). "media" = papilas VERTICAIS entre os dentes mas labio encosta na margem. Papilas entre dentes NAO indicam "alta" — apenas gengiva ACIMA dos dentes indica "alta".

## GENGIVOPLASTIA — INDICACAO BASEADA EM EVIDENCIA COMBINADA

NAO use smile line isoladamente como criterio decisorio. Combine TODAS as evidencias disponiveis:

EVIDENCIAS A FAVOR (cada uma soma peso):
1. Exposicao gengival excessiva (>3mm alem da margem gengival ao sorrir) — peso ALTO
2. Assimetria gengival visivel entre dentes homologos (ex: zenith do 11 ≠ zenith do 21) — peso ALTO
3. Coroa clinica visivelmente curta com excesso de tecido gengival cobrindo coroa anatomica — peso ALTO
4. Paciente REPORTA incomodo com sorriso gengival na anamnese — peso ALTO
5. Radiografia mostra proporcao coroa/raiz favoravel (raiz longa, coroa clinica curta = erupcao passiva alterada) — peso CONFIRMATORIO
6. Contorno gengival irregular (zeniths desalinhados entre dentes adjacentes) — peso MEDIO

EVIDENCIAS CONTRA (cada uma reduz indicacao):
1. Radiografia mostra raiz CURTA (proporcao coroa/raiz desfavoravel) — CONTRAINDICACAO RELATIVA
2. Paciente NAO menciona queixa gengival e exposicao gengival <2mm — peso CONTRA
3. Simetria gengival adequada, contorno harmonico, zeniths alinhados — nao intervir
4. Coroa clinica com comprimento adequado (>10mm em dente anterior) — nao e erupcao passiva

REGRA DE DECISAO:
- 2+ evidencias a favor + nenhuma contra forte → INDICAR gengivoplastia
- Evidencia a favor + evidencia contra → REGISTRAR ambas no notes, sugerir avaliacao periodontal
- Radiografia confirma erupcao passiva alterada → INDICAR com ALTA confianca
- Sem evidencia objetiva clara, apenas smile line "media" → NAO INDICAR (exposicao gengival leve e NORMAL)
- Exposicao radicular visivel → NUNCA gengivoplastia, indicar "recobrimento_radicular"

Para CADA dente com gengivoplastia indicada, OBRIGATORIAMENTE especifique:
- No campo notes: "gingival_reduction_pct: [N]" — estimativa de % de reducao necessaria (ex: 15 = reduzir 15% da margem visivel)
- No campo indication_reason: justificativa clinica (ex: "erupcao passiva alterada — coroa clinica curta ~7mm, assimetria de 2mm com contralateral, zenith deslocado mesialmente")

GENGIVOPLASTIA vs RECOBRIMENTO RADICULAR (diferenciar!):
| Procedimento             | Objetivo                        | Indicacao                              |
|--------------------------|--------------------------------|---------------------------------------|
| Gengivoplastia           | AUMENTAR coroa (remover gengiva)| Coroa curta, excesso gengival         |
| Recobrimento radicular   | COBRIR raiz (enxerto gengival) | Recessao gengival, raiz exposta       |

ERRO FATAL: Indicar gengivoplastia para raiz exposta (PIORA o problema!)
- Coroa precisa ficar MAIOR -> gengivoplastia
- Coroa precisa ficar MENOR (raiz exposta) -> recobrimento radicular

CAVEAT OBRIGATORIO PARA GENGIVOPLASTIA:
Toda sugestao de gengivoplastia DEVE incluir nas notes:
"Requer avaliação periodontal prévia (sondagem + radiografia periapical) para verificar nível ósseo crestal e largura biológica antes de qualquer remoção tecidual."
Isso e OBRIGATORIO mesmo para remoções pequenas (1mm). Gengivoplastia sem avaliação radiográfica pode violar largura biológica.

PROIBIDO: Sugerir gengivoplastia baseado APENAS em proporcao largura/altura quando gengiva NAO visivel
PROIBIDO: Sugerir gengivoplastia baseado APENAS em smile line "alta" sem evidencia anatomica adicional`

/**
 * Conservative treatment priority hierarchy.
 */
export const TREATMENT_PRIORITY = `=== ORDEM DE PRIORIDADE TERAPEUTICA ===
SEMPRE sugira o tratamento MAIS CONSERVADOR. Hierarquia (do menos ao mais invasivo):
1. Clareamento (se problema e apenas cor)
2. Recontorno/Desgaste (ajuste SUTIL em esmalte existente — SEM acrescimo de material)
3. Resina composta (restauracao direta, fechamento de diastema, acrescimo incisal)
4. Faceta em resina (quando cobertura vestibular necessaria mas invasividade menor que porcelana)
5. Faceta de porcelana (SOMENTE se resina insuficiente)
6. Coroa parcial (estrutura dental entre 40-60%)
7. Coroa total (SOMENTE se estrutura dental <40%)

DSD NUNCA sugere tratamento >2 niveis acima do indicado pela analise clinica.

PORCELANA como 1a opcao PROIBIDO para:
- 1-2 dentes com correcao pontual -> resina
- Fechamento de diastema simples (ate 2mm) -> resina
- Recontorno estetico em dentes integros -> resina
- Substituicao de restauracao antiga -> resina

PORCELANA indicada APENAS quando:
- 4+ dentes anteriores harmonizacao SIMULTANEA E extensiva
- Escurecimento severo que resina nao mascara
- Orcamento premium E demanda estetica muito alta`
