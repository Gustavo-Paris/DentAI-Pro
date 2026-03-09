---
title: Relatório QA E2E — ToSmile.ai
created: 2026-03-08
updated: 2026-03-08
status: published
tags: [type/guide, status/published]
---

# Relatório QA E2E — ToSmile.ai

**Data:** 2026-03-08
**Operador:** Claude Code (QA automatizado via Playwright MCP)
**Modo:** Full E2E — 3 casos clínicos com fotos reais
**Ambiente:** Produção — https://tosmile-ai.vercel.app
**Usuário:** Dr. Gustavo Barbosa Paris (210/900 créditos após testes)

---

## Resultado Geral: 🔴 2 erros críticos sistêmicos | ⚠️ 4 atenções | ✅ Múltiplas validações clínicas aprovadas

---

## Caso 1 — QA Test 1 (Sorriso Gengival)

**URL:** https://tosmile-ai.vercel.app/evaluation/58d6bccb-3318-411e-9e9d-c04f309c5c59
**Foto:** Mulher jovem, sorriso gengival acentuado
**Preferência de clareamento:** Branco Natural (B1/A1)
**Dentes detectados:** Gengiva (gengivoplastia)
**Status:** Protocolo gerado com sucesso ✅

### AI Outputs Capturados

**DSD:**
- 3 camadas geradas: Apenas Restaurações / Restaurações + Clareamento / Tratamento Completo (Gengiva)
- Confiança: alta
- Gengivoplastia auto-incluída pelo sistema (corretamente, conforme análise de sorriso gengival)

**Protocolo Gengivoplastia (12 etapas):**
1. Anestesia local infiltrativa vestibular — lidocaína 2% com epinefrina
2. Sondagem periodontal — confirmar nível de inserção e posição da JAC
3. Marcação dos pontos de sangramento — identificar novo nível gengival
4. Gengivoplastia com bisturi ou laser Er:YAG — seguir marcação dos pontos
5. Regularização do contorno gengival — criar arquitetura festonada natural
6. Irrigação com soro fisiológico — remover debris e coágulos
7. Hemostasia — verificar sangramento residual
8. Proteção com cimento cirúrgico (Coe-Pak) ou membrana de colágeno
9. Prescrição pós-operatória — AINE + clorexidina 0,12%
10. Orientações de higiene oral — escovaçao delicada, bochechos com clorexidina
11. Retorno 7 dias — remoção do cimento e avaliação cicatricial
12. Retorno 30-45 dias — avaliação final para início de procedimentos restauradores

**Resumo do Caso (Resultado page):**
- Procedimento: Gengivoplastia
- Estética: indicada

### Validações Clínicas

| Check | Resultado |
|-------|-----------|
| Gengivoplastia indicada para sorriso gengival | ✅ Clinicamente correto |
| 3 camadas DSD para caso com gengivoplastia | ✅ Correto (inclui camada de gengiva) |
| Protocolo sequencial cirúrgico coerente | ✅ Etapas em ordem lógica |
| Anestesia como etapa 1 | ✅ Correto |
| Cimento cirúrgico pós-operatório | ✅ Correto |
| Retorno em 2 tempos (7d + 30-45d) | ✅ Protocolo padrão |
| Clareamento NÃO incluído antes da cirurgia | ✅ Ordem correta (cirurgia primeiro) |
| Notação FDI | ✅ "Gengiva" (tratamento não-dentário, ausência de número é adequada) |

### Achados / Atenções

#### ⚠️ ID interno exposto na UI (BUG DE UI)
**Evidência:** No Resumo do Caso, o campo "Procedimento" mostrou `dsd_professional_choice` (ID raw de banco/enum) em vez de texto legível
**Impacto:** Baixo — cosmético, mas expõe nomenclatura interna ao usuário
**Sugestão:** Adicionar tradução i18n para `dsd_professional_choice` → "Escolha Profissional DSD" ou equivalente

---

## Caso 2 — QA Test 2 (Homem, Recontorno Estético)

