---
composite: LandingSection
---

# Landing Page Specification

## Overview
Marketing landing page with 10 sections: navigation, hero, stats, features, how-it-works, testimonials, FAQ, pricing, CTA, and footer.

## Sections

### Navigation
1. **Brand** — "ToSmile.ai" logo text.
2. **Actions** — "Entrar" ghost button + "Comecar" primary CTA.

### Hero
1. **Badge** — "Inteligencia Clinica Estetica" with sparkle icon.
2. **Headline** — "Odontologia estetica inteligente com IA".
3. **Subtitle** — Value proposition text.
4. **CTA** — "Testar Gratis em 2 Minutos" primary button.
5. **Social proof** — "Sem cartao de credito. 3 creditos gratis."

### Stats
1. **4 stat cards** — Value + label in 4-col grid.

### Features
1. **4 feature cards** — Icon + title + description in 4-col grid.

### How It Works
1. **4 steps** — Numbered timeline with title + description.

### Testimonials
1. **4 testimonial cards** — Quote + author info + star rating in 2-col grid.

### FAQ
1. **5 accordion items** — Question + answer.

### Pricing
1. **4 plan cards** — Name + price + credits + features in 4-col grid. Pro is popular.

### CTA
1. **Final CTA** — Headline + benefits + primary button.

### Footer
1. **Copyright** — Brand + year.
2. **Links** — Terms + Privacy.

## UI Requirements
- Glass containers for cards and sections
- Ambient background: `section-glow-bg` with glow orbs
- Gradient accents on hero and CTA sections
- `ai-shimmer-border` on popular pricing card
- Star ratings with filled primary color
- All interactive: `focus-visible:ring-2`, `transition-colors`

## Configuration
- shell: false
