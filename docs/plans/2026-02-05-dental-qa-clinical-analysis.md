---
title: Análise QA Clínica — Caso 7 Dentes (Porcelana + Encaminhamento)
created: 2026-02-05
updated: 2026-02-05
status: published
tags:
  - type/qa-report
  - status/published
---

# Análise QA Clínica — Caso Completo (2026-02-05)

**Data:** 2026-02-05
**Modo:** JSON Review + UI Review (Playwright)
**Session:** `9261127f-2d3d-4cb4-a8da-34f0963ab2a9`
**Dentes:** 11, 12, 13, 21, 22, 23 (porcelana) + 31 (encaminhamento)
**Outputs avaliados:** DSD, Protocolo de Cimentação (6 dentes), Protocolo Genérico (1 dente), UI de Resultado

## Resultado: ⚠️ 4 atenções + 3 sugestões de melhoria + 15 validações OK

---

## Parte 1: Validação DSD

### Dados do DSD

| Campo | Valor |
|-------|-------|
| Golden Ratio | 40% |
| Symmetry | 25% |
| Confidence | alta |
| Smile Line | média |
| Buccal Corridor | adequado |
| Face Shape | oval |
| Suggestions | 9 |
| Simulação | Gerada |

### ⚠️ Atenção 1 — Scores DSD Baixos com Confiança Alta

**Evidência:** Golden ratio 40%, Symmetry 25% — ambos muito baixos.
**Confiança declarada:** alta.

**Preocupação:** Se a confiança é alta, esses scores sugerem que o sorriso atual tem problemas significativos de proporção e simetria. Isso é clinicamente coerente com um caso estético que requer 6 facetas. Contudo, a combinação de "confiança alta" com scores tão baixos pode confundir o dentista: "confiança" refere-se à qualidade da análise, não ao estado do sorriso, mas isso não é óbvio na UI.

**Sugestão:** Adicionar tooltip/explicação na UI: "Confiança = qualidade da análise. Scores baixos = maior necessidade de intervenção."

### ✅ DSD Consistência

- Face oval → recomendação de forma dental adequada ✅
- Smile line média → coerente com anterior superior ✅
- Buccal corridor adequado → sem necessidade de expansão ✅
- 9 sugestões para 6 dentes → proporção razoável ✅

---

## Parte 2: Validação dos Protocolos de Cimentação

### Dados Comparativos

| Dente | HF | Marca HF | Tempo | Silano | Adesivo | Cimento | Shade | Confiança |
|-------|-----|----------|-------|--------|---------|---------|-------|-----------|
| 11 | 5% | Condac Porcelana FGM | 20s | Prosil FGM | Ambar Universal APS FGM | Allcem Veneer APS FGM | WO | alta |
| 12 | 5% | Condac Porcelana FGM | 20s | Prosil FGM | Ambar APS FGM | Allcem Veneer APS FGM | WO | alta |
| 13 | 5% | Condac Porcelana FGM | 20s | Prosil FGM | Ambar FGM | Allcem Veneer APS FGM | WO | alta |
| 21 | 5% | Condac Porcelana FGM | 20s | Prosil FGM | Ambar FGM | Allcem Veneer APS FGM | Trans/OW | alta |
| 22 | 5% | Condac Porcelana FGM | 20s | Prosil FGM | Ambar FGM | Allcem Veneer APS FGM | WO | alta |
| 23 | 5% | Condac Porcelana FGM | 20s | Prosil FGM | Ambar Universal APS FGM | Allcem Veneer APS FGM | WO | alta |

### ✅ Consistência de Materiais

- **HF 5% uniforme** em todos os 6 dentes ✅
- **Mesmo tempo de condicionamento** (20s) em todos ✅
- **Mesmo silano** (Prosil FGM) em todos ✅
- **Mesmo cimento** (Allcem Veneer APS FGM) em todos ✅
- **Fotopolimerização** 40s/face em todos ✅
- **Confiança alta** em todos os 6 ✅

