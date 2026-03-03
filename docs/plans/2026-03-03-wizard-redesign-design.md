---
title: Wizard Redesign — Design Document
created: 2026-03-03
updated: 2026-03-03
status: approved
tags: [type/design, status/approved]
---

# Wizard Redesign — Design Document

## Context

The AURIA wizard is the core case-creation flow (6 steps). Current state scores 6.5/10 — good animations and glass morphism, but missing screens, no validation feedback, confusing async states, and information overload on ReviewStep.

**Style direction**: Keep existing cyberpunk/neon/glass aesthetic. Elevate, don't replace.

## Approach: Polish + Restructure (A+B)

### What Changes

1. **Layout**: Single-column → sidebar stepper (desktop) + sticky header (mobile)
2. **Missing screens**: Add PreferencesStep and DSDStep prototypes
3. **Error states**: Add error recovery screens for AnalyzingStep
4. **ReviewStep**: Scroll-all → 4-tab layout (Dentes | Tratamento | Paciente | Resumo)
5. **ResultStep**: Add case summary card + explicit async status
6. **Transitions**: Add slide animations between steps
7. **Validation**: Disable forward nav when required fields missing
8. **Credits**: Persistent in sidebar (desktop) / header (mobile)

---

## 1. Layout Structure

### Desktop (>= 768px)

```
┌─────────────────────────────────────────────────┐
│  ┌─ Sidebar (240px) ──┐  ┌─ Content ──────────┐│
│  │ ① Foto         ✓   │  │                     ││
│  │ ② Preferências ✓   │  │  [Active step]      ││
│  │ ③ Análise IA   ●   │  │                     ││
│  │ ④ DSD              │  ├─────────────────────┤│
│  │ ⑤ Revisão          │  │ ◀ Voltar  Continuar ││
│  │ ⑥ Resultado        │  └─────────────────────┘│
│  │                     │                         │
│  │ ┌─────────────────┐│                         │
│  │ │ 12 créditos     ││                         │
│  │ │ Plano Pro       ││                         │
│  │ └─────────────────┘│                         │
│  └─────────────────────┘                         │
└─────────────────────────────────────────────────┘
```

- Sidebar: vertical stepper, always visible, completed steps clickable
- Credits + plan indicator fixed at sidebar bottom
- Content area: max-width ~640px, centered within remaining space

### Mobile (< 768px)

```
┌──────────────────────────┐
│ Step 3 de 6 · Análise IA │  ← sticky header
│ ●●●○○○                   │
├──────────────────────────┤
│ [Active step content]     │
├──────────────────────────┤
│ ◀ Voltar    Continuar ▶  │  ← sticky footer
└──────────────────────────┘
```

- Compact header: step name + "X de Y" + progress dots
- Sticky footer: back/next buttons

### Step Transitions

- Forward: `translateX(30px)` → `0` (300ms ease-out) + `opacity 0→1` (200ms)
- Backward: `translateX(-30px)` → `0` (300ms ease-out) + `opacity 0→1` (200ms)

---

## 2. PhotoStep

**No changes to layout.** Minor improvements:

- Quality score shows number: "Qualidade boa (82/100)"
- Quality < 50: shows specific tip ("Tente com mais iluminação")
- Credit cost inside buttons: "Análise Completa — 2 créditos"
- Upload progress bar (% of file upload)
- Drag-over animation: scale(1.02) + border glow

---

## 3. PreferencesStep (NEW)

Two-card selection for whitening level:

- 2-column grid (1-column mobile)
- Each card: icon + label + color swatch bar (amber for natural, white for hollywood) + shade example + description + credit cost
- Selected card: ai-shimmer-border + checkmark
- Info callout at bottom: "O nível afeta as cores sugeridas nos protocolos"

---

## 4. AnalyzingStep

**Improvements:**

