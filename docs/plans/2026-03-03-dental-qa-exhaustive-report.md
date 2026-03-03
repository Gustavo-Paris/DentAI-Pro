---
title: "Relatório QA Dental Exaustivo — Produção"
created: 2026-03-03
updated: 2026-03-03
status: published
tags: [type/qa-report, status/published]
---

# Relatório QA Dental — Produção 2026-03-03

**Data:** 2026-03-03
**Modo:** E2E Playwright + Análise de Código
**Outputs avaliados:** Protocolo de Estratificação, DSD, Passo a Passo, Alertas
**Ambiente:** Produção (https://tosmile-ai.vercel.app)
**Usuário:** gustavo.b.paris@gmail.com (247/900 créditos)

## Resultado: 🔴 5 erros críticos | ⚠️ 6 atenção | 💡 4 sugestões

---

## 🔴 Crítico (5)

### C1. Edge Function `analyze-dental-photo` — Indisponibilidade Total em Produção

**Evidência:** 15+ erros 500 consecutivos durante ~15 minutos de testes. Tanto Gemini 3.1 Pro (primary) quanto Claude Haiku 4.5 (fallback) falhando. Progress bar trava em 93-94%.
**Impacto:** **ZERO novas análises podem ser geradas.** Nenhum novo caso pode ser criado em produção. Aplicação efetivamente offline para novos usuários.
**Regra:** Disponibilidade de serviço — ambos os provedores de IA estão indisponíveis simultaneamente.
**Console errors:**
```
Failed to load resource: the server responded with a status of 500
  ...supabase.co/functions/v1/analyze-dental-photo
Edge function analyze-dental-photo error
```
**Sugestão:**
1. Verificar status da API Gemini (possível outage em `gemini-3.1-pro-preview`)
2. Verificar GOOGLE_AI_KEY e ANTHROPIC_API_KEY nos secrets do Supabase
3. Considerar timeout cascade: Gemini timeout 90s + Claude fallback timeout dinâmico pode exceder 150s do edge function
4. Adicionar health check endpoint que testa ambas APIs
5. Considerar circuit breaker com cache de status para evitar retry inútil

### C2. Aumento Incisal — Shade A1E em vez de Translúcido (Pré-fix)

**Evidência:**
- Caso 973239d0 (Dente 11): Aumento Incisal = Z350 XT **A1E** (0.3mm)
- Caso 5bd53a1b (6 dentes): Aumento Incisal = Z350 XT **A1E** (0.2-0.3mm)
**Regra clínica:** Aumento Incisal (Concha Palatina) deve usar shade translúcido (CT, BT, Trans, Opal) para reproduzir translucidez natural da borda incisal. A1E é enamel shade mas NÃO é translúcido o suficiente.
**Status:** Fix deployado (commit `ffc6310`) — Estelite Omega CT agora é o primeiro choice. **Não verificado em produção** porque edge function está down (C1).
**Sugestão:** Reprocessar casos existentes com "Recalcular Caso" após fix ser verificado.

### C3. Cristas Proximais — A1E em vez de XLE (Pré-fix parcial)

**Evidência:**
- Caso 5bd53a1b: Cristas = Harmonize **A1E** (0.2mm)
  - Alerta diz: "Cor XLE substituída por A1E: a cor original não está disponível na linha Z350 XT"
  - A IA recomendou Z350 XLE, shade-validation viu que Z350 não tem XLE, converteu para A1E
- Caso 973239d0: Cristas = Harmonize **XLE** (0.2mm) ✅ — corrigido
**Regra clínica:** Cristas Proximais requerem XLE (Harmonize) ou BL-L (Empress Direct) para definição de borda proximal adequada.
**Status:** Fix parcialmente verificado — caso 973239d0 mostra XLE correto, mas caso 5bd53a1b ainda mostra A1E (caso gerado antes do fix de cristas também).
**Sugestão:** O fix (ffc6310) inclui enforcement para Cristas → Harmonize XLE. Validar em novos casos.

### C4. Inconsistência Passo a Passo vs Protocolo

**Evidência em AMBOS os casos:**

**Caso 973239d0:**
| Passo | Diz | Protocolo Real |
|-------|-----|----------------|
| Step 7 | "Z350 XT shade **CT**" | A1E |
| Step 8 | "Z350 XT shade **A1E** (cristas)" | Harmonize **XLE** |
| Step 11 | "Estelite Omega shade **MW**" | Estelite Omega **WE** |

**Caso 5bd53a1b:**
| Passo | Diz | Protocolo Real |
|-------|-----|----------------|
| Step 5 | "Z350 XT **CT** (Clear Translucent)" | Z350 XT **A1E** |
| Step 6 | "Z350 XT **WE** (cristas)" | Harmonize **A1E** |
| Step 8 | "Empress **Halo Opaco (Empress Opal)**" | Empress **White** |

**Regra:** Cross-output consistency — Passo a passo e protocolo devem mostrar os MESMOS materiais/shades.
**Root cause:** O passo a passo é gerado pela IA com os shades originais ANTES da shade-validation. O protocolo exibe os shades APÓS validação. O passo a passo NÃO é atualizado após shade-validation.
**Sugestão:** Após shade-validation, atualizar o campo `steps` do protocolo para refletir os shades validados. Alternativamente, gerar passo a passo a partir dos dados validados do protocolo.

### C5. Caso Finalizado sem Protocolo — Integridade de Dados

**Evidência:** Caso 5915d768 (Dente 21, Classe III Média, VITA A2):
- Status: **Finalizado** ✅
- Protocolo: **"Protocolo não disponível — A geração do protocolo de resina não foi concluída"** ❌
- DSD: Presente e funcional (6 sugestões, 3 camadas)
**Regra:** Um caso marcado como "Finalizado" DEVE ter protocolo de resina gerado.
**Root cause provável:** O recommend-resin edge function falhou (possivelmente a mesma instabilidade de C1), mas o status foi marcado como concluído de qualquer forma.
**Sugestão:**
1. Adicionar validação: não permitir status "Finalizado" sem protocolo
2. Adicionar retry automático para casos com protocolo missing
3. Considerar status intermediário "Parcialmente concluído"

### C6. MW (Milky White) Substituído por WE no Esmalte Final — Catalog Data Issue

**Evidência:** Caso 973239d0: Esmalte Final mostra WE ao invés de MW (Milky White).
- Alerta diz: "Cor MW (Milky White) substituída por WE: a cor original não está disponível na linha Estelite Omega."
- MW IS available in Estelite Omega (confirmado no prompt line 426)
**Regra clínica:** Para VITA A2 sem clareamento, MW (natural) é mais apropriado que WE (mais branco).
**Root cause:** `resin_catalog` table provavelmente não tem MW cadastrado para Estelite Omega.
**Sugestão:** Auditar tabela `resin_catalog` para garantir completude de shades — CT para Z350, MW para Estelite Omega.

---

## ⚠️ Atenção (6)

### A1. Multi-brand no Protocolo (4 fabricantes diferentes)

**Evidência:** Caso 973239d0 usa 4 marcas diferentes:
- Z350 XT (3M ESPE) — Aumento Incisal, Dentina/Corpo
- Harmonize (Kerr) — Cristas
- Empress Direct Color (Ivoclar) — Efeitos Incisais
- Estelite Omega (Tokuyama) — Esmalte Final
**Preocupação:** Operacionalmente complexo — dentista precisa ter 4 sistemas de resina abertos. Pode afetar compatibilidade entre marcas (coeficientes de expansão térmica diferentes).
**Sugestão:** Considerar flag de preferência "Manter mesma marca quando possível" ou limitar a 2 fabricantes.

### A2. Smile Line "Baixa" sem Alerta Específico

**Evidência:** Caso 5bd53a1b mostra "Linha do Sorriso: Baixa" com ícone de atenção, mas protocolo de 5 camadas permanece idêntico a casos com smile line "Média".
**Preocupação:** Smile line baixa significa que os lábios cobrem parcialmente os dentes. Protocolo estético de 5 camadas pode ser overengineering se pouca superfície é visível.
**Sugestão:** Para smile line baixa, considerar sugerir protocolo simplificado ou adicionar nota "Menor área de exposição estética — protocolo completo opcional."

### A3. Acabamento & Polimento com "N/A" repetido

**Evidência:** Caso 5bd53a1b mostra múltiplos "⏱ N/A" e "🔄 N/A" no acabamento:
- Bisturi nº12: ⏱ N/A, 🔄 N/A, 💡 N/A
- Diamantada 3118FF: ⏱ N/A
**Preocupação:** Informações incompletas no protocolo. "N/A" não é útil clinicamente.
**Sugestão:** Preencher tempos estimados para todas as etapas (e.g., Bisturi: ~30s, Diamantada: ~20-30s por face).

### A4. "Considerar clareamento previamente" em checklist sem destaque

**Evidência:** Caso 5bd53a1b, Step 0: "Se paciente deseja BL1/BL2/Hollywood -> Considerar clareamento previamente às resinas."
**Preocupação:** Este é um aviso crítico para o fluxo clínico que pode ser facilmente ignorado no meio de 17 steps.
**Sugestão:** Destacar como alert box separado ANTES do checklist, não como item do checklist.

### A5. Proporção Áurea 62% sem Sugestão Específica

**Evidência:** Caso 5915d768 (Dente 21): Proporção Áurea 62% (abaixo do ideal de 70-80%).
**Preocupação:** Valor significativamente abaixo do ideal mas não gera recomendação específica de correção.
**Sugestão:** Quando proporção áurea < 65%, gerar sugestão específica (e.g., "Considerar reanatomização dos laterais para melhorar proporção").

### A6. Whitening Preference "Hollywood (BL1)" mas Protocolo Ausente

**Evidência:** Caso 5915d768: Paciente escolheu "Clareamento intenso - nível Hollywood (BL1)" mas protocolo não foi gerado. Se fosse gerado, precisaria usar shades BL.
**Preocupação:** Caso não testável — não sabemos se o protocolo respeitaria a preferência de clareamento.
**Sugestão:** Reprocessar este caso quando edge function estiver estável.

---

## 💡 Sugestões (4)

### S1. Adicionar Health Check para APIs de IA
Implementar endpoint `/health-check-ai` que testa conectividade com Gemini e Claude antes de permitir novas análises. Mostrar banner na UI quando API está indisponível.

### S2. Melhorar Error Recovery para Protocolos Falhos
Quando `recommend-resin` falha, registrar o erro e agendar retry automático (cron ou webhook). Não permitir status "Finalizado" sem protocolo.

### S3. Unificar Shades entre Protocolo e Passo a Passo
Após shade-validation, aplicar os mesmos shades substituídos no campo `steps[]` do protocolo. Isso elimina a inconsistência C4 na raiz.

### S4. Reprocessar Casos Pré-Fix
Identificar casos com Aumento Incisal = A1E e Cristas != XLE, oferecer "Recalcular em Batch" para aplicar o novo shade-validation.

---

## ✅ Validações OK

- **FDI Notation:** Todos os dentes usam notação FDI válida (11-23, 31-43)
- **Black Classification:** Classe III no dente 21 (anterior) — correto
- **Treatment Hierarchy:** Resina composta como primeira opção para todos — correto (conservador)
- **Layer Count:** 5 camadas para anterior estético — correto e consistente
- **VITA Shade Básica:** A2 detectada, A2B usado para corpo — consistente
- **Efeitos Incisais:** Marcado como opcional — correto
- **DSD Proportions:** Valores percentuais coerentes (simetria, proporção áurea)
- **DSD Midlines:** Facial centrada, dental alinhada — consistente
- **Bruxism Warning:** Caso 973239d0 inclui placa oclusal — correto
- **"O que NÃO fazer":** Alertas clinicamente corretos (ácido 30s dentina, borda opaca, bisel amplo)
- **Alternativa Simplificada:** Presente em ambos os casos — fornece opção mais simples
- **Confiança:** "Alta Confiança (3/3)" — indicador presente e funcional
- **Acabamento:** Sequência lógica (contorno → lixa → borracha → brilho) — correto
- **Créditos:** Sistema de créditos funcional, diálogo de confirmação operacional

---

## Resumo por Caso

| Caso | Dente(s) | Tratamento | Protocolo | Status QA |
|------|----------|------------|-----------|-----------|
| 973239d0 | 11 | Recontorno Estético | 5 camadas | ⚠️ A1E em Aumento Incisal (pré-fix), step inconsistency |
| 5915d768 | 21 | Resina Classe III | **AUSENTE** | 🔴 Finalizado sem protocolo |
| 5bd53a1b | 11,12,13,21,22,23 | Resina (Unificado) | 5 camadas | ⚠️ A1E em Aumento Incisal e Cristas (pré-fix), step inconsistency |

---

## Bloqueadores

1. **Edge function `analyze-dental-photo` retornando 500** — Impossível criar novos casos para validar o fix de shade-validation (commit `ffc6310`). Necessário investigar urgentemente.
2. **Não foi possível testar com as 3 fotos** (foto1, foto2, foto3) — blocked por C1.
3. **Fix de shade-validation não verificado em produção** — Precisa de novo caso gerado após o fix.

---

## Ações Recomendadas (Prioridade)

1. **[P0] Investigar e corrigir edge function 500** — Verificar API keys, Gemini model availability, timeout cascade
2. **[P1] Fix step-by-step inconsistency** — Aplicar shades pós-validação no campo steps
3. **[P1] Fix integridade "Finalizado" sem protocolo** — Validar antes de marcar como concluído
4. **[P2] Validar shade-validation fix (ffc6310)** — Criar novo caso quando edge function estiver estável
5. **[P2] Reprocessar casos pré-fix** — Aumento Incisal A1E → CT e Cristas A1E → XLE
6. **[P3] Melhorar N/A no acabamento** — Preencher tempos para todas etapas
7. **[P3] Health check de IA** — Endpoint + banner na UI

---

*Gerado por dental-qa-specialist via Playwright E2E + análise de código*
*Sessão: 2026-03-03 14:48 — 15:10 UTC*
