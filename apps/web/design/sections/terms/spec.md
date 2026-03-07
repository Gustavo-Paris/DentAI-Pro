---
composite: TermsSection
---

# Terms of Use Page Specification

## Overview
Static legal page displaying the Terms of Use ("Termos de Uso") for ToSmile.ai. Public page (no auth required). Uses a branded header with back navigation and a single-column prose layout with 12 numbered legal sections.

## Views

### Header
1. **Brand** — "ToSmile.ai" logo text with gradient, links to home.
2. **Back button** — Ghost "Voltar" button with arrow icon, links to home.

### Content
1. **Page title** — "Termos de Uso" as h1.
2. **Last updated** — "Última atualização: 05/03/2026" muted text.
3. **Section 1: Aceitação dos Termos** — Paragraph explaining acceptance by usage.
4. **Section 2: Descrição do Serviço** — Paragraph + 4-item bullet list describing service scope + closing disclaimer.
5. **Section 3: Natureza das Sugestões da IA** — Important warning callout + paragraph + 8-item bullet list of clinical factors + closing paragraph.
6. **Section 4: Limitação de Responsabilidade** — Paragraph + 5-item bullet list of exclusions + closing paragraph.
7. **Section 5: Uso Adequado** — Intro + 8-item bullet list of user obligations.
8. **Section 6: Processamento de Imagens e Dados Clínicos** — Paragraph + 6-item bullet list on AI data handling.
9. **Section 7: Propriedade Intelectual** — Single paragraph.
10. **Section 8: Conta do Usuário** — Single paragraph.
11. **Section 9: Modificações do Serviço** — Single paragraph.
12. **Section 10: Rescisão** — Single paragraph.
13. **Section 11: Lei Aplicável** — Single paragraph referencing Brazilian law.
14. **Section 12: Contato** — Paragraph + email link (contato@tosmile.ai).

## UI Requirements
- Glass container (`glass-panel`) for main content area
- Ambient background: `section-glow-bg` with subtle glow orb
- Section headings: `text-xl font-semibold font-display`
- Body text: `text-muted-foreground`
- Bullet lists: `list-disc list-inside` with spacing
- Email links: `text-primary hover:underline`
- All interactive: `focus-visible:ring-2`, `transition-colors`
- Max width: `max-w-4xl` centered
- Responsive padding: `px-4 sm:px-6`

## Configuration
- shell: false
