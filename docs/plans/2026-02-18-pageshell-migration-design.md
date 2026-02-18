---
title: "Migração para @parisgroup-ai/pageshell"
created: 2026-02-18
updated: 2026-02-18
status: draft
tags:
  - type/plan
  - status/draft
---

# Migração para @parisgroup-ai/pageshell

## Contexto

O projeto usa 11 pacotes locais `packages/pageshell-*` como design system. Esses pacotes foram consolidados e publicados como `@parisgroup-ai/pageshell` no GitHub Packages. A migração unifica tudo em um pacote externo versionado.

## Decisões

- **Escopo:** Todas as 28 páginas
- **Abordagem:** Big-bang (um PR)
- **Tema:** `odonto-ai` (preset embutido no pacote)
- **Cleanup:** Remover pacotes locais após migração

## Pacote Instalado

- `@parisgroup-ai/pageshell@2.8.0`
- Registry: GitHub Packages (`npm.pkg.github.com`)
- Auth: `.npmrc` com `GITHUB_TOKEN` (gitignored)

## Design

### Seção 1: Fundação (Root Setup)

**CSS imports no entry point:**
```css
@import '@parisgroup-ai/pageshell/theme/tokens.css';
@import '@parisgroup-ai/pageshell/theme/portal-base.css';
@import '@parisgroup-ai/pageshell/theme/presets/odonto-ai.css';
```

**Provider no root:**
- Substituir `NextThemesProvider` por `PageShellProvider` com `theme="odonto-ai"`
- Usar adapter `react-router` do pacote para integração com React Router v7
- Remover `ThemeProvider.tsx` customizado

**AppLayout:**
- Substituir layout customizado por `Shell`, `Sidebar`, `Header` de `@parisgroup-ai/pageshell/layouts`
- Migrar navegação lateral para sistema de nav do pacote

**CSS cleanup:**
- Remover tokens CSS customizados substituídos pelo pacote
- Manter Tailwind (pacote usa `tailwind-merge` + `clsx` internamente)

### Seção 2: 11 Páginas Existentes (Swap de Imports)

Mudança mecânica de imports:

| Página | Composite |
|--------|-----------|
| Dashboard | DashboardPage |
| Evaluations | ListPage |
| Patients | ListPage |
| Inventory | ListPage |
| EvaluationDetails | DetailPage |
| Result | DetailPage |
| GroupResult | DetailPage |
| PatientProfile | DetailPage |
| Profile | DetailPage |
| Pricing | DetailPage |
| NewCase | WizardPage |

**Mapeamento de imports:**
- `@pageshell/composites` → `@parisgroup-ai/pageshell/composites`
- `@pageshell/primitives` → `@parisgroup-ai/pageshell/primitives`
- `@pageshell/interactions` → `@parisgroup-ai/pageshell/interactions`
- `@pageshell/layouts` → `@parisgroup-ai/pageshell/layouts`
- `@pageshell/core` → `@parisgroup-ai/pageshell/core`

Componentes custom dentro de cada página não mudam.

### Seção 3: Auth Pages (4 páginas)

Login, Register, ForgotPassword, ResetPassword:
- Reescrever usando `FormPage` do pacote
- Primitivos do pacote substituem shadcn local
- Manter lógica de auth (hooks, OAuth, zod)
- Remover `AuthLayout.tsx`

### Seção 4: Páginas Estáticas (3 páginas)

- **Terms, Privacy:** `PageShellRoot` + `PageSection` dos layouts
- **NotFound:** `EmptyState` do primitivos com ícone 404 + botão voltar

### Seção 5: Landing + SharedEvaluation

**Landing.tsx:**
- Reescrever com primitivos do pacote (Button, Card, Badge, Accordion)
- Manter animações CSS/JS de scroll reveal
- Migrar HeroMockup e FeaturePreview para primitivos do pacote

**SharedEvaluation.tsx:**
- Usar `DetailPage` do pacote (view readonly de resultado)

### Seção 6: Cleanup

1. Deletar `packages/pageshell-*` (11 pacotes) e `packages/page-shell/`
2. Remover shadcn/ui duplicados em `components/ui/` que existem no pacote
3. Remover `ThemeProvider.tsx` e `AuthLayout.tsx`
4. Atualizar `pnpm-workspace.yaml` e `turbo.json`
5. Limpar `index.css` (tokens CSS substituídos)

## Links

- [[06-ADRs/ADR-002|ADR-002: PageShell Design System Adoption]]
- [[06-ADRs/ADR-001|ADR-001: 3-Layer Frontend Architecture]]
