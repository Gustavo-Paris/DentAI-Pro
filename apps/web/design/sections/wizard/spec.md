---
composite: WizardPage
---

# New Case Wizard Specification

## Overview
Multi-step clinical case creation wizard that guides dentists through photo upload, AI analysis, Digital Smile Design simulation, and protocol generation. Supports two flows: Full (6 steps with DSD and preferences) and Quick Case (4 steps, skipping DSD and preferences). Uses `PageShellWizard` composite with custom step indicator and sticky mobile navigation.

## User Flows

### Full Flow (6 steps)
1. **Foto** — Upload intraoral photo (drag-and-drop, camera capture on mobile), optional 45° smile and face photos. Background quality check runs immediately. Choose "Full Analysis" or "Quick Case".
2. **Preferências** — Select whitening level (natural/hollywood) via radio cards with shade preview badges. Shows credit cost disclosure.
3. **Análise** — AI processes photo automatically. Scan-line animation over photo, asymptotic progress ring (95% ceiling), 6 timed sub-steps. Cancel button with AbortController. Error state: retry / skip to manual.
4. **DSD** — Digital Smile Design simulation. Quality gate (score < 55 blocks generation). Before/after layer comparison slider. Gengivoplasty approval flow. Whitening comparison tool. Proportions analysis overlay.
5. **Revisão** — Review detected teeth with treatment assignments. Tooth selection cards with priority badges and treatment dropdowns. Patient data form (name autocomplete, DOB). Budget toggle (padrão/premium). Clinical notes with speech-to-text. Case summary card with complexity badge.
6. **Resultado** — Submission with real-time step progress overlay. Success celebration with glow orbs and pulse ring. Navigate to case detail or back.

### Quick Case Flow (4 steps)
Steps 1 → 3 → 5 → 6 (skips preferences and DSD). Analysis starts immediately after photo upload.

### Cross-cutting
- **Draft auto-save**: Debounced localStorage persistence on state change, visibility change, and beforeunload. Restore modal on next visit.
- **Credit gate**: Confirmation dialog before analysis with credit cost breakdown.
- **AI disclaimer**: One-time acceptance modal gates the entire wizard.

## UI Requirements
- Glass container wrapping all step content (`.wizard-stage`: frosted glass, primary border accent)
- Ambient background: section glow gradients + floating glow orbs + AI dot grid
- Custom step indicator: desktop = horizontal stepper with glow connectors; mobile = icon + progress dots
- Step transitions: slide-in-left/right based on navigation direction
- AI processing indicators: scan-line animation, shimmer borders, pulsing dots, gradient text
- Mobile: sticky bottom navigation with blur backdrop, reversed button order (primary on top)
- Processing overlay: full-screen frosted glass portal with progress ring and step checklist
- Celebration: success pulse ring, scale-in animation, confetti-like glow orbs
- All primary actions use `.btn-glow .btn-press` pattern
- `prefers-reduced-motion` fully supported (all animations disabled)

## Configuration
- shell: true
