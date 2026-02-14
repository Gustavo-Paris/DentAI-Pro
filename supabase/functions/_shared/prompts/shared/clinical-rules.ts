/**
 * Shared clinical rules extracted from prompt definitions to eliminate duplication.
 * Used by analyze-dental-photo.ts and dsd-analysis.ts.
 */

/**
 * Visagism conditional rules: face shape analysis, temperament, smile arc, incisal hierarchy.
 * Shared between analyze-dental-photo and dsd-analysis prompts.
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

REGRA DE VISIBILIDADE:
- Linha do sorriso ALTA (>3mm gengiva exposta): AVALIAR gengiva e sugerir gengivoplastia se indicado
- Linha do sorriso MEDIA (0-3mm gengiva exposta): AVALIAR gengiva — exposicao suficiente para detectar assimetrias e excessos gengivais
- Linha do sorriso BAIXA (gengiva NAO visivel / labios cobrem): NAO sugerir gengivoplastia
- Gengiva NAO exposta na foto -> NAO mencione "proporcao coroa/gengiva"

SE gengiva visivel (linha media ou alta), avalie:
1. Coroas clinicas curtas: proporcao altura/largura inadequada -> gengivoplastia p/ aumentar coroa
2. Assimetria gengival: comparar homologos (11 vs 21, 12 vs 22, 13 vs 23), diferenca >1mm -> gengivoplastia
3. Sorriso gengival >3mm: considerar gengivoplastia ou encaminhamento periodontia
4. Zenites assimetricos entre homologos -> gengivoplastia para harmonizar

CROSS-VALIDACAO SMILE_LINE (VERIFICAR ANTES DE FINALIZAR):
Se sugestoes mencionam "sorriso gengival >3mm" ou "excesso gengival significativo" MAS smile_line classificada como "média" → INCONSISTENCIA.
Acao: Reclassificar smile_line para "alta". Sorriso gengival >3mm e POR DEFINICAO smile_line alta.
Se observacoes mencionam "sorriso gengival" ou gengiva "ampla"/"extensa"/"significativa" E smile_line = "média" → REVISAR classificacao.

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

PROIBIDO: Sugerir gengivoplastia baseado APENAS em proporcao largura/altura quando gengiva NAO visivel`

/**
 * Conservative treatment priority hierarchy.
 */
export const TREATMENT_PRIORITY = `=== ORDEM DE PRIORIDADE TERAPEUTICA ===
SEMPRE sugira o tratamento MAIS CONSERVADOR:
1. Clareamento (se problema e apenas cor)
2. Resina composta (restauracao direta, fechamento de diastema, recontorno)
3. Faceta de porcelana (SOMENTE se resina insuficiente)
4. Coroa total (SOMENTE se estrutura dental <40%)

PORCELANA como 1a opcao PROIBIDO para:
- 1-2 dentes com correcao pontual -> resina
- Fechamento de diastema simples (ate 2mm) -> resina
- Recontorno estetico em dentes integros -> resina
- Substituicao de restauracao antiga -> resina

PORCELANA indicada APENAS quando:
- 4+ dentes anteriores harmonizacao SIMULTANEA E extensiva
- Escurecimento severo que resina nao mascara
- Orcamento premium E demanda estetica muito alta`
