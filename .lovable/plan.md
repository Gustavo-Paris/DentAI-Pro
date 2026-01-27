
# Plano: Revisao Completa do DSD - Analise + Simulacao

## Problemas Identificados (Screenshots)

### Problema 1: Labios/Boca Diferentes na Simulacao
Comparando as imagens "Antes" e "Simulacao DSD":
- **Labio superior**: textura e linhas diferentes
- **Labio inferior**: forma e volume levemente alterados
- **Pele perioral**: pequenas diferencas de iluminacao/textura

O modelo de IA NAO esta respeitando a regra "PIXEL POR PIXEL" para areas nao-dentais.

### Problema 2: Analise NAO Detecta Restauracoes Existentes
A observacao diz: "excelente resultado estetico" e "translucidez incisal natural" quando claramente existem restauracoes de resina antigas que precisam ser substituidas.

### Problema 3: Sugestoes Irrelevantes
A unica sugestao foi "bordo incisal do 22" quando o problema real sao as restauracoes classes IV antigas nos incisivos centrais com interfaces visiveis.

---

## Solucao Proposta

### Parte 1: Reformular o Prompt de Analise

Adicionar nova secao CRITICA entre linha 509 e 510:

```text
DETECCAO CRITICA DE RESTAURACOES EXISTENTES:
ANTES de fazer qualquer elogio estetico, EXAMINE cada dente para sinais de restauracoes previas:

SINAIS DE RESTAURACOES DE RESINA:
- Interface visivel (linha onde resina encontra esmalte natural)
- Diferenca de cor/translucidez DENTRO do mesmo dente
- Manchamento marginal (linha amarelada/acinzentada na borda)
- Textura diferente entre superficies (areas mais lisas/opacas)
- Contorno artificial ou excessivamente uniforme
- Perda de polimento em partes do dente

DIFERENCIACAO CRITICA:
- Dente NATURAL: gradiente de cor cervical→incisal, translucidez uniforme
- Dente com RESINA: cor mais uniforme, interface visivel, pode ter manchamento

REGRAS PARA RESTAURACOES DETECTADAS:
1. NAO diga "excelente resultado estetico" se restauracoes com defeitos estao presentes
2. NAO elogie "translucidez natural" em dentes claramente restaurados
3. IDENTIFIQUE cada dente restaurado com problema especifico
4. PRIORIZE sugestao de "Substituicao de restauracao" sobre mudancas cosmeticas sutis

TIPOS DE PROBLEMAS EM RESTAURACOES ANTIGAS:
- "Restauracao com manchamento marginal"
- "Interface visivel entre resina e esmalte"
- "Restauracao com cor inadequada"
- "Restauracao com perda de anatomia"
- "Restauracao classe IV com contorno artificial"

OBSERVACAO OBRIGATORIA:
Se detectar restauracoes com problemas: "ATENCAO: Restauracao(oes) de resina detectada(s) em [dentes]. Apresentam [problema]. Recomenda-se substituicao."
```

Modificar secao de SUGESTOES (linha 530):

```text
SUGESTOES - PRIORIDADE DE TRATAMENTOS:
1 PRIORIDADE: Restauracoes com infiltracao/manchamento (saude bucal)
2 PRIORIDADE: Restauracoes com cor/anatomia inadequada (estetica funcional)
3 PRIORIDADE: Melhorias em dentes naturais (refinamento estetico)

TIPOS DE SUGESTOES PERMITIDAS:
A) SUBSTITUICAO DE RESTAURACAO:
   - current_issue: "Restauracao classe IV com manchamento marginal e interface visivel"
   - proposed_change: "Substituir por nova restauracao com melhor adaptacao de cor e contorno"

B) TRATAMENTO CONSERVADOR (apenas para dentes naturais sem restauracao):
   - current_issue: "Bordo incisal irregular"
   - proposed_change: "Aumentar 1mm com lente de contato"
```

Modificar REGRAS ESTRITAS (linha 542):

