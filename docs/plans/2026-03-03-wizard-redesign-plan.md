# Wizard Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the wizard Design OS prototypes with sidebar layout, missing screens, tabbed ReviewStep, and cross-cutting UX improvements.

**Architecture:** Screen design components in `design-src/sections/wizard/` render standalone in Design OS dev server (Tailwind v4, no production dependencies). Each component imports `preview-theme.css` for tokens. No unit tests — verification is visual via `pnpm exec designos dev`.

**Tech Stack:** React 18, TypeScript, Tailwind v4 utilities, CSS custom properties, lucide-react icons

---

## Task 1: Update CSS Foundation

**Files:**
- Modify: `apps/web/design-src/preview-theme.css`

**Step 1: Add new CSS utilities**

Append these new styles before the `/* Reduced Motion */` section in `preview-theme.css`:

```css
/* ═══ Wizard Sidebar ═══ */
.wizard-sidebar {
  width: 240px;
  min-height: 100vh;
  padding: 1.5rem 1rem;
  border-right: 1px solid rgb(var(--color-border-rgb) / 0.5);
  background: rgb(var(--color-card-rgb) / 0.3);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: flex;
  flex-direction: column;
}
.dark .wizard-sidebar {
  border-right-color: rgb(var(--color-primary-rgb) / 0.1);
  background: rgb(var(--color-card-rgb) / 0.2);
}

/* ═══ Wizard Layout ═══ */
.wizard-layout {
  display: flex;
  min-height: 100vh;
}
@media (max-width: 767px) {
  .wizard-layout { flex-direction: column; }
  .wizard-sidebar { display: none; }
}

/* ═══ Tabs ═══ */
.wizard-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid rgb(var(--color-border-rgb) / 0.5);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.wizard-tab {
  padding: 0.625rem 1rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-muted-foreground);
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: color var(--duration-normal) var(--ease-default),
              border-color var(--duration-normal) var(--ease-default);
  cursor: pointer;
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;
}
.wizard-tab:hover { color: var(--color-foreground); }
.wizard-tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

/* ═══ Shimmer Border ═══ */
@keyframes shimmer-border {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
.ai-shimmer-border {
  position: relative;
  border-color: transparent;
}
.ai-shimmer-border::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-primary), var(--brand-accent), var(--color-primary));
  background-size: 200% auto;
  animation: shimmer-border 3s linear infinite;
  z-index: -1;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  -webkit-mask-composite: xor;
  padding: 1px;
}

/* ═══ Step Backward Transition ═══ */
.wizard-step-backward { animation: slide-in-left 0.3s ease-out; }
@keyframes slide-in-left {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}

/* ═══ Vertical Stepper ═══ */
.stepper-connector-v {
  width: 2px;
  height: 24px;
  margin-left: 17px;
  background: rgb(var(--color-primary-rgb) / 0.18);
  border-radius: 1px;
  transition: background var(--animation-duration-slower) var(--ease-default);
}
.stepper-connector-v.completed { background: var(--color-primary); }

/* ═══ Mobile Wizard Header ═══ */
.wizard-mobile-header {
  position: sticky;
  top: 0;
  z-index: 40;
  padding: 0.75rem 1rem;
  background: rgb(var(--color-background-rgb) / 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgb(var(--color-border-rgb) / 0.5);
}
```

**Step 2: Update reduced motion rule**

Add new animation classes to the reduced motion query: `.ai-shimmer-border::before`.

**Step 3: Commit**

```bash
git add apps/web/design-src/preview-theme.css
git commit -m "style: add sidebar, tabs, shimmer, and transition CSS for wizard redesign"
```

---

## Task 2: Create WizardSidebar Component

**Files:**
- Create: `apps/web/design-src/sections/wizard/WizardSidebar.tsx`

**Step 1: Create the vertical stepper sidebar**

The sidebar replaces the horizontal `StepIndicator` for desktop. It shows all steps vertically with connectors, and a credit indicator at the bottom. Uses lucide-react icons dynamically mapped from step `icon` string.

Key specs:
- Completed steps: primary bg circle + Check icon, clickable
- Active step: primary bg circle + ring-2 glow + step icon
- Future steps: muted bg circle + step icon, not clickable
- Vertical connectors between steps (`.stepper-connector-v`)
- Credit card at bottom: glass-panel with credit count + plan name
- Props: `steps`, `currentStep`, `onGoToStep`, `creditsRemaining`, `planName`
- All props optional with defaults from `data.json`

**Step 2: Commit**

