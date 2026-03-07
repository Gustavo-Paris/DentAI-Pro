---
composite: AuthForgotPassword
---

# Forgot Password Page Specification

## Overview
Public page for requesting a password reset link via email. Same split-panel AuthLayout. Simple single-field form that transitions to a confirmation state after submission.

## Views

### Brand Panel (desktop only)
1. **Brand name** — "ToSmile.ai" with gradient text.
2. **Headline** — Brand slogan with neon-text effect.
3. **Description** — Value proposition paragraph.
4. **Feature list** — 4 items with icon badges and descriptions.
5. **Social proof** — Muted text at bottom.
6. **Decorative elements** — Floating glow orbs, dot grid, tooth watermark.

### Form Panel (input state)
1. **Brand name (mobile)** — "ToSmile.ai" gradient text, hidden on desktop.
2. **Title** — "Esqueceu a senha?".
3. **Subtitle** — "Digite seu email para receber o link de recuperação".
4. **Email field** — Label "Email", placeholder "nome@exemplo.com", type email.
5. **Submit button** — Full-width primary "Enviar link de recuperação" with btn-glow. Loading: spinner + "Enviando...".
6. **Back to login link** — Centered link with ArrowLeft icon, "Voltar para login".

### Form Panel (sent state)
1. **Title** — "Esqueceu a senha?".
2. **Subtitle** — "Verifique sua caixa de entrada".
3. **Mail icon** — Centered in IconCircle with scale-in animation.
4. **Confirmation text** — "Enviamos um link para [email]. Clique no link para redefinir sua senha."
5. **Resend button** — Full-width outline "Enviar novamente".
6. **Back to login link** — Same as input state.

## UI Requirements
- Same split-panel layout as login (AuthLayout)
- Fade-in-up animation on form (0.5s delay)
- Sent state uses scale-in animation on mail icon
- Submit button uses `btn-glow`
- Back link uses muted color with hover transition
- All interactive: `focus-visible:ring-2`, `transition-colors`

## Configuration
- shell: false
- route: /forgot-password
- auth: public (no authentication required)