### ⚠️ Atenção 2 — Dente 21 Cement Shade Indeciso (Reincidência)

**Evidência:** Campo `shade` do dente 21:
```
"Trans (para máxima translucidez, permitindo que a cor da faceta BL1/BL2 se expresse)
 ou OW (Opaque White, se precisar de um pouco mais de valor/brilho)"
```

**Preocupação:** Protocolo clínico deve ser assertivo. "Trans ou OW" obriga o dentista a decidir sem critérios claros.

**Justificativa clínica:** O dente 21 tem `substrate_condition: "Saudável"` vs os outros que têm "Manchado". A IA corretamente identificou que o substrato favorável permite usar Trans, enquanto os manchados precisam de WO. A diferença é clinicamente justificável, mas o formato de apresentação (alternativas) não é ideal.

**Sugestão (prompt):** Regra: "NUNCA forneça alternativas no campo shade. SEMPRE escolha UMA opção definitiva com justificativa."

### ⚠️ Atenção 3 — Inconsistência no Nome do Adesivo

**Evidência:**
- Dente 11: "Ambar **Universal APS** - FGM"
- Dente 12: "Ambar **APS** - FGM"
- Dente 13: "Ambar - FGM" (sem APS)
- Dente 21: "Ambar - FGM" (sem APS)
- Dente 22: "Ambar - FGM" (sem APS)
- Dente 23: "Ambar **Universal APS** - FGM"

**Preocupação:** São 3 variações do mesmo produto. "Ambar Universal APS" é o nome correto do produto FGM. As variações criam confusão: o dentista pode achar que são 3 produtos diferentes.

**Impacto:** Baixo (clinicamente é o mesmo produto), mas prejudica a credibilidade do protocolo.

**Sugestão (prompt):** Adicionar regra: "Use o nome EXATO do produto conforme catálogo do fabricante. Ambar Universal APS (FGM), NUNCA abrevie."

### ⚠️ Atenção 4 — Variação de Step Count e Detalhamento

| Par | Prep Steps | Ceramic Steps | Tooth Steps | Finishing Steps | Checklist | Total Steps |
|-----|-----------|--------------|-------------|-----------------|-----------|-------------|
| 11 | 3 | 5 | 2 | 4 | 10 | 14 |
| 21 | 2 | 6 | 3 | 3 | 12 | 14 |
| 12 | 3 | 6 | 5 | 4 | 11 | 18 |
| 22 | 3 | 6 | 4 | 4 | 12 | 17 |
| 13 | 3 | 4 | 2 | 3 | 12 | 12 |
| 23 | 3 | 4 | 2 | 4 | 7 | 13 |

**Preocupação:**
- 13/23 são bem alinhados (12 vs 13 steps) ✅
- 12/22 são próximos (18 vs 17 steps) ✅
- 11/21 têm mesma contagem total (14 vs 14) mas distribuição diferente ✅
- Dente 12 tem 5 tooth treatment steps vs dente 11 com 2 — o 12 detalha "Lavagem e Secagem" e "Evaporação do solvente" como passos separados, enquanto o 11 inclui no mesmo passo

**Aceitabilidade:** Clinicamente aceitável — a variação é de granularidade de descrição, não de procedimento diferente. Todos seguem a mesma sequência: HF → limpeza → silano → adesivo → ácido fosfórico → adesivo no dente → cimentação.

---

## Parte 3: Validação Clínica Detalhada

### ✅ Protocolo de Condicionamento Cerâmico

Sequência validada para todos os 6 dentes:
1. HF 5% (20s) → correto para dissilicato de lítio ✅
2. Limpeza com H3PO4 37% (60s) → remove sais precipitados ✅
3. Ultrassom com álcool (11, 12) ou pula direto ao silano (outros) → ambas são práticas aceitas ✅
4. Silano (60s evaporação) → correto ✅
5. Adesivo sem polimerizar → correto para cimentação fotopolimerizável ✅

**Nota:** O uso de ultrassom aparece em alguns dentes (11, 12) e não em outros. Clinicamente aceitável (é uma etapa recomendada mas não obrigatória).