```bash
git add apps/web/design-src/sections/wizard/WizardSidebar.tsx
git commit -m "feat(design): add WizardSidebar vertical stepper component"
```

---

## Task 3: Create WizardShell Layout

**Files:**
- Create: `apps/web/design-src/sections/wizard/WizardShell.tsx`

**Step 1: Create the layout wrapper**

Orchestrates the sidebar (desktop) + mobile header + content area + footer nav. Handles step direction tracking for transitions.

Key specs:
- Desktop (md+): `wizard-layout` flex with `wizard-sidebar` on left, content area centered (max-w-2xl) on right
- Mobile (<md): `wizard-mobile-header` (sticky, shows "Step X de Y" + progress dots) + content + `wizard-nav-sticky` footer
- Ambient background: glow orbs + ai-grid-pattern (same as current WizardPreview)
- Content wrapper applies `wizard-step-forward` or `wizard-step-backward` based on direction
- Footer: "Voltar" (disabled on step 1) + "Continuar"/"Criar Caso" (step 5) / hidden (step 6)
- Props: `children` (active step content), `steps`, `currentStep`, `onGoToStep`, `onNext`, `onBack`, `nextLabel`, `nextDisabled`, `creditsRemaining`

**Step 2: Commit**

```bash
git add apps/web/design-src/sections/wizard/WizardShell.tsx
git commit -m "feat(design): add WizardShell layout with sidebar + mobile header"
```

---

## Task 4: Update PhotoStep (Minor Polish)

**Files:**
- Modify: `apps/web/design-src/sections/wizard/PhotoStep.tsx`

**Step 1: Apply improvements**

Changes from current:
1. Quality score shows number: `"Qualidade boa (82/100)"` instead of just `"Qualidade boa"`
2. Credit cost moved inside buttons: `"✨ Análise Completa — 2 créditos"` and `"⚡ Caso Rápido — 1 crédito"`
3. Remove separate credit text below buttons
4. "Sem DSD e preferências" as small text directly under Caso Rápido button text
5. Quality < 50: show tip `"Tente com mais iluminação e dentes visíveis"`

**Step 2: Commit**

```bash
git add apps/web/design-src/sections/wizard/PhotoStep.tsx
git commit -m "feat(design): polish PhotoStep — inline credits, quality score number"
```

---

## Task 5: Create PreferencesStep (NEW)

**Files:**
- Create: `apps/web/design-src/sections/wizard/PreferencesStep.tsx`

**Step 1: Build the whitening level selection screen**

Key specs:
- Header: Sparkles icon + "Preferências" title + subtitle
- 2-column grid (1-col mobile) with two selectable cards
- Natural card: Sun icon, amber color swatch bar (from-amber-200 to-amber-100), "Tons B1/A1", "0 créditos extra"
- Hollywood card: Star icon, white-to-primary gradient swatch, "Tons BL1-BL3", "+1 crédito extra"
- Selected card: `ai-shimmer-border` class + checkmark badge top-right
- Unselected: `border-border bg-card`, hover: `border-primary/50 bg-primary/5`
- Info callout at bottom: `"O nível de clareamento afeta as cores sugeridas nos protocolos de resina"`
- Props: `whiteningLevel`, `onSetWhiteningLevel` — optional with internal state for standalone
- Import sample data from `data.json` for `whiteningLevels` array

**Step 2: Commit**

```bash
git add apps/web/design-src/sections/wizard/PreferencesStep.tsx
git commit -m "feat(design): add PreferencesStep whitening level selection"
```

---

## Task 6: Rewrite AnalyzingStep (Vertical Checklist + Error)

**Files:**
- Modify: `apps/web/design-src/sections/wizard/AnalyzingStep.tsx`

**Step 1: Rewrite with vertical checklist and ETA**

Changes from current:
1. Sub-steps become vertical checklist (not inline dots):
   - Completed: `✅` + step text (text-primary/60)
   - Active: spinner dot (ai-dot) + step text (text-foreground font-medium) + "~Xs restantes"
   - Future: `○` muted circle + step text (text-muted-foreground/40)
2. ETA shown next to active sub-step: `"~20s restantes"`
3. Keep: scan-line photo, progress ring, "Powered by AI"
4. Cancel button: still at bottom but with `"Cancelar análise"` label

**Step 2: Add error state variant**

Add `error` prop. When `error` is truthy, render error state:
- AlertTriangle icon in warning/10 bg circle
- "Erro na Análise" title
- User-friendly message
- Mini photo preview (48x48, rounded, opacity-75)
- Tip card with lightbulb icon
- 3 buttons: "Tentar Novamente" (primary), "Trocar Foto" (outline), "Revisão Manual" (ghost)
- Props: add `error?: string | null`, `onRetry`, `onChangePhoto`, `onManualReview`

