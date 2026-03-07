---
composite: PrivacySection
---

# Privacy Policy Page Specification

## Overview
Static legal page displaying the Privacy Policy ("Política de Privacidade") for ToSmile.ai. Public page (no auth required). Uses a branded header with back navigation and a single-column prose layout with 14 numbered legal sections, some with sub-sections and labeled lists.

## Views

### Header
1. **Brand** — "ToSmile.ai" logo text with gradient, links to home.
2. **Back button** — Ghost "Voltar" button with arrow icon, links to home.

### Content
1. **Page title** — "Política de Privacidade" as h1.
2. **Last updated** — "Última atualização: 05/03/2026" muted text.
3. **Section 1: Introdução** — Paragraph referencing LGPD compliance.
4. **Section 2: Dados Coletados** — Intro + 5 labeled items (cadastro, clinicos, fotografias, uso, tecnicos).
5. **Section 3: Base Legal para Tratamento** — Intro + 3 labeled items (consentimento, contrato, legitimo interesse).
6. **Section 4: Processamento de Dados pela IA** — Intro + 4 sub-sections:
   - 4.1 Ciclo de Vida das Imagens na IA — 4-item list.
   - 4.2 Provedores de IA e Subprocessadores — Text + 2 labeled items + closing.
   - 4.3 Anonimização e Minimização — 3-item list.
   - 4.4 Não Treinamento — Single paragraph guarantee.
7. **Section 5: Finalidade do Uso dos Dados** — Intro + 7-item list.
8. **Section 6: Armazenamento e Segurança** — Intro + 7-item list of security measures.
9. **Section 7: Compartilhamento de Dados** — Intro + 5-item list of sharing conditions.
10. **Section 8: Seus Direitos (LGPD)** — Intro + 7 labeled rights + contact paragraph with email.
11. **Section 9: Cookies** — Single paragraph.
12. **Section 10: Retenção de Dados** — Single paragraph with retention timeline.
13. **Section 11: Responsabilidade do Profissional** — Paragraph on dentist controller obligations.
14. **Section 12: Menores de Idade** — Paragraph on minors under LGPD Art. 14.
15. **Section 13: Alterações nesta Política** — Paragraph on policy updates.
16. **Section 14: Contato e Encarregado de Dados** — Paragraph + 2 email links (privacidade@tosmile.ai, dpo@tosmile.ai).

## UI Requirements
- Glass container (`glass-panel`) for main content area
- Ambient background: `section-glow-bg` with subtle glow orb
- Section headings: `text-xl font-semibold font-display`
- Sub-section headings: `text-lg font-semibold font-display`
- Body text: `text-muted-foreground`
- Labeled list items: bold label + normal text
- Bullet lists: `list-disc list-inside` with spacing
- Email links: `text-primary hover:underline`
- All interactive: `focus-visible:ring-2`, `transition-colors`
- Max width: `max-w-4xl` centered
- Responsive padding: `px-4 sm:px-6`

## Configuration
- shell: false