**URL:** https://tosmile-ai.vercel.app/evaluation/c51c49e6-e5b2-4845-a9e9-09091830e684
**Foto:** Homem com barba, dentes amarelados/manchas, indicação de recontorno
**Preferência:** Branco Natural (A2)
**Dentes detectados:** 6 dentes com sugestões detalhadas
**Status:** FALHA CRÍTICA — Protocolo não gerado ❌

### AI Outputs Capturados (Análise + DSD — Parcialmente obtidos)

**Análise Fotográfica (6 dentes):**
- Dente 11: Recontorno estético, cor VITA A2, bordo incisal assimétrico com 21 (~0.5mm), desvio linha média direita
- Dente 21: Bordo incisal irregular, desarmonia cromática com 11
- Dente 22: Bordo incisal mais alto que 12, formato mais quadrado
- Dente 12: Bordo incisal inferior ao 22, proporção reduzida
- Dente 23: Ponta cuspídea levemente aplainada vs. 13
- Dente 13: Assimetria sutil com canino contralateral 23

**DSD:**
- 2 camadas: Apenas Restaurações / Restaurações + Clareamento
- Simetria: 62% | Proporção áurea: 58%
- Linha média dental desviada ~1mm à direita
- Plano oclusal inclinado à esquerda
- Laterais 12/22 com proporção reduzida (~55%, ideal 62-65%)

**Protocolo:** NÃO GERADO — edge function `recommend-resin` timeout

### Validações Clínicas

| Check | Resultado |
|-------|-----------|
| Detecção de assimetrias bilaterais (12/22) | ✅ Correto e clinicamente relevante |
| Proporção áurea corretamente abaixo do ideal (58%) | ✅ Plausível para caso com laterais conoide |
| Sugestão de clareamento antes de restaurações | ✅ Ordem correta |
| Laterais com proporção ~55% (ideal 62-65%) | ✅ Medida clinicamente plausível |
| Linha média dental desviada à direita | ✅ Detectado com quantificação (~1mm) |
| Estética: Funcional + Estratificação | ✅ Adequado para recontorno |
| Protocolo gerado | ❌ FALHA CRÍTICA |

### Achados / Bugs

#### 🔴 CRÍTICO — recommend-resin edge function timeout sistêmico
**Evidência:** Console: `Failed to process tooth 11: FunctionsFetchError` (repetido 9+ vezes)
**Comportamento:** Progress dialog trava em 25% indefinidamente; após timeout, protocolo salvo como "Planejado" sem dados
**Impacto:** BLOQUEANTE — 100% dos casos de Resina Composta ficam sem protocolo
**Reprodutibilidade:** 100% — confirmado em Case 2 (primeira vez), retry via "Reprocessar caso" (segunda vez), e Case 3 (terceira vez)
**Root cause provável:** Supabase edge function `recommend-resin` excedendo timeout de 150s ou Claude Sonnet 4.6 (primary) + Gemini fallback ambos falhando

#### 🔴 CRÍTICO — "Reprocessar caso" falha silenciosamente
**Evidência:** Clique em "Reprocessar caso" redireciona para `/evaluation/:id` sem loading state, sem feedback de sucesso ou erro, protocolo permanece "não disponível"
**Impacto:** Usuário não tem como recuperar um caso com protocolo falho sem contato com suporte
**Sugestão:** Exibir spinner durante retry, mostrar toast de erro específico se falhar novamente

#### 🟡 ATENÇÃO — "Recalcular Caso" navega para nova avaliação (comportamento incorreto)
**Evidência:** Botão "Recalcular Caso" na página de Resultado redireciona para `/new-case` em vez de acionar recálculo do protocolo
**Impacto:** Confuso — usuário acredita que vai recalcular o caso atual, mas inicia fluxo de novo caso
**Sugestão:** "Recalcular Caso" deveria reprocessar apenas o protocolo do dente atual via API, não abrir o wizard completo

---

## Caso 3 — QA Test 3 (Mulher, Escurecimento/Assimetrias)

