---
title: Design Critique Report
created: 2026-02-23
status: completed
tags: [type/audit, design-critic]
---

# Design Critique Report

**Data**: 2026-02-23
**Modo**: Full Audit
**Paginas analisadas**: 15
**Componentes analisados**: 7

## Score Geral

| Pilar | Score | Peso | Contribuicao |
|-------|-------|------|--------------|
| Visual Consistency | 8.7/10 | 25% | 2.18 |
| Information Hierarchy | 9.0/10 | 25% | 2.25 |
| Interaction Quality | 9.1/10 | 20% | 1.82 |
| Spatial Design | 8.8/10 | 15% | 1.32 |
| Polish & Craft | 8.6/10 | 15% | 1.29 |
| **TOTAL** | | | **8.86/10** |

## Score por Pagina

| Pagina | VC | IH | IQ | SD | PC | Total |
|--------|----|----|----|----|----|----|
| Dashboard | 9 | 9 | 9 | 9 | 8 | 8.8 |
| Evaluations | 9 | 9 | 9 | 8 | 9 | 8.8 |
| Patients | 9 | 9 | 9 | 9 | 8 | 8.8 |
| Inventory | 9 | 9 | 9 | 8 | 8 | 8.6 |
| Profile | 9 | 9 | 9 | 8 | 8 | 8.6 |
| Pricing | 10 | 9 | 9 | 9 | 9 | 9.2 |
| NewCase | 9 | 9 | 10 | 9 | 9 | 9.2 |
| EvaluationDetails | 9 | 9 | 10 | 9 | 9 | 9.2 |
| PatientProfile | 9 | 9 | 9 | 9 | 8 | 8.8 |
| Result | 7 | 9 | 8 | 9 | 8 | 8.2 |
| GroupResult | 9 | 9 | 8 | 9 | 8 | 8.6 |
| Landing | 7 | 9 | 8 | 9 | 9 | 8.4 |
| Login | 10 | 9 | 9 | 9 | 9 | 9.2 |
| Register | 10 | 9 | 9 | 9 | 9 | 9.2 |
| SharedEvaluation | 9 | 9 | 8 | 9 | 8 | 8.6 |

**Grand Average: 8.86 / 10 (Profissional)**

## Findings

### P0 — Blockers (1 encontrado)

#### [P0-001] Hardcoded amber disclaimer colors in Result.tsx
**Pilar**: Visual Consistency
**Arquivo**: `apps/web/src/pages/Result.tsx:362-365`
**Problema**: `border-amber-200 bg-amber-50 text-amber-600 text-amber-800` with manual dark mode overrides — fragile, bypasses semantic token system
**Fix**:
```tsx
// Antes
border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30
text-amber-600 dark:text-amber-400
text-amber-800 dark:text-amber-200

// Depois
border-warning/20 bg-warning/5
text-warning
text-warning-foreground dark:text-warning
```
**Status**: Corrigido

### P1 — Must-Fix (9 encontrados)

#### [P1-001] `bg-white/20` hardcoded on primary module card
**Pilar**: Visual Consistency
**Arquivo**: `apps/web/src/pages/dashboard/PrincipalTab.tsx:300`
**Problema**: `bg-white/20` on icon container inside primary card — should use semantic token
**Fix**: `bg-white/20` → `bg-primary-foreground/20`
**Status**: Corrigido

#### [P1-002] `text-amber-500` on FileWarning icon
**Pilar**: Visual Consistency
**Arquivo**: `apps/web/src/pages/dashboard/PrincipalTab.tsx:123`
**Problema**: Hardcoded amber instead of semantic `text-warning`
**Fix**: `text-amber-500` → `text-warning`
**Status**: Corrigido

#### [P1-003] `rounded-lg` on InventoryResinCard
**Pilar**: Polish & Craft
**Arquivo**: `apps/web/src/pages/Inventory.tsx:34`
**Problema**: `rounded-lg` breaks the `rounded-xl` card convention
**Fix**: `rounded-lg` → `rounded-xl`
**Status**: Corrigido

#### [P1-004] `min-h-screen` error state inside app shell (Result)
**Pilar**: Spatial Design
**Arquivo**: `apps/web/src/pages/Result.tsx:35`
**Problema**: `min-h-screen` assumes full viewport ownership, causes double scrollbar inside AppLayout
**Fix**: `min-h-screen` → `py-20`
**Status**: Corrigido

#### [P1-005] `min-h-screen` error state inside app shell (GroupResult)
**Pilar**: Spatial Design
**Arquivo**: `apps/web/src/pages/GroupResult.tsx:21`
**Problema**: Same issue as P1-004
**Fix**: `min-h-screen` → `py-20`
**Status**: Corrigido

#### [P1-006] `bg-slate-100/800` hardcoded in ResinTypeLegend (Body type)
**Pilar**: Visual Consistency
**Arquivo**: `apps/web/src/components/ResinTypeLegend.tsx:9`
**Problema**: `bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300` — only neutral hardcoded color in entire component system
**Fix**: `bg-muted text-muted-foreground`
**Status**: Corrigido

#### [P1-007] `bg-slate-400` in ToothSelectionCard (low priority dot)
**Pilar**: Visual Consistency
**Arquivo**: `apps/web/src/components/wizard/review/ToothSelectionCard.tsx:129`
**Problema**: Hardcoded slate for low priority indicator dot
**Fix**: `bg-slate-400` → `bg-muted-foreground`
**Status**: Corrigido

