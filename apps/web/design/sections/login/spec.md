---
composite: AuthLogin
---

# Login Page Specification

## Overview
Public authentication page for existing users. Split-panel layout: brand showcase panel (desktop only) on the left, login form on the right. Uses AuthLayout wrapper with glass styling and ambient glow effects.

## Views

### Brand Panel (desktop only)
1. **Brand name** — "ToSmile.ai" with gradient text and letter-spacing.
2. **Headline** — Brand slogan with neon-text effect.
3. **Description** — Value proposition paragraph.
4. **Feature list** — 4 items with icon badges (Sparkles, Shield, Zap, Palette) and descriptions.
5. **Social proof** — Muted text at bottom with user count.
6. **Decorative elements** — Floating glow orbs, dot grid pattern, tooth watermark SVG.

### Form Panel
1. **Brand name (mobile)** — "ToSmile.ai" gradient text, hidden on desktop.
2. **Title** — "Entrar na sua conta".
3. **Subtitle** — "Acesse sua conta para continuar".
4. **Google button** — Outline button with Google icon, "Continuar com Google".
5. **Divider** — Horizontal line with "ou" label centered.
6. **Email field** — Label "Email", placeholder "nome@exemplo.com", type email.
7. **Password field** — Label "Senha", placeholder dots, toggle visibility.
8. **Forgot password link** — Right-aligned muted link "Esqueceu a senha?", navigates to /forgot-password.
9. **CAPTCHA widget** — Cloudflare Turnstile placeholder, centered.
10. **Submit button** — Full-width primary "Entrar" with btn-glow class. Loading state shows spinner + "Entrando...".
11. **Register link** — "Não tem uma conta? Criar conta" linking to /register.

## UI Requirements
- Split layout: 50/50 on desktop (lg+), full-width form on mobile
- Brand panel: radial gradient overlays with primary color, ai-grid-pattern, glow-orb animations
- Form panel: max-w-sm centered, subtle dark gradient background
- Staggered fade-in-up animations on form elements (0.4s, 0.45s, 0.5s delays)
- Glass containers not used on form itself (clean card-less design)
- Submit button uses `btn-glow` for primary emphasis
- All interactive elements: `focus-visible:ring-2`, `transition-colors`
- Password field has show/hide toggle

## Configuration
- shell: false
- route: /login
- auth: public (no authentication required)