```text
REGRAS ESTRITAS:
PERMITIDO: identificar e sugerir substituicao de restauracoes antigas
PERMITIDO: aumentar levemente comprimento, fechar pequenos espacos
PROIBIDO: elogiar restauracoes que claramente tem problemas
PROIBIDO: ignorar diferencas de cor/textura entre areas do dente
PROIBIDO: dizer "excelente resultado" se restauracoes antigas com defeitos estao presentes
PROIBIDO: focar em melhorias sutis quando restauracoes precisam ser substituidas
```

---

### Parte 2: Criar Prompt de Substituicao de Restauracoes

Adicionar deteccao apos linha 224:

```typescript
// Check if case has old restorations that need replacement
const needsRestorationReplacement = analysis.suggestions.some(s => {
  const issue = s.current_issue.toLowerCase();
  const change = s.proposed_change.toLowerCase();
  return issue.includes('restauracao') || 
         issue.includes('resina') ||
         issue.includes('manchamento') ||
         issue.includes('interface') ||
         issue.includes('infiltracao') ||
         change.includes('substituir') ||
         change.includes('substituicao') ||
         change.includes('nova restauracao');
});
```

Adicionar novo prompt RESTORATION REPLACEMENT apos linha 293:

```typescript
} else if (needsRestorationReplacement) {
  // RESTORATION REPLACEMENT PROMPT
  const restorationTeeth = analysis.suggestions
    .filter(s => {
      const issue = s.current_issue.toLowerCase();
      return issue.includes('restauracao') || 
             issue.includes('resina') ||
             issue.includes('manchamento') ||
             issue.includes('interface');
    })
    .map(s => s.tooth)
    .join(', ');

  simulationPrompt = `TAREFA: Visualizar SUBSTITUICAO de restauracoes antigas.

=== PRESERVACAO ABSOLUTA DE LABIOS/PELE (CRITICO) ===
Os labios e pele perioral devem ser IDENTICOS a foto original.
Copie EXATAMENTE: textura dos labios, linhas de expressao, cor da pele, pelos/barba.
Qualquer diferenca nos labios = FALHA CRITICA.

DIMENSOES OBRIGATORIAS:
- SAIDA = mesmas dimensoes que ENTRADA (pixel por pixel)
- NAO fazer zoom, crop ou pan
- Bordas da imagem = IDENTICAS

REGRA #1 - ENQUADRAMENTO CONGELADO:
Trate a area NAO-DENTAL como uma MASCARA fixa.
Labios superior/inferior, gengiva, pele = COPIE da original sem alteracao.
Use tecnica de "inpainting" apenas na area dos DENTES.

REGRA #2 - GENGIVA INTOCAVEL:
NAO crie, estenda ou modifique gengiva.
Se a gengiva esta coberta pelo labio, deve continuar coberta.

REGRA #3 - SUBSTITUICAO DE RESTAURACOES:
DENTES COM RESTAURACOES ANTIGAS: ${restorationTeeth || 'incisivos centrais'}

Para estes dentes:
1. REMOVA visualmente linhas de interface
2. UNIFORMIZE cor com dentes naturais adjacentes
3. ELIMINE manchamentos marginais
4. HARMONIZE translucidez
5. MANTENHA formato/tamanho original

COR OBRIGATORIA (TODOS os dentes):
- Tom uniforme A1/A2 (branco natural)
- REMOVA manchas, interfaces e descoloracoes
- Todos os dentes = MESMA cor e translucidez
${patientDesires}
FORMATO: ${toothShape.toUpperCase()} - ${shapeInstruction}

VERIFICACAO FINAL:
[ ] Labios IDENTICOS a original? (textura, linhas, cor)
[ ] Pele perioral inalterada?
[ ] Dimensoes identicas?
[ ] So os dentes foram modificados?`;
}
```

---

### Parte 3: Reforcar Preservacao de Labios em TODOS os Prompts

Atualizar o prompt de RECONSTRUCAO (linhas 258-293) adicionando:

