---
title: Correções do Feedback do Especialista
created: 2026-02-16
updated: 2026-02-16
status: draft
tags:
  - type/plan
  - status/draft
---

# Correções do Feedback do Especialista

> Plano baseado na análise de 2 documentos de feedback clínico (Documentos 32 e 33).

## Contexto

Um especialista em odontologia estética revisou outputs do sistema AURIA (ToSmile.ai) e identificou problemas em 3 áreas:

1. **Protocolo de resina** — cores/shades incorretas, resinas erradas por camada
2. **Análise DSD** — falhas na detecção de restaurações, diastemas, inclinações
3. **UX/Frontend** — falta de consent term, navegação travada, DSD incompleto

## Issues Identificadas (15)

### A. Protocolo de Resina (`recommend-resin`) — 6 issues

#### A1. Z350 não possui cor BL1

**Problema:** AI gera BL1 como shade para Filtek Z350 XT, mas essa cor NÃO EXISTE nessa linha.

**Status atual do prompt:** L382 já lista shades corretas: `CT, GT, BT, YT, A1E, A2E, A3E, B1E` — sem BL1.

**Root cause:** AI ignora tabela de shades. Shade validation (`shade-validation.ts`) deveria corrigir, mas precisa verificar se `resin_catalog` DB está correto.

**Correção:**
1. Verificar e corrigir tabela `resin_catalog` no Supabase (garantir Z350 NÃO tem BL1)
2. Adicionar regra explícita no prompt: `"PROIBIDO: BL1/BL2/BL3 para Z350 XT (NÃO existem na linha)"`
3. Shade validation já faz fallback — verificar se está funcionando

**Arquivos:**
- `supabase/functions/_shared/prompts/definitions/recommend-resin.ts` (tabela de shades + regra)
- `supabase/functions/recommend-resin/shade-validation.ts` (validação)
- Tabela `resin_catalog` no Supabase

---

#### A2. WB = White Body, NÃO Warm Bleach

**Problema:** AI descreve WB como "Warm Bleach" na descrição do protocolo. O correto é "White Body" (corpo branco/neutro).

**Root cause:** Prompt não define explicitamente o significado das siglas. AI inventa.

**Correção:**
1. Adicionar glossário de siglas no prompt:
```
GLOSSARIO DE SIGLAS (OBRIGATORIO):
- WB = White Body (corpo branco/neutro) — NAO "Warm Bleach"
- CT = Clear Translucent
- WE = White Enamel
- MW = Milky White
- JE = Jewel Enamel (Estelite Omega)
- BL-L = Bleach Light (Empress Direct)
- XLE = Extra Light Enamel (Harmonize)
```

**Arquivos:**
- `supabase/functions/_shared/prompts/definitions/recommend-resin.ts`

---

#### A3. Cristas Proximais: deve usar XLE Harmonize / BL-L Empress

**Problema:** AI usa Filtek Z350 XT para cristas proximais. Especialista diz que deve ser XLE Harmonize ou BL-L Empress Direct.

**Status atual:** Prompt L130 já diz `SOMENTE XLE(Harmonize) ou BL-L/BL-XL(Empress)` — AI viola a regra.

**Correção:**
1. Reforçar com regra negativa: `"PROIBIDO: Z350/FORMA/Vittra/Palfique/Estelite para Cristas Proximais"`
2. Adicionar validação pós-AI: se camada "Cristas Proximais" não usa Harmonize ou Empress → forçar substituição

**Arquivos:**
- `supabase/functions/_shared/prompts/definitions/recommend-resin.ts` (reforçar regra)
- `supabase/functions/recommend-resin/shade-validation.ts` (validação de camada)

---

#### A4. Esmalte Vestibular Final: deve ser WE/MW (Palfique/Estelite)

**Problema:** AI usa Z350 com BL1 para esmalte final. Especialista diz usar WE/MW de Palfique LX5 ou Estelite.

**Status atual:** Prompt L372 já prioriza Palfique/Estelite como P1. AI ignora.

**Correção:**
1. Reforçar: `"PREFERENCIA OBRIGATORIA esmalte final: WE(Palfique LX5) ou WE/MW(Estelite Omega). Z350 SOMENTE se Palfique/Estelite indisponíveis no inventário."`
2. Adicionar validação pós-AI: se esmalte final usa Z350 E (Palfique OU Estelite no catálogo) → alert
3. Para protocolo premium, esmalte final WE/MW é OBRIGATÓRIO (não opcional)

