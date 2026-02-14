---
title: "Ajustes do Feedback da Especialista"
created: 2026-02-14
updated: 2026-02-14
status: draft
tags:
  - type/guide
  - status/draft
---

# Ajustes do Feedback da Especialista

## Contexto

A especialista clínica revisou o sistema e forneceu dois feedbacks principais:

1. **Protocolo de Resina (Prompt da IA)**: Correções nas recomendações de materiais para efeitos incisais e alternativa simplificada
2. **UI de Tratamentos Gerados**: Simplificação da tabela de tratamentos para mostrar apenas o grupo, não dentes individuais

Fonte: `Documento sem título-25.pdf` (feedback da especialista, 2026-02-14)

## Feedback 1: Prompt `recommend-resin.ts`

### 1a. Efeitos Incisais — SEMPRE Empress Direct Color white/blue

**Problema**: O prompt permite corantes de múltiplas marcas (Kolor+ Kerr, IPS Color genérico) para efeitos incisais. A especialista exige que APENAS Empress Direct Color (white/blue) seja usado.

**Arquivo**: `supabase/functions/_shared/prompts/definitions/recommend-resin.ts`

**Mudanças**:

- **Linha 129** — Tabela de materiais por camada:
  - De: `IPS Color(Ivoclar), Kolor+(Kerr) — Z350 NAO tem corantes!`
  - Para: `EMPRESS DIRECT COLOR White/Blue (Ivoclar) — UNICA opção! Z350/Kolor+ NAO!`

- **Linhas 139-145** — Sub-opções de efeitos incisais:
  - Remover Kolor+(Kerr) de todas as linhas
  - Corante Branco: usar apenas `Empress Direct Color White`
  - Corante Ambar: usar apenas `Empress Direct Color Honey/Amber`

- **Linha 270** — Instrução de nível estético:
  - De: `Corantes IVOCLAR IPS Empress Direct Color ou IPS Color — NUNCA Z350!`
  - Para: `SEMPRE corantes EMPRESS DIRECT COLOR White/Blue — NUNCA Z350, NUNCA Kolor+!`

### 1b. MW NÃO serve para corpo — Alternativa simplificada WE/W3/W4

**Problema**: O prompt lista MW (Medium White, Estelite Omega) como opção para esmalte/corpo. A especialista diz que MW não serve para corpo; usar WE/W3/W4.

**Mudanças**:

- **Linha 130** — Tabela de esmalte final:
  - De: `WE(Palfique LX5), MW(Estelite Omega), A1E/A2E(Z350)`
  - Para: `WE(Palfique LX5), A1E/A2E(Z350)`

- **Linha 274** — Prioridades P1:
  - De: `P1: Palfique LX5 (WE), Estelite Omega (MW/WE) — acabamento espelhado`
  - Para: `P1: Palfique LX5 (WE), Estelite Omega (WE) — acabamento espelhado. MW NAO SERVE para corpo!`

- **Linha 282** — Cores Estelite Omega:
  - De: `WE, JE, CT, MW`
  - Para: `WE, JE, CT`

- **Nova regra** (após linha 288) — Alternativa simplificada:
  - Adicionar: `ALTERNATIVA SIMPLIFICADA: Para corpo usar WE/W3/W4 (NUNCA MW). MW é Medium White — inadequado para corpo.`

## Feedback 2: UI `EvaluationDetails.tsx`

### Remover linhas individuais dente a dente

**Problema**: Quando dentes compartilham o mesmo protocolo (grupo), a tabela mostra o cabeçalho do grupo E linhas individuais para cada dente. A especialista quer ver APENAS o grupo.

**Arquivo**: `apps/web/src/pages/EvaluationDetails.tsx`

**Mudança**: Quando `showGroupHeader === true` (grupo com 2+ dentes), NÃO renderizar as linhas individuais (linhas 402-452). Manter apenas a linha do grupo (linhas 365-401) com "Ver Protocolo".

Para grupos com 1 dente apenas, continua renderizando a linha individual normalmente.

**Antes**:
```
[x] RESINA — 6 DENTES: 11, 12, 13, 21, 22, 23 (protocolo unificado)  [Ver Protocolo]
[ ] 11  Resina  Planejado (0/19)  [...]
[ ] 12  Resina  Planejado (0/19)  [...]
[ ] 13  Resina  Planejado (0/19)  [...]
[ ] 21  Resina  Planejado (0/19)  [...]
[ ] 22  Resina  Planejado (0/19)  [...]
[ ] 23  Resina  Planejado (0/19)  [...]
```

**Depois**:
```
[x] RESINA — 6 DENTES: 11, 12, 13, 21, 22, 23 (protocolo unificado)  [Ver Protocolo]
```

## Arquivos Afetados

| Arquivo | Tipo de Mudança |
|---------|----------------|
| `supabase/functions/_shared/prompts/definitions/recommend-resin.ts` | Edição de texto do prompt |
| `apps/web/src/pages/EvaluationDetails.tsx` | Condicional para ocultar linhas individuais |

## Impacto

- **Prompt**: Afeta APENAS novas recomendações de resina. Casos existentes não são retroativos.
- **UI**: Afeta visualização de todos os casos com 2+ dentes do mesmo tipo/protocolo.
- **Sem breaking changes**: Nenhuma estrutura de dados muda, apenas instrução textual do prompt e renderização condicional.
