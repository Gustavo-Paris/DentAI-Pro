---
composite: AuthResetPassword
---

# Reset Password Page Specification

## Overview
Public page for setting a new password after clicking the recovery link from email. Same split-panel AuthLayout. Has three states: loading (session validation), invalid link, and password form. Transitions to success state with auto-redirect after update.

## Views

### Brand Panel (desktop only)
1. **Brand name** — "ToSmile.ai" with gradient text.
2. **Headline** — Brand slogan with neon-text effect.
3. **Description** — Value proposition paragraph.
4. **Feature list** — 4 items with icon badges and descriptions.
5. **Social proof** — Muted text at bottom.
6. **Decorative elements** — Floating glow orbs, dot grid, tooth watermark.

### Form Panel (loading state)
1. **Title** — "Redefinir senha".
2. **Spinner** — Centered Loader2 animation while validating recovery session.

### Form Panel (invalid link state)
1. **Title** — "Link inválido".
2. **Subtitle** — "Este link expirou ou já foi utilizado. Solicite um novo link de recuperação."
3. **Request new link button** — Full-width primary "Solicitar novo link" with btn-glow, navigates to /forgot-password.

### Form Panel (form state)
1. **Brand name (mobile)** — "ToSmile.ai" gradient text, hidden on desktop.
2. **Title** — "Redefinir senha".
3. **Subtitle** — "Digite sua nova senha".
4. **New password field** — Label "Nova senha", placeholder dots, with PasswordRequirements indicator.
5. **Confirm password field** — Label "Confirmar nova senha", placeholder dots.
6. **Submit button** — Full-width primary "Atualizar senha" with btn-glow. Loading: spinner + "Atualizando...".

### Form Panel (success state)
1. **Title** — "Senha atualizada!".
2. **Subtitle** — "Você será redirecionado em instantes...".
3. **Check icon** — Centered CheckCircle in IconCircle with scale-in animation.
4. **Redirect message** — "Redirecionando para o dashboard..." muted text.

## UI Requirements
- Same split-panel layout as login (AuthLayout)
- Fade-in-up animation on form (0.5s delay)
- Success state uses scale-in animation on check icon
- Auto-redirect to /dashboard after 2 seconds on success
- Password requirements indicator below new password field
- Submit button uses `btn-glow`
- All interactive: `focus-visible:ring-2`, `transition-colors`

## Configuration
- shell: false
- route: /reset-password
- auth: public (accessed via recovery link with session token in URL)