**Step 3: Commit**

```bash
git add apps/web/design-src/sections/wizard/AnalyzingStep.tsx
git commit -m "feat(design): rewrite AnalyzingStep — vertical checklist, ETA, error state"
```

---

## Task 7: Create DSDStep (NEW)

**Files:**
- Create: `apps/web/design-src/sections/wizard/DSDStep.tsx`

**Step 1: Build the DSD simulation screen**

Key specs:
- Header: Palette icon + "Digital Smile Design" title + "Simulação estética do resultado"
- Before/after comparison: two images side-by-side with a vertical divider slider in the middle
  - Use sample SVG placeholders (same pattern as AnalyzingStep SAMPLE_IMAGE but labeled "Before"/"After")
  - Slider is a draggable divider (CSS clip-path or overflow approach — for prototype just show static 50/50)
- Layer tabs: horizontal tab bar with 4 tabs: Gengival | Whitening | Diastema | Restaurativa
  - Active tab: `wizard-tab active`
  - Each tab shows layer status: "✅" if generated, "⏳" if generating, empty if pending
- Active layer content area:
  - Generated: shows layer description text + "🔄 Regenerar Camada" button
  - Generating: spinner + "Gerando camada..."
  - Pending: "Aguardando camadas anteriores"
- Gengivoplasty approval card (conditional): glass-panel with description + "Incluir" / "Descartar" buttons
- Props: `activeLayer`, `onChangeLayer`, `gingivoplastyApproved`, `onApproveGingivo`, `onRejectGingivo` — all optional with internal state

**Step 2: Commit**

```bash
git add apps/web/design-src/sections/wizard/DSDStep.tsx
git commit -m "feat(design): add DSDStep simulation screen with layer tabs"
```

---

## Task 8: Rewrite ReviewStep (Tabbed Layout)

**Files:**
- Modify: `apps/web/design-src/sections/wizard/ReviewStep.tsx`

**Step 1: Restructure into 4 tabs**

Major rewrite. New layout:
- Header (always visible): ClipboardCheck icon + "Revisão" title
- Confidence banner (always visible, above tabs): same gradient card but now permanently above tabs
- Tab bar: `wizard-tabs` with 4 tabs: Dentes | Tratamento | Paciente | Resumo
- Internal state: `activeTab` (default "dentes")

**Tab: Dentes**
- Batch buttons: "Todos" | "Obrigatórios" (with tooltip text on hover via `title` attr: "Dentes com alta prioridade detectados pela IA") | "Limpar"
- 2-column tooth card grid (same ToothCard sub-component, keep existing)
- No changes to card internals

**Tab: Tratamento**
- Group teeth by treatment_type
- Per group: treatment name header + colored left border + list of tooth numbers
- Example: "Resina (4 dentes): 11, 21, 12, 22" | "Gengivoplastia (1 dente): 14"

**Tab: Paciente**
- Patient name input (text, prefilled with sample data)
- Date of birth input (text, prefilled)
- Clinical notes textarea (3 rows, placeholder "Notas clínicas opcionais...")

**Tab: Resumo**
- CaseSummary card (reuse existing CaseSummary sub-component)
- Budget toggle (Padrão/Premium) — moved here from main flow
- This is the last thing user sees before "Criar Caso"

**Step 2: Commit**

```bash
git add apps/web/design-src/sections/wizard/ReviewStep.tsx
git commit -m "feat(design): rewrite ReviewStep with 4-tab layout"
```

---

## Task 9: Update ResultStep (Summary + Async Status)

**Files:**
- Modify: `apps/web/design-src/sections/wizard/ResultStep.tsx`

**Step 1: Add case summary and async status**

Changes from current:
1. Add case summary card between title and buttons:
   - Glass-panel card with 4 items: "Paciente: Maria Clara Oliveira, 33 anos" | "Dentes: 11, 21, 12 (3 resinas) + 14 (gengivoplastia)" | "Orçamento: Padrão" | Status indicator
2. Async status indicator:
   - `protocolsReady` prop (default true for prototype)
   - Ready: `"✅ Protocolos prontos"` in success color
   - Generating: `"⏳ Gerando protocolos (~2min)"` with small spinner + "Você pode ver o caso enquanto os protocolos são gerados" text
3. Button labels:
   - Primary: "Ver Caso" with Eye icon (keep FileText → Eye)
   - Secondary: "Novo Caso" with Plus icon (replaces "Voltar" with ArrowLeft)