### ✅ Protocolo de Condicionamento Dental

- Ácido fosfórico 37% seletivo em esmalte (30s) → correto ✅
- Adesivo aplicado ativamente → correto ✅
- Fotopolimerização do adesivo no dente → correto ✅

### ✅ Técnica de Cimentação

Todos os 6 protocolos seguem a técnica correta:
1. Cimento na faceta (não no dente) ✅
2. Pressão digital constante e uniforme ✅
3. Tack-cure (1-2s) antes de remover excessos ✅
4. Remoção de excessos em estado gel ✅
5. Gel de glicerina nas margens ✅
6. Fotopolimerização final 40s/face ✅

### ✅ Escolha do Cimento

- Allcem Veneer APS (FGM) → fotopolimerizável, adequado para facetas ✅
- Linha APS (Advanced Polymerization System) → estabilidade de cor superior ✅
- Shade WO para substrato manchado → correto ✅
- Try-in obrigatório mencionado em todos → correto ✅

### ✅ Alertas e Warnings

Cada protocolo contém alertas relevantes:
- "NÃO pule a pasta Try-In" → presente em todos os 6 ✅
- "NÃO fotopolimerize antes de remover excessos" → presente em todos ✅
- "NÃO use cimento dual em facetas finas" → mencionado em vários ✅
- Warning sobre WO ser crítico para resultado → em todos ✅

### ✅ Substrato vs Shade do Cimento

| Dente | Substrato | Condição | Shade Cimento | Coerência |
|-------|-----------|----------|---------------|-----------|
| 11 | Esmalte+Dentina | Manchado | WO | ✅ Correto — precisa mascarar |
| 12 | Esmalte | Manchado | WO | ✅ Correto |
| 13 | Esmalte+Dentina | Manchado | WO | ✅ Correto |
| 21 | Esmalte | Saudável | Trans/OW | ⚠️ Trans aceitável para saudável |
| 22 | Esmalte+Dentina | Saudável | WO | ✅ Conservador, aceitável |
| 23 | Esmalte+Dentina | Manchado | WO | ✅ Correto |

**Análise:** A IA corretamente detectou que o dente 21 tem substrato saudável e considerou Trans como opção. O dente 22 também é saudável mas recebeu WO — mais conservador mas não incorreto (o paciente quer BL1/BL2 que são muito claros, e WO ajuda a atingir isso).

---

## Parte 4: Protocolo Genérico (Dente 31 — Encaminhamento)

| Campo | Valor |
|-------|-------|
| Tipo | encaminhamento |
| Razão IA | Apinhamento dental moderado na região anterior |
| Resumo | Dente 31 requer avaliação especializada |
| Checklist | 6 items |
| Recomendações | 2 items |

### ✅ Encaminhamento Adequado

- Dente 31 inferior com apinhamento → encaminhamento para ortodontia é a conduta correta ✅
- Sem protocolo de cimentação (correto — não é restauração) ✅
- Checklist genérico com documentação e radiografias ✅

### 💡 Sugestão 1 — Especialidade no Encaminhamento

O protocolo genérico diz "avaliação especializada" mas não especifica **qual** especialidade. Para apinhamento, deveria dizer "Encaminhamento para **Ortodontia**".

---

## Parte 5: Validação da UI (Tela de Resultado)

### ✅ Layout do Protocolo

A tela de resultado do dente 11 mostra:
1. **Resumo do Caso** — Paciente 40 anos, dente 11, anterior superior, cor A3.5 ✅
2. **DSD** — 9 sugestões, simetria 25%, proporção áurea 40% ✅
3. **Preferências** — "Clareamento notável - BL1/BL2" ✅
4. **Foto Clínica** — Presente ✅
5. **Protocolo de Cimentação** — Completo com 5 seções ✅
6. **Orientações Pós-operatórias** — 4 items ✅
7. **Checklist** — 10 items com checkboxes interativos ✅
8. **O que NÃO fazer** — 4 items com ❌ ✅
9. **Pontos de Atenção** — 3 items com ⚠️ ✅
10. **Botão Baixar PDF** — Presente ✅
11. **Disclaimer** — "Ferramenta de apoio à decisão clínica" ✅