```text
=== PRESERVACAO ABSOLUTA DE LABIOS/PELE (CRITICO) ===
Os labios e pele perioral devem ser IDENTICOS a foto original.
Copie EXATAMENTE: textura dos labios, linhas de expressao, cor da pele, pelos/barba.
Qualquer diferenca nos labios = FALHA CRITICA.

TECNICA OBRIGATORIA:
1. Extraia a regiao NAO-DENTAL como mascara fixa
2. Aplique edicao APENAS na area dos dentes
3. Recomponha usando a mascara original para labios/pele
```

Atualizar o prompt STANDARD (linhas 316-343) adicionando:

```text
=== PRESERVACAO ABSOLUTA DE LABIOS/PELE (CRITICO) ===
COPIE PIXEL POR PIXEL toda a area nao-dental:
- Labio superior: cada linha, textura, brilho
- Labio inferior: formato exato, cor, volume
- Pele perioral: tons, texturas, pelos
- Cantos da boca: posicao identica

TECNICA: Trate labios como MASCARA IMUTAVEL.
Qualquer alteracao nos labios = resultado rejeitado.
```

---

### Parte 4: Melhorar Logs de Debug

```typescript
console.log("DSD Simulation Request:", {
  promptType: needsReconstruction ? 'reconstruction' : 
              (needsRestorationReplacement ? 'restoration-replacement' : 
              (isIntraoralPhoto ? 'intraoral' : 'standard')),
  promptLength: simulationPrompt.length,
  imageDataLength: imageBase64.length,
  analysisConfidence: analysis.confidence,
  suggestionsCount: analysis.suggestions.length,
  needsRestorationReplacement,
  restorationTeeth: restorationTeeth || 'none',
  patientDesires: patientPreferences?.desiredChanges
});
```

---

## Resumo das Alteracoes

| Arquivo | Secao | Alteracao |
|---------|-------|-----------|
| `generate-dsd/index.ts` | Linha ~509 | Adicionar "DETECCAO CRITICA DE RESTAURACOES EXISTENTES" |
| `generate-dsd/index.ts` | Linha ~530 | Modificar SUGESTOES para priorizar substituicao |
| `generate-dsd/index.ts` | Linha ~542 | Adicionar regras contra elogiar restauracoes com problemas |
| `generate-dsd/index.ts` | Linha ~224 | Adicionar deteccao `needsRestorationReplacement` |
| `generate-dsd/index.ts` | Apos linha 293 | Criar novo prompt "RESTORATION REPLACEMENT" |
| `generate-dsd/index.ts` | Linhas 258-293 | Adicionar preservacao de labios no prompt reconstrucao |
| `generate-dsd/index.ts` | Linhas 316-343 | Adicionar preservacao de labios no prompt standard |
| `generate-dsd/index.ts` | Linha ~346 | Melhorar logs de debug |

---

## Resultado Esperado

### Analise (para foto como a apresentada):

**Sugestoes de Tratamento:**
- Dente 11: "Restauracao classe IV com interface visivel e manchamento" → "Substituir por nova restauracao com melhor adaptacao"
- Dente 21: "Restauracao com diferenca de translucidez" → "Refazer com estratificacao adequada"
- Dente 12: "Restauracao com perda de polimento" → "Substituir restauracao"

**Observacoes:**
- "ATENCAO: Restauracoes de resina detectadas nos incisivos. Apresentam interface visivel e manchamento. Recomenda-se substituicao."

### Simulacao:
- Labios/boca: IDENTICOS a foto original
- Dentes: cor uniforme A1/A2, sem interfaces visiveis, harmonizados

---

## Impacto Clinico

1. **Analises precisas**: IA identificara restauracoes existentes e problemas reais
2. **Simulacao realista**: Labios preservados, apenas dentes modificados
3. **Expectativas corretas**: Paciente entendera que precisa refazer tratamentos
4. **Valor clinico**: Dentista tera ferramenta util para planejar substituicoes
