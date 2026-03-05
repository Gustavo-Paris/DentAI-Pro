---
title: Design Critique Report
created: 2026-03-04
status: actionable
tags: [type/audit, design-critic]
---

# Design Critique Report

**Data**: 2026-03-04
**Modo**: Full Audit
**Paginas analisadas**: 14
**Screenshots**: Skipped (app not running locally)

## Score Geral

| Pilar | Score | Peso | Contribuicao |
|-------|-------|------|-------------- |
| Visual Consistency | 8/10 | 25% | 2.00 |
| Information Hierarchy | 8/10 | 25% | 2.00 |
| Interaction Quality | 8/10 | 20% | 1.60 |
| Spatial Design | 7.5/10 | 15% | 1.13 |
| Polish & Craft | 8/10 | 15% | 1.20 |
| **TOTAL** | | | **7.93/10** |

**Comparacao**: 5.85 → 7.0 (2026-02-24) → **7.93** (2026-03-04). Melhoria de +0.93 pontos.

## Score por Pagina

| Pagina | VC | IH | IQ | SD | PC | Total |
|--------|----|----|----|----|----| ------|
| Dashboard | 9 | 9 | 9 | 8 | 9 | 8.9 |
| Evaluations | 8 | 8 | 8 | 7 | 8 | 7.8 |
| EvaluationDetails | 8 | 8 | 8 | 8 | 8 | 8.0 |
| Patients | 8 | 8 | 8 | 8 | 8 | 8.0 |
| PatientProfile | 8 | 8 | 8 | 8 | 8 | 8.0 |
| Profile | 9 | 8 | 8 | 8 | 8 | 8.3 |
| Inventory | 8 | 8 | 8 | 7 | 8 | 7.8 |
| Landing | 9 | 9 | 8 | 8 | 9 | 8.7 |
| Pricing | 9 | 9 | 9 | 9 | 8 | 8.9 |
| Login/Register | 8 | 8 | 8 | 8 | 8 | 8.0 |
| NewCase (Wizard) | 8 | 8 | 8 | 8 | 8 | 8.0 |
| Result/GroupResult | 8 | 8 | 8 | 8 | 8 | 8.0 |
| VeneerPreparationCard | 7 | 8 | 7 | 7 | 7 | 7.2 |
| CementationProtocol | 7 | 8 | 7 | 7 | 7 | 7.2 |

## Destaques Positivos

A aplicacao evoluiu significativamente desde a auditoria anterior:

1. **Zero cores hardcoded** — Nenhum `bg-gray-*`, `text-white`, `bg-white`, `border-gray-*` encontrado em pages
2. **Tokens semanticos bem aplicados** — `bg-muted`, `text-muted-foreground`, `border-border` usados consistentemente
3. **Loading states corretos** — Todos os botoes async tem `disabled={loading}` + Loader2 spinner
4. **Empty states premium** — EmptyState.tsx tem icone + titulo + descricao + CTA
5. **Glass/glow effects** — glass-card, glow-card, ai-shimmer-border, neon-text usados com sabedoria
6. **Hover states** — Todos os cards clicaveis tem `hover:shadow-md transition-*`
7. **Focus visible** — `focus-visible:ring-2` presente em elementos interativos criticos
8. **prefers-reduced-motion** — Suportado em 15+ animacoes

## Findings

### P0 — Blockers (0 encontrados)

Nenhum blocker encontrado. A aplicacao esta livre de violacoes criticas.

### P1 — Must-Fix (4 encontrados)

#### [P1-001] AccordionItem rounded-lg em VeneerPreparationCard
**Pilar**: Visual Consistency
**Arquivo**: `apps/web/src/components/protocol/VeneerPreparationCard.tsx:60,85,110`
**Problema**: AccordionItems com `border` parecem cards mas usam `rounded-lg` em vez de `rounded-xl`
**Fix**:
```tsx
// Antes
<AccordionItem value="waxup" className="border rounded-lg">

// Depois
<AccordionItem value="waxup" className="border rounded-xl">
```
**Status**: Corrigido

#### [P1-002] AccordionItem rounded-lg em AddResinsDialog
**Pilar**: Visual Consistency
**Arquivo**: `apps/web/src/components/inventory/AddResinsDialog.tsx:126`
**Problema**: AccordionItem com `border` usa `rounded-lg` em vez de `rounded-xl`
**Fix**:
```tsx
// Antes
<AccordionItem key={brand} value={brand} className="border rounded-lg px-4">

// Depois
<AccordionItem key={brand} value={brand} className="border rounded-xl px-4">
```
**Status**: Corrigido

#### [P1-003] Resin info box com rounded minimo em EvaluationCards
**Pilar**: Visual Consistency
**Arquivo**: `apps/web/src/components/evaluation/EvaluationCards.tsx:120`
**Problema**: Box de resina usa `rounded` (2px) — muito pequeno, deveria ser `rounded-lg`
**Fix**:
```tsx
// Antes
<div className="mb-3 p-2 bg-muted/50 rounded">

// Depois
<div className="mb-3 p-2 bg-muted/50 rounded-lg">
```
**Status**: Corrigido

#### [P1-004] Gap muito apertado em grid de resin badges
**Pilar**: Spatial Design
**Arquivo**: `apps/web/src/components/inventory/AddResinsDialog.tsx:137`
**Problema**: `gap-2` entre badges clicaveis — apertado para touch targets
**Fix**:
```tsx
// Antes
<div className="flex flex-wrap gap-2">

// Depois
<div className="flex flex-wrap gap-2.5">
```
**Status**: Corrigido

