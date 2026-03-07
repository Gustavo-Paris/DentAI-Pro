---
composite: NotFoundSection
---

# Not Found (404) Page Specification

## Overview
Minimal centered 404 error page shown when a user navigates to a non-existent route. Public page (no auth required). Features a branded header and a vertically centered error message with a CTA to return home.

## Views

### Header
1. **Brand** — "ToSmile.ai" logo text with gradient, links to home.

### Error Content
1. **Icon** — Large `SearchX` icon, muted, centered.
2. **Error code** — "404" in large display text, muted.
3. **Heading** — "Página não encontrada" as h1.
4. **Description** — "O endereço que você tentou acessar não existe ou foi removido." muted text.
5. **CTA button** — "Voltar ao início" primary button with `ArrowLeft` icon, links to home. Uses `btn-glow` styling.

## UI Requirements
- Full viewport height: `min-h-screen` with flex column layout
- Ambient background: `section-glow-bg` with centered glow orb behind error content
- Header: top border-b with brand logo
- Content: vertically and horizontally centered, `max-w-sm`
- Icon: `w-16 h-16`, `text-muted-foreground/30`
- Error code: `text-6xl font-semibold font-display text-muted-foreground/50`
- CTA button: primary variant with `btn-glow` effect
- All interactive: `focus-visible:ring-2`, `transition-colors`

## Configuration
- shell: false