**Arquivos:**
- `supabase/functions/_shared/prompts/definitions/recommend-resin.ts`
- `supabase/functions/recommend-resin/shade-validation.ts`

---

#### A5. Alternativa Simplificada: JE inadequada para cristas

**Problema:** Alternativa simplificada com Estelite Omega usa JE (Jewel Enamel) para cristas. Especialista diz que não existe/inadequada.

**Nota:** JE tecnicamente existe na linha Estelite Omega, mas não é a melhor escolha para cristas proximais.

**Correção:**
1. Atualizar seção de alternativa simplificada no prompt:
```
ALTERNATIVA SIMPLIFICADA - CRISTAS PROXIMAIS:
- XLE (Harmonize) — preferencial
- BL-L (Empress Direct) — alternativa
- PROIBIDO: JE, CT, Trans para cristas na alternativa
```

**Arquivos:**
- `supabase/functions/_shared/prompts/definitions/recommend-resin.ts`

---

#### A6. Alternativa simplificada deve sugerir WE Palfique / W3-W4 Estelite Bianco

**Problema:** Para dentes clareados, alternativa simplificada deve priorizar Palfique WE ou Estelite Bianco W3/W4.

**Correção:**
1. Expandir seção `ALTERNATIVA SIMPLIFICADA` no prompt:
```
ALTERNATIVA SIMPLIFICADA (2 camadas):
- Corpo: WB(FORMA/Z350), DA1(Empress/Vittra)
- Esmalte: WE(Palfique LX5) — preferencial
- Dentes clareados: W3/W4(Estelite Bianco) ou BL(Forma)/BL-L(Empress)
```

**Arquivos:**
- `supabase/functions/_shared/prompts/definitions/recommend-resin.ts`

---

### B. Análise DSD (`dsd-analysis`) — 4 issues

#### B7. Diastema vs. Restaurações Insatisfatórias

**Problema:** AI detectou "diastema entre centrais" quando na verdade são restaurações antigas insatisfatórias com gap.

**Root cause:** Prompt não diferencia gap por restauração degradada vs. diastema verdadeiro.

**Correção:**
1. Adicionar regra de diferenciação no prompt `dsd-analysis.ts`:
```
DIFERENCIACAO DIASTEMA vs. RESTAURACAO INSATISFATORIA:
- DIASTEMA VERDADEIRO: Espaço entre dentes NATURAIS (sem evidência de material restaurador)
- RESTAURACAO INSATISFATORIA: Gap entre dentes COM evidência de:
  * Diferença de cor/textura nas faces proximais
  * Interface restauração/dente visível
  * Material degradado/manchado na região
  * Contorno anatômico alterado
- Se há QUALQUER indício de restauração prévia na região do gap → classificar como "Restauração insatisfatória", NÃO diastema
- Tratamento correto: SUBSTITUIÇÃO de restauração (não "fechamento de diastema")
```

**Arquivos:**
- `supabase/functions/_shared/prompts/definitions/dsd-analysis.ts`

---

#### B8. Não detectou restaurações Classe III em 12/21

**Problema:** AI falhou em detectar restaurações Classe III (mesial e distal) nos dentes 12 e 21.

**Root cause:** Regra "DETECCAO ULTRA-CONSERVADORA" pode estar muito restritiva.

**Correção:**
1. Adicionar guia para detectar Classe III no prompt:
```
DETECCAO DE RESTAURACOES CLASSE III (PROXIMAIS):
Restaurações proximais (Classe III) são FREQUENTEMENTE INVISIVEIS na vista frontal.
BUSCAR ativamente:
- Sombra escura/cinza na região proximal (material antigo)
- Diferença de translucidez entre face vestibular e proximal
- Linha de interface na transição dente/restauração
- Mudança abrupta de textura superficial
- Descoloração proximal visível entre dentes adjacentes
Se detectadas: classificar como "Restauração Classe III insatisfatória" com prioridade ALTA
```

**Arquivos:**
- `supabase/functions/_shared/prompts/definitions/dsd-analysis.ts`

---

