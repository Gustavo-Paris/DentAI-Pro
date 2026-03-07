---
composite: AuthRegister
---

# Register Page Specification

## Overview
Public registration page for new dentists. Same split-panel AuthLayout as login. Form collects professional details (name, CRO number), credentials, and terms acceptance. Transitions to email verification state on success.

## Views

### Brand Panel (desktop only)
1. **Brand name** — "ToSmile.ai" with gradient text.
2. **Headline** — Brand slogan with neon-text effect.
3. **Description** — Value proposition paragraph.
4. **Feature list** — 4 items with icon badges and descriptions.
5. **Social proof** — Muted text at bottom.
6. **Decorative elements** — Floating glow orbs, dot grid, tooth watermark.

### Form Panel (registration state)
1. **Brand name (mobile)** — "ToSmile.ai" gradient text, hidden on desktop.
2. **Title** — "Criar sua conta".
3. **Subtitle** — "Comece a usar em poucos minutos".
4. **Google button** — Outline button with Google icon, "Continuar com Google".
5. **Divider** — Horizontal line with "ou" centered.
6. **Full name field** — Label "Nome completo", placeholder "Dr. João Silva".
7. **CRO field** — Label "CRO (opcional)", placeholder "CRO-SP 12345".
8. **Email field** — Label "Email profissional", placeholder "nome@exemplo.com".
9. **Password field** — Label "Senha", placeholder dots, with PasswordRequirements indicator below.
10. **Confirm password field** — Label "Confirmar senha", placeholder dots.
11. **Terms checkbox** — "Concordo com os Termos de Uso e Política de Privacidade" with links.
12. **CAPTCHA widget** — Cloudflare Turnstile placeholder, centered.
13. **Submit button** — Full-width primary "Criar conta" with btn-glow. Loading: spinner + "Criando conta...".
14. **Login link** — "Já tem uma conta? Entrar" linking to /login.

### Form Panel (email sent state)
1. **Title** — "Verifique seu email".
2. **Subtitle** — "Enviamos um link de verificação para [email]. Clique no link para ativar sua conta."
3. **Mail icon** — Centered in an IconCircle with scale-in animation.
4. **Go to login button** — Full-width primary "Ir para login" with btn-glow.

## UI Requirements
- Same split-panel layout as login (AuthLayout)
- Staggered fade-in-up animations (0.4s, 0.45s, 0.5s delays)
- Password requirements indicator shows: min 8 chars, uppercase, lowercase, number
- Terms checkbox links open in new tab
- Email sent state uses scale-in animation on the mail icon
- Submit button uses `btn-glow`
- All interactive: `focus-visible:ring-2`, `transition-colors`

## Configuration
- shell: false
- route: /register
- auth: public (no authentication required)