- ETA visible: "~20s restantes" next to progress ring
- Sub-steps as **vertical checklist** (not inline dots):
  - ✅ Preparando imagem
  - ✅ Detectando arcada
  - ● Identificando dentes (active, with spinner)
  - ○ Analisando condições
  - ○ Avaliando proporções
  - ○ Gerando diagnóstico
- Cancel → confirmation modal: "Tem certeza? A análise será perdida"

### Error State (NEW)

- Warning icon + error title + user-friendly message
- Mini photo preview (48x48)
- Contextual tip ("Tente com mais iluminação")
- 3 recovery buttons: "Tentar Novamente" | "Trocar Foto" | "Revisão Manual"

---

## 5. DSDStep (NEW)

- Before/after comparison slider
- Tab bar for DSD layers: Gengival | Whitening | Diastema | Restorative
- Gengivoplasty approval card (when AI suggests): "Incluir" / "Descartar"
- Per-layer regenerate button
- Per-layer loading state (doesn't block other layers)

---

## 6. ReviewStep (RESTRUCTURED)

**From scroll-all to 4 tabs:**

### Tab: Dentes
- Batch selection: "Todos" | "Obrigatórios ⓘ" | "Limpar"
- Tooltip on "Obrigatórios": "Dentes com alta prioridade detectados pela IA"
- 2-column tooth card grid
- Cards: tooth number, priority badge, left-border color by treatment type, findings (expandable), checkbox
- Click card → expand: full findings + treatment dropdown + "Restaurar sugestão IA" wand

### Tab: Tratamento
- Grouped by treatment type (all resinas together, gengivoplastias together)
- Per-group summary: count + tooth numbers

### Tab: Paciente
- Patient name (autocomplete)
- Date of birth
- Clinical notes (speech-to-text support)

### Tab: Resumo
- Case summary card: patient, age, tooth count, complexity, budget toggle, AI confidence
- Budget toggle (Padrão/Premium) — moved here from mid-page

**Always visible (above tabs):**
- Confidence banner: "Confiança Alta/Média/Baixa na análise da IA"

---

## 7. ResultStep

**Improvements:**

- Case summary card: patient name, tooth count + types, budget tier
- Explicit async status:
  - "✅ Protocolos prontos" (green)
  - "⏳ Gerando protocolos (~2min)" (spinner + progress)
  - "Você pode ver o caso enquanto os protocolos são gerados"
- Buttons: "Ver Caso" (primary) + "Novo Caso" (secondary, replaces generic "Voltar")

---

## 8. Cross-Cutting Improvements

### Validation
- "Continuar" disabled when required fields missing
- Tooltip on disabled button: "Selecione uma foto para continuar"

### Credits
- Always visible: sidebar bottom (desktop) / in step header (mobile)
- Real-time update after each credit-consuming action

### Transitions
- Forward/backward slide animations between steps
- Staggered card entrance (50ms intervals) on ReviewStep tooth grid

### Error Handling
- Each AI-calling step (Analysis, DSD) has explicit error state
- 3-option recovery: retry, go back, skip to manual

---

## Files to Create/Modify

### New screen designs (design-src/)
- `design-src/sections/wizard/WizardShell.tsx` — new sidebar layout wrapper
- `design-src/sections/wizard/PreferencesStep.tsx` — NEW
- `design-src/sections/wizard/DSDStep.tsx` — NEW
- `design-src/sections/wizard/AnalyzingErrorState.tsx` — NEW

### Modified screen designs
- `StepIndicator.tsx` → becomes `WizardSidebar.tsx` (vertical stepper)
- `ReviewStep.tsx` → tabbed layout
- `ResultStep.tsx` → add summary card + async status
- `PhotoStep.tsx` → minor improvements (quality number, credit in button)
- `AnalyzingStep.tsx` → vertical checklist + ETA
- `WizardPreview.tsx` → use new shell layout

### CSS
- `preview-theme.css` → add tab styles, sidebar styles, transition keyframes

---

*Approved: 2026-03-03*