**URL:** https://tosmile-ai.vercel.app/evaluation/baa15e57-7694-4fab-ba1e-9dd374d12574
**Foto:** Mulher ~35 anos, escurecimento intrínseco grave no 21, assimetrias bilaterais, arco do sorriso plano
**Anamnese:** Manchas brancas/descolorações, fluorose ou hipoplasia, interesse em harmonização estética
**Preferência:** Branco Natural (B1/A1)
**Dentes detectados:** 6 dentes (4 necessários + 2 estéticos)
**Status:** FALHA CRÍTICA — Protocolo não gerado (mesma causa que Caso 2) ❌
Análise fotográfica e DSD gerados com sucesso ✅

### AI Outputs Capturados

**Análise Fotográfica (completa):**

| Dente | Diagnóstico | Urgência | Tratamento |
|-------|-------------|----------|-----------|
| 21 | Escurecimento intrínseco severo (~2 tons VITA vs. 11), gradiente mais intenso cervical, dd: necrose pulpar vs. restauração metálica interna vs. pigmentação intrínseca | **IMEDIATO** | **Endodontia** → clareamento interno → resina/faceta |
| 11 | Bordo incisal irregular, desarmonia cromática com 21, desvio linha média direita | Eletivo | Resina Composta |
| 22 | Bordo incisal mais alto que 12 (~0.5-0.8mm), formato quadrado | Eletivo | Resina Composta |
| 12 | Bordo incisal inferior ao 22, proporção reduzida | Eletivo | Resina Composta |
| 23 | Ponta cuspídea aplainada vs. 13, possível desgaste parafuncional leve | Eletivo | Resina Composta |
| 13 | Assimetria sutil com 23, avaliação após tratamento do 23 | Eletivo | Resina Composta |

**DSD:**
- 2 camadas: Apenas Restaurações / Restaurações + Clareamento
- Confiança: alta
- Proporção áurea: 58% | Simetria: 62%
- Linha média dental desviada ~1-1.5mm à direita
- Plano oclusal: Nivelado ✅
- Espessura labial: Volumosa
- Gengivoplastia: descartada (corretamente — gengiva saudável, sem critério clínico)

**Observações gerais da IA:**
- Achado principal: escurecimento intrínseco severo dente 21 — dd completo com necrose pulpar como hipótese principal
- Arco do sorriso PLANO — recomendação de harmonização incisal
- Assimetria bilateral 12/22 (~0.5-0.8mm)
- Proporção áurea 58% (abaixo do ideal) — laterais com proporção reduzida
- Visagismo: lábios volumosos → temperamento sanguíneo → dentes ovais com bordos arredondados
- Radiografias complementares mandatórias (periapical + interproximal) para dente 21

**Protocolo:** NÃO GERADO — edge function `recommend-resin` timeout (confirmado por `Failed to process tooth 11: FunctionsFetchError`)

### Validações Clínicas

| Check | Resultado |
|-------|-----------|
| Escurecimento severo 21 → Endodontia (não resina) | ✅ EXCELENTE — escalada terapêutica correta |
| DD clínico completo para dente 21 (necrose / restauração metálica / pigmentação) | ✅ Clinicamente excelente |
| Urgência "Imediato" para dente 21 | ✅ Correto |
| Clareamento interno + restauração APÓS endo | ✅ Sequência correta |
| Radiografia periapical indicada para dente 21 | ✅ Mandatório clinicamente |
| Gengivoplastia descartada com gengiva saudável | ✅ Correto — sem critério clínico |
| Notação FDI dentes 11-23 | ✅ Todos válidos |
| Visagismo: lábios volumosos → dentes ovais | ✅ Coerente |
| Clareamento indicado APÓS resolução endodôntica | ✅ Ordem correta |
| Detecção de arco do sorriso plano | ✅ Achado clinicamente relevante |
| Assimetria bilateral 12/22 quantificada | ✅ Correto e útil |
| Protocolo de resina gerado | ❌ FALHA CRÍTICA (mesma causa) |

### Achados / Bugs

#### 🔴 CRÍTICO — recommend-resin timeout (terceira ocorrência consecutiva — sistêmico)
Mesma falha do Caso 2. Confirmada por 9 erros de console `recommend-resin:0`.
Progresso travado em 25% (Dente 11) após Dente 21 (Endodontia) ter sido processado com sucesso.