#### [P1-008] GroupResult resin card missing hover feedback
**Pilar**: Interaction Quality
**Arquivo**: `apps/web/src/pages/GroupResult.tsx:111`
**Problema**: Resin card has `shadow-sm rounded-xl` but lacks `hover:shadow-md transition-shadow` that Result.tsx has
**Fix**: Added `hover:shadow-md transition-shadow duration-300`
**Status**: Corrigido

#### [P1-009] Button import from local ui instead of PageShell (EmptyState)
**Pilar**: Visual Consistency
**Arquivo**: `apps/web/src/components/EmptyState.tsx:4`
**Problema**: Imports Button from `@/components/ui/button` instead of `@parisgroup-ai/pageshell/primitives`
**Fix**: Not auto-fixed — requires verifying PageShell Button API compatibility
**Status**: Pendente (requires manual verification)

### P2 — Advisory (8 encontrados)

#### [P2-001] `gap-2` in Evaluations card metadata rows
**Arquivo**: `apps/web/src/pages/Evaluations.tsx:75,85,104,106`
**Sugestao**: `gap-2` → `gap-2 sm:gap-3` for better desktop breathing room
**Status**: Pendente (stylistic preference)

#### [P2-002] `gap-2` in Patients dialog footer buttons
**Arquivo**: `apps/web/src/pages/Patients.tsx:269`
**Sugestao**: `gap-2` → `gap-3`
**Status**: Pendente

#### [P2-003] `gap-2` in PatientProfile dialog footer buttons
**Arquivo**: `apps/web/src/pages/PatientProfile.tsx:238`
**Sugestao**: `gap-2` → `gap-3`
**Status**: Pendente

#### [P2-004] `rounded-lg` on resin property info boxes in Result
**Arquivo**: `apps/web/src/pages/Result.tsx:196-209`
**Sugestao**: `rounded-lg` → `rounded-xl` for card convention consistency
**Status**: Pendente (defensible as inner-card elements)

#### [P2-005] Hardcoded gradients for testimonial avatars in Landing
**Arquivo**: `apps/web/src/pages/Landing.tsx:206,215,224`
**Sugestao**: `from-violet-500/20`, `from-emerald-500/20`, `from-amber-500/20` — documented as intentional brand accents
**Status**: Pendente (intentional per code comment)

#### [P2-006] No entrance animation on SharedEvaluation
**Arquivo**: `apps/web/src/pages/SharedEvaluation.tsx`
**Sugestao**: Add `animate-[fade-in-up_0.6s_ease-out_both]` to content container
**Status**: Pendente

#### [P2-007] `title={" "}` hack in Dashboard DashboardPage
**Arquivo**: `apps/web/src/pages/Dashboard.tsx:216`
**Sugestao**: Consider adding `hideTitle` prop to DashboardPage composite
**Status**: Pendente (composite change needed)

#### [P2-008] `rounded-md` on CreditsBanner dismiss button
**Arquivo**: `apps/web/src/pages/dashboard/CreditsBanner.tsx:40`
**Sugestao**: Consider `rounded-lg` for consistency
**Status**: Pendente

## Resumo de Correcoes

| Severidade | Total | Corrigidos | Pendentes |
|------------|-------|------------|-----------|
| P0 | 1 | 1 | 0 |
| P1 | 9 | 8 | 1 |
| P2 | 8 | 0 | 8 |
| **Total** | **18** | **9** | **9** |

## Screenshots

Capturados via Playwright MCP:
- Landing page desktop (1440x900) — clean hero, good hierarchy, CTA prominent
- Login page desktop (1440x900) — professional split layout, clear form hierarchy
- Login page mobile (390x844) — responsive, stacked layout, adequate touch targets
- Protected pages not accessible (auth required)

### Visual Analysis (Screenshots)

**Landing (Desktop)**:
- Generous whitespace, hero text hierarchy is strong (`text-4xl` → `text-7xl` equivalent)
- CTA button "Testar Gratis em 2 Minutos" is prominent with `btn-glow` effect
- Right-side phone mockup provides visual interest
- Subtle grain texture overlay adds premium feel
- Navigation is minimal and clean

**Login (Desktop)**:
- Split layout with branding left, form right — classic SaaS pattern
- Google OAuth button prominent (above the fold)
- Clear visual hierarchy: title → subtitle → social auth → divider → form → CTA
- Cyan CTA button matches brand primary
- Staggered entrance animations give polished feel

**Login (Mobile)**:
- Responsive single-column layout
- Touch targets are adequate (full-width buttons)
- Form fields have good spacing
- "Esqueci minha senha" link accessible

## Recomendacoes Adicionais

1. **EmptyState Button import** (P1-009): Verify if `@parisgroup-ai/pageshell/primitives` exports a compatible Button, then migrate. Risk: API differences.

2. **Inner card element radius convention**: Codify `rounded-lg` for inner-card data cells (resin properties, small badges) vs `rounded-xl` for outer card shells. Currently ambiguous.

3. **Dialog footer button gap**: Standardize `gap-3` across all dialog footers for consistency.

4. **SharedEvaluation animations**: Add entrance animation to match the rest of the authenticated app experience.

5. **Testimonial avatar gradients**: Consider creating semantic CSS utilities for decorative brand gradients to avoid hardcoded Tailwind colors.

---

> **Cross-skill**: Some spacing and gap findings would benefit from a `layout-audit` for deeper structural analysis.
> Execute `layout audit` for layout-specific validation.

---

*Generated by design-critic skill on 2026-02-23*
*9 auto-fixes applied, 9 findings pending (stylistic/manual verification)*
