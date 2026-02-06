---
title: "Dental QA Validation Report #3 — Post-Migration E2E Test"
created: 2026-02-05
updated: 2026-02-05
status: draft
tags:
  - type/report
  - dental-qa
  - e2e-test
---

# Relatório QA Dental #3 — Caso E2E Pós-Migração PageShell

**Data:** 2026-02-05
**Modo:** E2E (Playwright)
**Foto:** WhatsApp Image 2026-02-04 at 16.00.37.jpeg
**Outputs avaliados:** Análise de Foto, DSD, Protocolo de Estratificação, Protocolo de Cimentação, Encaminhamento
**Dentes analisados:** 11, 12, 21, 22, 31, 41
**Whitening:** Natural (A1/A2)
**Orçamento:** Moderado
**Estética:** Alto

## Contexto

Teste E2E após migração de 6 páginas para PageShell composites. Objetivo: validar que a migração não introduziu regressões clínicas e verificar qualidade geral dos outputs de IA.

## Resultado: 2 Críticos | 4 Atenção | 3 Sugestões

---

## Crítico (2)

### C1 — Protocolo Ausente para Dente 12

**Problema:** Nenhum protocolo de estratificação foi gerado para o dente 12, apesar de ser classificado como Classe IV (resina composta).

**Evidência:** Página do resultado mostra "Nenhuma resina no inventário é compatível com o orçamento 'moderado'". Acabamento & Polimento exibe "N/A". Sem checklist.

**Regra clínica:** Todo caso com indicação de resina composta DEVE gerar protocolo completo. Se o inventário do usuário não tem resinas compatíveis, o sistema deveria usar resinas genéricas de referência ou alertar com alternativas.

**Sugestão:** Quando nenhuma resina do inventário é compatível com o orçamento, gerar protocolo com resina de referência (ex: Filtek Z350 XT) e alertar que não está no inventário. Nunca deixar um caso sem protocolo.

**Investigação adicional:** Por que dentes 11 e 21 receberam protocolo com Filtek Z350 XT mas dente 12 não? Todos têm mesma indicação (resina) e mesmo orçamento (moderado). Possível bug na lógica de matching de resinas do inventário.

### C2 — Classificação Questionável para Dente 11 (e 21)

**Problema:** AI classificou o dente 11 como Classe IV Média, mas a foto mostra apenas desgaste incisal leve.

**Evidência:** DSD diz "Leve desgaste no bordo incisal". Protocolo indica "Aumento Incisal". Não há menção a cavidade proximal.

**Regra clínica:** Classe IV = cavidade que envolve ângulo incisal com destruição da face proximal.

**Sugestão:** Se a indicação é apenas restauração do bordo incisal sem cavidade proximal, usar classificação mais precisa ou omitir a classificação de Black.

---

## Atenção (4)

### A1 — Inconsistência de Fabricante (Dente 11 vs 21)

Dente 11: "3M ESPE - Filtek Z350 XT". Dente 21: "Solventum - Filtek Z350 XT". Mesma resina, nomes diferentes. Deveria usar o nome do inventário do usuário.

### A2 — Protocolos Diferentes para Dentes Homólogos

Dente 11: 4 camadas com A2D. Dente 21: 5 camadas com A1D e efeitos WT. São dentes homólogos com mesma indicação. Protocolos deveriam ser similares.

### A3 — Alertas BL Duplicados e Irrelevantes

Alertas sobre cores BL aparecem 2x em cada resultado. Paciente escolheu whitening "Natural", então alertas BL são irrelevantes.

### A4 — Dente 21 com Classe IV sem justificativa clara

Mesma situação do dente 11 — classificação possivelmente incorreta.

---

## Sugestões (3)

1. **Visagismo não realizado** — Sugerir ao dentista enviar foto da face
2. **Proporção áurea baixa sem destaque** — 65% golden ratio e 55% simetria precisam de mais ênfase visual
3. **Cor A2 em encaminhamentos** — Dentes 31/41 mostram "Cor Alvo: A2" que não é relevante para ortodontia

---

## Validações OK

- Notação FDI válida em todos os dentes
- Região correta (anterior superior/inferior)
- Classe IV em dentes anteriores (regra Black OK)
- Cores VITA válidas (A2, CT, A1E, A2D, A1D, WT)
- Esmalte com cor de esmalte (A1E), não body shades
- Hierarquia de tratamento respeitada
- Protocolo de cimentação de porcelana (dente 22) completo e correto
- Adesivo NÃO fotopolimerizado antes de assentar faceta (guardrail OK)
- Encaminhamentos ortodônticos adequados (31, 41)
- DSD consistente entre outputs
- Orçamento moderado respeitado (onde protocolo existe)
- Confiança alta nos protocolos
- Sof-Lex na ordem correta (grossa → ultrafina)

---

## Resumo por Dente

| Dente | Tratamento | Classificação | Protocolo | Camadas | Checklist | Status |
|-------|-----------|---------------|-----------|---------|-----------|--------|
| 11 | Resina | Classe IV Média | 4 camadas | CT, A1E, A2D, A1E | 14 passos | Classe IV questionável |
| 12 | Resina | Classe IV Média | **AUSENTE** | — | **AUSENTE** | Sem protocolo |
| 21 | Resina | Classe IV Média | 5 camadas | CT, A1E, A1D, WT, A1E | 10 passos | Fabricante diferente |
| 22 | Porcelana | — | Cimentação | — | 8 passos | OK |
| 31 | Encaminhamento | — | Ortodontia | — | 6 passos | OK |
| 41 | Encaminhamento | — | Ortodontia | — | 6 passos | OK |

---

## Comparação com QA Report #2

| Item | Report #2 | Report #3 |
|------|-----------|-----------|
| Sof-Lex ordem | Corrigido | OK |
| Adesivo pré-faceta | Corrigido | OK |
| Protocolo ausente | Não testado | NOVO BUG (dente 12) |
| Alertas duplicados | Não testado | NOVO (alertas BL) |
| Fabricante inconsistente | Não testado | NOVO |

## Nota sobre Migração

A migração para PageShell composites NÃO introduziu regressões visuais ou funcionais. Todos os dados clínicos renderizam corretamente. Os problemas encontrados são pré-existentes no backend (edge functions / prompts), não no frontend.