#### 💡 SUGESTÃO — Aviso de fluorose/hipoplasia não detectado
**Evidência:** Anamnese informou "fluorose ou hipoplasia de esmalte", mas o AI não mencionou manchas brancas (white spots) ou leucomas nos achados. Focou apenas no escurecimento do 21.
**Impacto:** Baixo — pode ser limitação da foto ou do campo visual, mas a anamnese deveria idealmente influenciar a análise
**Sugestão:** Verificar se o sistema de anamnese é enviado ao modelo de análise fotográfica ou apenas ao recommend-resin

#### 💡 SUGESTÃO — "Data de nascimento não informada" (toast de warning)
**Evidência:** Toast persistente "Data de nascimento não informada. Usando idade padrão de 30 anos." visível durante todo o fluxo
**Impacto:** Cosmético, mas frequente
**Sugestão:** Mostrar apenas uma vez ou ao final, não repetir durante processamento

---

## Sumário de Bugs Encontrados

### 🔴 Bugs Críticos (2 únicos, mas de alta impacto)

| # | Bug | Casos Afetados | Impacto |
|---|-----|----------------|---------|
| 1 | `recommend-resin` edge function timeout — 100% das chamadas falham em produção | Caso 2, Caso 3, retry do Caso 2 (3/3 tentativas) | BLOQUEANTE — nenhum protocolo de resina é gerado |
| 2 | "Reprocessar caso" falha silenciosamente sem feedback ao usuário | Caso 2 retry | Alto — UX sem saída para protocolo falho |

### 🟡 Atenções (3)

| # | Atenção | Caso | Impacto |
|---|---------|------|---------|
| 1 | "Recalcular Caso" redireciona para `/new-case` wizard em vez de recalcular protocolo | Caso 2 | Médio — comportamento confuso |
| 2 | ID interno `dsd_professional_choice` exposto na UI sem tradução i18n | Caso 1 | Baixo — cosmético |
| 3 | Toast "Data de nascimento não informada" persiste durante todo o fluxo | Caso 3 | Baixo — cosmético |

### ✅ Validações Clínicas Aprovadas

- **Diagnóstico diferencial correto** para escurecimento intrínseco severo (necrose pulpar como hipótese 1)
- **Escalada terapêutica correta**: Endodontia antes de restauração para dente 21
- **Gengivoplastia auto-incluída** corretamente em caso de sorriso gengival (Caso 1)
- **Gengivoplastia descartada corretamente** em caso com gengiva saudável (Caso 3)
- **DSD gerado com 3 camadas** quando há gengivoplastia, 2 camadas quando não há
- **Protocolo de gengivoplastia com 12 etapas** clinicamente coerente e sequenciado
- **Ordem correta**: clareamento APÓS cirurgia gengival; restauração APÓS endodontia
- **Detecção de arco do sorriso plano** com recomendação clínica adequada
- **Quantificação de assimetrias** (12/22) com valores em milímetros
- **Proporção áurea quantificada** (58%) — abaixo do ideal, com justificativa
- **Visagismo coerente**: lábios volumosos → temperamento sanguíneo → dentes ovais
- **Notação FDI válida** em todos os casos (11-23, Gengiva)
- **Radiografia periapical indicada** para dente 21 (mandatório para dd de necrose)
- **Confiança de análise informada** ao usuário (alta/média por caso)
- **Sistema de créditos funciona** — débito de 3 créditos por Análise Completa
- **Autosave funciona** — progresso salvo automaticamente durante wizard
- **DSD "Confiança alta"** em 2/2 casos com foto de boa qualidade

---

## Resumo por Caso

| Caso | Foto | Dentes | Análise | DSD | Protocolo | Status Geral |
|------|------|--------|---------|-----|-----------|-------------|
| QA Test 1 — Sorriso Gengival | Mulher, sorriso gengival | Gengiva | ✅ | ✅ 3 camadas | ✅ 12 etapas | ✅ Completo |
| QA Test 2 — Recontorno | Homem, amarelamento | 6 dentes | ✅ | ✅ 2 camadas | ❌ Timeout | 🔴 Protocolo ausente |
| QA Test 3 — Escurecimento/Assimetrias | Mulher, necrose 21 | 6 dentes (1 endo + 5 resina) | ✅ | ✅ 2 camadas | ❌ Timeout | 🔴 Protocolo ausente |