#### B9. Não detectou inclinação vestibular e desarmonia de formato

**Problema:** Dente 12 com inclinação vestibular e formato diferente do 22 não foi detectado.

**Correção:**
1. Adicionar regra de comparação de homólogos:
```
COMPARACAO OBRIGATORIA DE HOMOLOGOS (12/22, 11/21, 13/23):
Para cada par de homólogos visíveis, comparar:
1. INCLINACAO: vestibular/lingual/vertical — assimetria = sugestão de correção
2. FORMATO: se formato do dente difere do contralateral → desarmonia estética
3. TAMANHO: largura e comprimento comparados
4. POSICAO: rotação, extrusão, intrusão
Se inclinação vestibular detectada: sugerir "Reanatomização" ou "Faceta" para harmonizar com contralateral.
```

**Arquivos:**
- `supabase/functions/_shared/prompts/definitions/dsd-analysis.ts`

---

#### B10. Não sugeriu recontorno nos centrais

**Problema:** Caso precisava de recontorno nos centrais para harmonia e AI não sugeriu.

**Correção:**
1. Reforçar regra existente de recontorno entre homólogos (já existe L192-194):
```
RECONTORNO PARA HARMONIA DO SORRISO:
Além de desnível entre homólogos, avaliar:
- Centrais (11/21) com formato ou proporção diferentes entre si
- Centrais com comprimento inadequado para harmonia com arco do sorriso
- Centrais que beneficiariam de recontorno para melhorar proporção L/A
Se recontorno melhora harmonia: sugerir MESMO que dentes estejam íntegros.
```

**Arquivos:**
- `supabase/functions/_shared/prompts/definitions/dsd-analysis.ts`

---

### C. DSD Simulation (`dsd-simulation`) — 2 issues

#### C11. DSD deve incluir pré-molares

**Problema:** DSD dos dentes deve incluir pré-molares quando visíveis no sorriso.

**Status atual:** Prompt de simulação foca em canino-a-canino.

**Correção:**
1. Expandir mask de inpainting no prompt `dsd-simulation.ts`:
```
EXTENSAO DO DSD ATE PRE-MOLARES:
Se pré-molares (14/15/24/25) são VISIVEIS na foto:
- INCLUIR na simulação (whitening, harmonização de cor)
- Manter proporções naturais (pré-molares menores que caninos)
- Se pré-molares têm restaurações antigas/desarmonia → incluir correção
ZONA DE SIMULACAO: Toda a arcada visível no sorriso, incluindo pré-molares.
```

**Arquivos:**
- `supabase/functions/_shared/prompts/definitions/dsd-simulation.ts`

---

#### C12. Foto de rosto: DSD deve mostrar face completa

**Problema:** Se paciente sobe foto de rosto completo, DSD deve mostrar o rosto na simulação, não apenas a boca.

**Status atual:** Sistema preserva face como referência mas pode estar cortando o output.

**Correção:**
1. Verificar se DSD simulation retorna imagem full-face ou cropped
2. Se está cropando: alterar inpainting mask para manter face completa no output
3. Adicionar instrução no prompt: `"Se input é foto de ROSTO COMPLETO, output DEVE ser rosto completo com simulação no sorriso. NÃO cropar para boca apenas."`

**Arquivos:**
- `supabase/functions/_shared/prompts/definitions/dsd-simulation.ts`
- `supabase/functions/generate-dsd/index.ts` (verificar image processing)

---

### D. Frontend/UX — 3 issues

#### D13. Termo de consentimento (consent modal)

**Problema:** Não existe tela de consentimento antes de usar o sistema.

**Requisitos do especialista:**
- Proteção de dados e imagens dos pacientes (LGPD)
- Processo realizado com IA
- São sugestões de tratamento para facilitar o dia a dia
- NÃO dispensam avaliação do dentista
- Decisão final de tratamento é do dentista
- Resultado possui outros fatores envolvidos

**Correção:** Modal no primeiro acesso com checkbox "Aceito".
1. Criar componente `ConsentModal`
2. Salvar aceite no perfil do usuário (Supabase `profiles` table, campo `consent_accepted_at`)
3. Verificar aceite antes de permitir criar caso
4. Texto do modal:
   - Disclaimer IA
   - LGPD (imagens e dados)
   - Responsabilidade do dentista
   - Checkbox obrigatório