### P2 — Advisory (0 encontrados)

Nenhum advisory significativo encontrado. Itens menores (accent colors em protocol cards) sao tokens de acento permitidos e intencionais para diferenciacao visual de secoes de protocolo.

## Resumo de Correcoes

| Severidade | Total | Corrigidos | Pendentes |
|------------|-------|------------|-----------|
| P0 | 0 | 0 | 0 |
| P1 | 4 | 4 | 0 |
| P2 | 0 | 0 | 0 |

## Screenshots

Skipped — aplicacao nao rodando localmente (`http://localhost:5173` connection refused).

## Recomendacoes Adicionais

1. **ProportionsCard.tsx** usa ~20 cores hardcoded (emerald, amber, pink, blue) para diagramas odontologicos. Sao aceitaveis como accent colors mas poderiam migrar para layer tokens (`--layer-*-rgb`) para consistencia maxima. Decisao do usuario.

2. **Protocol components** (CementationProtocolCard, VeneerPreparationCard) usam `text-blue-500`, `text-cyan-500`, `text-purple-500` para icones de secao. Sao accent colors intencionais, mas poderiam usar tokens `--layer-*-rgb` se desejado.

> **Cross-skill**: ProportionsCard seria melhor tratado pela skill `dental-qa-specialist` para validar se as cores de diagrama estao corretas clinicamente.

---

## Addendum: Dashboard Post-DesignOS Adjustments (2026-03-04)

### Redundancies Found & Fixed

#### [P1-005] TRIPLE credit display — CreditsPill + CreditsBanner + clinicAlerts
**Pilar**: Information Hierarchy
**Arquivos**: `Dashboard.tsx`
**Problema**: When credits <= 5, three UI elements displayed the same information:
1. CreditsPill (header): "X creditos" — always visible
2. CreditsBanner (afterHeader): "X creditos restantes" + upgrade CTA (dismissible)
3. clinicAlerts (afterHeader): "Creditos baixos" + count + upgrade CTA

With CreditsPill permanently showing count, CreditsBanner was sandwiched and redundant.
**Fix**: Removed CreditsBanner from Dashboard.tsx. CreditsPill (informational) + clinicAlerts (warning) = sufficient.
**Status**: Corrigido

#### [P2-003] Empty section comment blocks
**Pilar**: Polish & Craft
**Arquivo**: `Dashboard.tsx:37-43`
**Problema**: Two empty `// ===` section headers with no code between them.
**Fix**: Removed.
**Status**: Corrigido

#### [P2-004] slotsConfig useMemo missing `t` dependency
**Pilar**: Visual Consistency
**Arquivo**: `Dashboard.tsx`
**Problema**: `t('dashboard.creditsPill.label')` used in slotsConfig but `t` not in deps. Stale refs to removed CreditsBanner.
**Fix**: Added `t`, removed `dashboard.showCreditsBanner` and `dashboard.dismissCreditsBanner`.
**Status**: Corrigido

#### [P2-005] RecentSessions "Ver todas" vs CasosTab — noted, not fixed
**Pilar**: Information Hierarchy
**Problema**: "Ver todas" links to `/evaluations` (full page) while CasosTab (dashboard tab) shows same sessions.
**Decision**: Intentional — CasosTab is quick overview, /evaluations is full ListPage with pagination.

---

## Addendum 2: Playwright Visual Review (2026-03-04)

### Screenshots captured
- Desktop 1440x900: Principal, Casos, Insights tabs

### P1-006 — CasosTab dumps ALL sessions without pagination
**Pilar**: Information Hierarchy / Interaction Quality
**Arquivo**: `apps/web/src/pages/dashboard/CasosTab.tsx`
**Problema**: CasosTab rendered ALL sessions (100+ cards) in an endless scroll. `useEvaluationSessions` fetches up to 1000 evaluations and groups them client-side. No limit was applied.
**Fix**:
- Added `PAGE_SIZE = 10` constant
- Progressive "Ver mais" button to load 10 more at a time
- Reset visible count when filter changes
- Added count badges on filter pills (e.g., "Todos 47", "Concluidos 38")
**Status**: Corrigido

### P2-006 — CreditsPill in header + Sidebar credits
**Pilar**: Information Hierarchy
**Problema**: Sidebar shell shows "Creditos 245/900" permanently. CreditsPill in greeting header shows the same count.
**Decision**: Kept — sidebar is hidden on mobile. CreditsPill is contextually valuable in the greeting area. Not a true redundancy since they serve different viewport contexts.

### P2-007 — Filter pills lack count badges
**Pilar**: Interaction Quality
**Arquivo**: `apps/web/src/pages/dashboard/CasosTab.tsx`
**Problema**: Filter pills (Todos / Em Progresso / Concluidos) didn't show how many sessions were in each category. User had to click each filter to discover counts.
**Fix**: Added inline count badges to each filter pill.
**Status**: Corrigido (included in P1-006 fix)

### Updated Scores

| Pagina | VC | IH | IQ | SD | PC | Total |
|--------|----|----|----|----|----| ------|
| Dashboard | 9 | 9 | 9 | 8 | 9 | 8.9 |

CasosTab issues resolved. Score maintained at 8.9 (was dragged down by unpaginated list, now fixed).