---

## Diagnóstico do Bug Crítico — recommend-resin timeout

### Evidências coletadas

1. Console error: `Failed to load resource: the server responded ... /functions/v1/recommend-resin:0` (HTTP error, possivelmente 504 Gateway Timeout)
2. `Failed to process tooth 11: FunctionsFetchError` — erro de nível de aplicação capturado
3. Progresso trava em 25% por >5 minutos sem avançar
4. Ocorreu em: Caso 2 (primeira tentativa), Caso 2 (retry via "Reprocessar caso"), Caso 3 (terceira tentativa independente)
5. O Dente 21 (Endodontia) foi processado com sucesso — apenas `recommend-resin` falha (não `recommend-cementation` ou outros)
6. `recommend-resin` usa Claude Sonnet 4.6 primary (45s timeout, maxRetries:1) → Gemini 2.0 Flash fallback (55s, maxRetries:1). Ambos parecem estar falhando.

### Hipóteses prováveis (por prioridade)

1. **Claude Sonnet 4.6 API indisponível/rate-limited** — failover para Gemini não funcionando
2. **Gemini 2.0 Flash fallback também falhando** — possível problema de configuração do model ID em produção
3. **Payload de entrada inválido** para o novo formato unificado de análise — campo `analysisResult` pode estar em formato diferente do esperado
4. **Secret `ANTHROPIC_API_KEY` expirada/inválida** no Supabase — `recommend-resin` usa Claude como primary
5. **Deno lockfile incompatível** — se `deno.lock` não foi deletado antes do deploy da função

### Recomendação imediata

```bash
# 1. Verificar logs da função em produção
npx supabase functions logs recommend-resin --project-ref zuoxqhvkts

# 2. Re-deploy da função sem lockfile
rm supabase/functions/_shared/../../../deno.lock 2>/dev/null || true
npx supabase functions deploy recommend-resin --no-verify-jwt --use-docker

# 3. Verificar secrets
npx supabase secrets list --project-ref zuoxqhvkts | grep -E "ANTHROPIC|GEMINI"
```

---

## Screenshots Capturados

Todos os screenshots estão em `/Users/gustavoparis/www/DentAI-Pro/`:

| Arquivo | Descrição |
|---------|-----------|
| `01-dashboard.png` | Dashboard inicial |
| `02-caso1-foto-uploaded.png` | Caso 1 — foto carregada |
| `03-caso1-dsd-analysis.png` | Caso 1 — análise DSD |
| `04-caso1-dsd-layer1.png` | Caso 1 — camada 1 DSD |
| `05-caso1-dsd-layer2-clareamento.png` | Caso 1 — camada 2 (clareamento) |
| `06-caso1-dsd-layer3-gengiva.png` | Caso 1 — camada 3 (gengiva) |
| `07-caso1-dsd-full-gengiva.png` | Caso 1 — DSD completo com gengiva |
| `08-caso1-revisao.png` | Caso 1 — revisão |
| `09-caso1-resultado.png` | Caso 1 — resultado/protocolo |
| `10-caso1-protocolo-gengivo.png` | Caso 1 — protocolo gengivoplastia |
| `11-caso2-foto-uploaded.png` | Caso 2 — foto carregada |
| `12-caso2-dsd.png` | Caso 2 — DSD gerado |
| `13-caso2-resultado-sem-protocolo.png` | Caso 2 — erro "Protocolo não disponível" |
| `14-caso3-foto-uploaded.png` | Caso 3 — foto carregada com anamnese |
| `15-caso3-dsd.png` | Caso 3 — DSD gerado (confiança alta) |
| `16-caso3-revisao.png` | Caso 3 — revisão da análise |

---

*Relatório gerado automaticamente via Playwright E2E QA — 2026-03-08*