4. Props: add `protocolsReady?: boolean`, `patientName?: string`, `toothSummary?: string`, `budget?: string`

**Step 2: Commit**

```bash
git add apps/web/design-src/sections/wizard/ResultStep.tsx
git commit -m "feat(design): add case summary and async status to ResultStep"
```

---

## Task 10: Rewrite WizardPreview (Use New Shell)

**Files:**
- Modify: `apps/web/design-src/sections/wizard/WizardPreview.tsx`

**Step 1: Rewrite to use WizardShell**

Replace the current manual layout with `WizardShell` wrapper. Key changes:
- Import and use `WizardShell` as outer wrapper
- Import new `PreferencesStep` and `DSDStep`
- Remove manual ambient background (WizardShell handles it)
- Remove manual stepper (WizardShell handles it via WizardSidebar)
- Remove manual footer nav (WizardShell handles it)
- Remove debug step-nav buttons at top (sidebar replaces them)
- Track `stepDirection` state: set to `'forward'` on next, `'backward'` on back
- Add step content for ALL 6 steps (no more placeholder divs for steps 2 and 4)
- Pass `nextDisabled` based on step: step 1 disabled if no photo, step 2 disabled if no whitening level
- Pass `nextLabel`: default "Continuar", step 5 "Criar Caso"
- Keep all existing state management (useState for step, photo, teeth, budget, etc.)
- Add new state: `whiteningLevel`, `stepDirection`, `dsdLayer`

**Step 2: Commit**

```bash
git add apps/web/design-src/sections/wizard/WizardPreview.tsx
git commit -m "feat(design): rewrite WizardPreview with WizardShell layout"
```

---

## Task 11: Update Barrel Exports

**Files:**
- Modify: `apps/web/design-src/sections/wizard/index.ts`

**Step 1: Add new exports**

Add exports for new components:
```ts
export { default as WizardSidebar } from './WizardSidebar'
export { default as WizardShell } from './WizardShell'
export { default as PreferencesStep } from './PreferencesStep'
export { default as DSDStep } from './DSDStep'
```

Remove old StepIndicator export (replaced by WizardSidebar).

**Step 2: Commit**

```bash
git add apps/web/design-src/sections/wizard/index.ts
git commit -m "feat(design): update barrel exports for wizard redesign"
```

---

## Task 12: Delete Old StepIndicator

**Files:**
- Delete: `apps/web/design-src/sections/wizard/StepIndicator.tsx`

**Step 1: Remove the file**

StepIndicator is fully replaced by WizardSidebar (desktop) and mobile header in WizardShell. Delete the file.

**Step 2: Commit**

```bash
git rm apps/web/design-src/sections/wizard/StepIndicator.tsx
git commit -m "chore(design): remove old StepIndicator (replaced by WizardSidebar)"
```

---

## Task 13: Visual Verification

**Step 1: Start Design OS dev server**

```bash
cd apps/web && pnpm exec designos dev
```

**Step 2: Verify each screen design**

Open each screen in the Design OS sections page and verify:
- [ ] WizardSidebar: vertical steps render, completed/active/future states, credit card
- [ ] WizardShell: sidebar visible on desktop, mobile header on narrow viewport
- [ ] PhotoStep: quality number shown, credits in buttons
- [ ] PreferencesStep: two cards, shimmer on selected, color swatches
- [ ] AnalyzingStep: vertical checklist, ETA text, error state variant
- [ ] DSDStep: before/after images, layer tabs, gingivo approval card
- [ ] ReviewStep: 4 tabs work, tooth cards in Dentes tab, summary in Resumo tab
- [ ] ResultStep: case summary card, async status indicator
- [ ] WizardPreview: full flow navigable, sidebar stepper, transitions

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(design): wizard redesign complete — sidebar layout, missing screens, tabbed review"
```

---

## Execution Notes

- **No tests**: These are Design OS prototypes, not production code. Verification is visual.
- **Import pattern**: Every component must `import '../../preview-theme.css'` as first import.
- **Default props**: Every component must work standalone (no props) with sensible defaults from `data.json`.
- **Icons**: Use lucide-react. Available: Camera, Heart, Brain, Smile, ClipboardCheck, FileText, Check, X, Sparkles, Sun, Star, Zap, Upload, Lightbulb, AlertTriangle, Eye, Plus, Palette, ChevronDown, Wand2, Shield, RefreshCw, ArrowLeft, Loader2.
- **Types**: Import from `../../../design/sections/wizard/types` — all types already defined.
- **Sample data**: Import from `../../../design/sections/wizard/data.json`.
