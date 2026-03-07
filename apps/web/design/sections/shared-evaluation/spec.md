---
composite: SharedEvaluationSection
---

# Shared Evaluation Specification

## Overview
Public-facing page (no authentication required) that displays a shared clinical evaluation session via a time-limited token URL. Shows brand header, summary card, DSD simulation with layer switcher and before/after comparison, patient document, individual tooth evaluation cards, clinic attribution footer, and expired/not-found error states.

## Views

### Shared Evaluation (Data State)
1. **Brand Header Bar** -- Brand name with gradient text, "Visualização compartilhada" badge with clock icon, border-bottom separator.
2. **Summary Card** -- Session title "Avaliação Odontológica", date with calendar icon, teeth evaluated count, completed count. Glass card with fade-in-up animation.
3. **DSD Simulation Card** -- Layer selector buttons (active=default variant, inactive=outline), before/after comparison slider, proportions analysis card. Conditional: only renders when DSD data exists. Image error fallback message.
4. **Patient Document Section** -- Consolidated patient document card when available. Conditional rendering.
5. **Tooth Evaluation Cards** -- Vertical stack of individual tooth cards showing tooth number, treatment type badge with icon, treatment label, status badge (completed/planned), AI treatment indication text. Staggered fade-in-up animation.
6. **Footer Attribution** -- Clinic name (when available), "Gerado por ToSmile.ai" attribution text, centered muted style.

### Expired State
7. **Expired/Not Found Screen** -- Warning triangle icon, title ("Link Expirado" or "Link Não Encontrado"), description text, CTA button to homepage. Centered vertically on screen.

### Loading State
8. **Loading Skeleton** -- Pulsing placeholder blocks mimicking header, summary card, and content area.

## UI Requirements
- Glass containers (`.glass-panel`) for all cards
- Ambient background: `section-glow-bg` with glow orbs
- Staggered `animate-[fade-in-up]` animations with increasing delays (0s, 0.1s, 0.2s)
- Treatment type badges with semantic colors matching treatment-config
- Status badges: completed=success, planned=muted
- DSD layer buttons: `transition-all duration-150`, `aria-pressed` attribute
- Comparison slider for before/after DSD images
- Image error fallback with graceful degradation message
- Brand name uses `text-gradient-brand font-display tracking-[0.2em]`
- Badge uses clock SVG icon with `text-muted-foreground`
- All interactive elements: `focus-visible:ring-2`, `transition-colors`
- `prefers-reduced-motion` fully supported
- Print styles: `print:hidden` on interactive slider, `print:block` on static image fallback
- Responsive: container with `max-w-2xl`, cards with `rounded-xl`
- PUBLIC page -- no auth, no sidebar, no navigation shell

## Configuration
- shell: false
- auth: false
- maxWidth: max-w-2xl
