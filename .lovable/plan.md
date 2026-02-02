
# Plano Final: Corrigir DSD - Preservar Estrutura dos Dentes

## Problema

A simulacao DSD esta alterando a largura e estrutura dos dentes, o que e clinicamente impossivel.

## Arquivo Afetado

`supabase/functions/generate-dsd/index.ts`

---

## Mudancas

### 1. Ajustar baseCorrections (Linhas 283-285)

**Antes:**
```javascript
const baseCorrections = `1. Fill visible holes, chips or defects on tooth edges
2. Remove dark stain spots  
3. Close small gaps between teeth (up to 2mm)`;
```

**Depois:**
```javascript
const baseCorrections = `1. Fill visible holes, chips or defects on tooth edges
2. Remove dark stain spots  
3. Close small gaps by adding MINIMAL material at contact points - NOT by widening teeth`;
```

**Logica:** Permite fechar gaps de forma natural, adicionando material minimo nos pontos de contato, sem alargar os dentes.

---

### 2. Atualizar PROPORTION RULES (Linhas 396-400, 420-424, 448-452, 470-474)

Adicionar regras explicitas em todas as 4 variantes do prompt:

**Antes:**
```
PROPORTION RULES:
- Keep original tooth width proportions exactly
- NEVER make teeth appear thinner or narrower than original
- Only add material to fill defects - do NOT reshape tooth contours
- Maintain the natural width-to-height ratio of each tooth
```

**Depois:**
```
PROPORTION RULES:
- Keep original tooth width proportions exactly
- NEVER make teeth appear thinner or narrower than original
- NEVER make teeth appear WIDER or LARGER than original
- DO NOT change the overall tooth silhouette or outline
- Only add material to fill defects - do NOT reshape tooth contours
- Maintain the natural width-to-height ratio of each tooth
```

---

### 3. Adicionar Filtro de Sugestoes Estruturais (Linhas 346-351)

**Antes:**
```javascript
const allowedChangesFromAnalysis = analysis.suggestions?.length > 0 
  ? `\nSPECIFIC CORRECTIONS FROM ANALYSIS (apply these changes):\n${analysis.suggestions.map(s => 
      `- Tooth ${s.tooth}: ${s.proposed_change}`
    ).join('\n')}`
  : '';
```

**Depois:**
```javascript
// Filter out structural changes that would alter tooth dimensions
const structuralKeywords = [
  'alargar', 'widen', 'larger', 'maior', 'aumentar largura',
  'aumentar volume', 'add volume', 'volume', 'bulk',
  'expandir', 'expand', 'extend', 'estender',
  'reconstruir', 'reconstruct', 'rebuild',
  'mudar formato', 'change shape', 'reshape'
];

const filteredSuggestions = analysis.suggestions?.filter(s => {
  const change = s.proposed_change.toLowerCase();
  const issue = s.current_issue.toLowerCase();
  const isStructural = structuralKeywords.some(kw => 
    change.includes(kw) || issue.includes(kw)
  );
  return !isStructural;
}) || [];

const allowedChangesFromAnalysis = filteredSuggestions.length > 0 
  ? `\nSPECIFIC CORRECTIONS FROM ANALYSIS (apply these changes):\n${filteredSuggestions.map(s => 
      `- Tooth ${s.tooth}: ${s.proposed_change}`
    ).join('\n')}`
  : '';
```

---

## Resumo

| Mudanca | O que faz |
|---------|-----------|
| baseCorrections | Permite fechar gaps com material minimo nos pontos de contato, sem alargar |
| PROPORTION RULES | Adiciona proibicao explicita de alargar ou mudar silhueta |
| Filtro de sugestoes | Remove sugestoes que pedem mudancas estruturais |

---

## Resultado Esperado

- Gaps podem ser fechados de forma natural (material nos pontos de contato)
- Dentes NAO serao alargados ou terao silhueta alterada
- Reparos de chips/buracos continuam funcionando
- Clareamento continua funcionando
- Resultado clinicamente possivel de reproduzir