### 💡 Sugestão 2 — Cor Alvo vs Cor Desejada

Na tela de resultado, mostra "Cor Alvo: A3.5" — mas A3.5 é a **cor atual** do dente, não a cor alvo. A cor alvo deveria ser BL1/BL2 (preferência do paciente). Isso pode confundir o dentista.

**Fix sugerido:** O campo "Cor Alvo" deveria exibir a cor desejada (BL1/BL2) e não a cor VITA atual detectada.

### 💡 Sugestão 3 — Progress Tracker

A tabela de casos mostra "Planejado (0/10)" para cada dente. O número (10) corresponde aos items do checklist. Isso é funcional, mas:
- O dente 23 mostra "0/7" enquanto os outros mostram "0/10" a "0/12" — a variação pode parecer inconsistente ao dentista
- **Sugestão:** Normalizar o checklist para ter o mesmo número de items entre contralaterais

---

## Parte 6: Resumo por Dente

| Dente | Tipo | Protocolo | Shade | Confiança | Issues | Status |
|-------|------|-----------|-------|-----------|--------|--------|
| 11 | porcelana | cementation | WO | alta | Adesivo nomeado "Ambar Universal APS" | ✅ |
| 12 | porcelana | cementation | WO | alta | Adesivo nomeado "Ambar APS" | ✅ |
| 13 | porcelana | cementation | WO | alta | Adesivo nomeado "Ambar" | ✅ |
| 21 | porcelana | cementation | Trans/OW | alta | Shade indeciso + adesivo "Ambar" | ⚠️ |
| 22 | porcelana | cementation | WO | alta | Adesivo nomeado "Ambar" | ✅ |
| 23 | porcelana | cementation | WO | alta | Adesivo nomeado "Ambar Universal APS" | ✅ |
| 31 | encaminhamento | generic | — | — | Sem especialidade especificada | ✅ |

---

## Ações Recomendadas

### Prioridade 1 — Prompt Refinement (recommend-cementation)
1. **Shade definitivo:** Regra "NUNCA forneça alternativas no campo shade — SEMPRE escolha UMA opção"
2. **Nome exato de produto:** Regra "Use o nome COMPLETO conforme catálogo — 'Ambar Universal APS (FGM)', não abrevie"

### Prioridade 2 — Frontend (Result page)
3. **Cor Alvo:** Mostrar cor desejada (BL1/BL2) ao invés da cor VITA atual (A3.5)
4. **DSD Tooltip:** Explicar que "confiança" refere-se à análise, não ao estado do sorriso

### Prioridade 3 — UX
5. **Checklist normalizado:** Garantir mesmo número de items entre contralaterais
6. **Especialidade no encaminhamento:** Incluir sugestão de especialidade (Ortodontia, Endodontia, etc.)

---

## Validações OK

- ✅ Notação FDI correta em todos os outputs
- ✅ treatment_type normalizado: "porcelana" (6) + "encaminhamento" (1)
- ✅ HF 5% uniforme em todos os 6 dentes
- ✅ Mesmo silano (Prosil FGM) em todos
- ✅ Cimento fotopolimerizável (Allcem Veneer APS FGM) em todos
- ✅ Fotopolimerização 40s/face em todos
- ✅ Confiança alta em 6/6 protocolos
- ✅ Encaminhamento correto para dente 31
- ✅ Try-in obrigatório mencionado em todos
- ✅ Gel de glicerina nas margens em todos
- ✅ Tack-cure antes de remover excessos em todos
- ✅ Alertas "O que NÃO fazer" em todos
- ✅ Warnings com justificativa em todos
- ✅ Pós-operatório com 4 recomendações em todos
- ✅ Substrato vs shade do cimento coerente (WO para manchado, flexível para saudável)

---

*Gerado pelo dental-qa-specialist skill em 2026-02-05*