**Arquivos:**
- `apps/web/src/components/ConsentModal.tsx` (novo)
- `apps/web/src/pages/NewCase.tsx` (verificar consent antes do wizard)
- `apps/web/src/hooks/domain/useConsent.ts` (novo hook)
- Migration Supabase: `consent_accepted_at` em `profiles`

---

#### D14. Botão "Recalcular" para mudar padrão/premium

**Problema:** Após gerar o resultado (step 6), não há como voltar e trocar entre padrão/premium.

**Correção:** Botão "Recalcular Caso" no step 6 (Result) que volta ao step 5 (Review).
1. Adicionar botão no `Result.tsx`
2. Alterar `useWizardNavigation.ts` para permitir `goToStep(5)` a partir do step 6
3. Manter dados do formulário ao voltar (já persistem em `formData`)
4. Re-submit com novo budget gera novo protocolo de resina

**Arquivos:**
- `apps/web/src/pages/Result.tsx` (botão)
- `apps/web/src/hooks/domain/wizard/useWizardNavigation.ts` (permitir nav)

---

#### D15. Gengivoplastia deve aparecer nas opções de tratamento + especificar dentes

**Problema:** Quando DSD sugere gengivoplastia, deve OBRIGATORIAMENTE aparecer nas opções de tratamento na UI com especificação dos dentes.

**Status atual:** Prompt já gera sugestões de gengivoplastia com `tooth_number`, mas precisa verificar:
1. Se o frontend renderiza sugestões do tipo "gengivoplastia"
2. Se os dentes são especificados na exibição

**Correção:**
1. Verificar `TreatmentBanners` e `ToothSelectionCard` — garantir que gengivoplastia aparece
2. Se o DSD sugere gengivoplastia mas está ausente nas opções de tratamento, mapear o gap no fluxo de dados
3. Garantir que dentes são listados individualmente (não genérico)

**Arquivos:**
- `apps/web/src/components/wizard/ReviewAnalysisStep.tsx`
- `apps/web/src/components/wizard/TreatmentBanners.tsx`
- `apps/web/src/pages/Result.tsx`

---

## Prioridade de Implementação

### P0 — Erros Clínicos (correções no prompt, maior impacto)
1. **A1** — Z350 sem BL1 (shade inexistente, erro técnico)
2. **A2** — WB = White Body (terminologia errada)
3. **A3** — Cristas proximais (resina errada)
4. **A4** — Esmalte final (resina errada)
5. **B7** — Diastema vs. restauração insatisfatória (diagnóstico errado)

### P1 — Melhorias de Detecção (prompt DSD)
6. **B8** — Detecção de restaurações Classe III
7. **B9** — Comparação de homólogos (inclinação/formato)
8. **B10** — Recontorno para harmonia
9. **A5** — JE inadequada para cristas (alternativa)
10. **A6** — Alternativa simplificada (WE Palfique / Estelite Bianco)

### P2 — DSD Simulation
11. **C11** — Incluir pré-molares
12. **C12** — DSD com face completa

### P3 — Frontend/UX
13. **D13** — Consent modal
14. **D14** — Botão recalcular
15. **D15** — Gengivoplastia na UI

---

## Estimativa de Arquivos Impactados

| Arquivo | Issues |
|---------|--------|
| `supabase/functions/_shared/prompts/definitions/recommend-resin.ts` | A1-A6 |
| `supabase/functions/recommend-resin/shade-validation.ts` | A1, A3, A4 |
| `supabase/functions/_shared/prompts/definitions/dsd-analysis.ts` | B7-B10 |
| `supabase/functions/_shared/prompts/definitions/dsd-simulation.ts` | C11, C12 |
| `supabase/functions/generate-dsd/index.ts` | C12 |
| `apps/web/src/components/ConsentModal.tsx` (novo) | D13 |
| `apps/web/src/pages/NewCase.tsx` | D13 |
| `apps/web/src/pages/Result.tsx` | D14 |
| `apps/web/src/hooks/domain/wizard/useWizardNavigation.ts` | D14 |
| `apps/web/src/components/wizard/ReviewAnalysisStep.tsx` | D15 |
| Tabela `resin_catalog` (Supabase) | A1 |
| Tabela `profiles` (Supabase) | D13 |
