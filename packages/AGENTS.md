---
title: "AGENTS.md (packages)"
created: 2026-02-04
updated: 2026-02-04
author: Team DentAI
status: published
tags:
  - type/guide
  - type/index
  - status/published
  - scope/packages
related:
  - "[[../AGENTS.md]]"
  - "[[../docs/00-Index/Home]]"
  - "[[../CLAUDE.md]]"
---

# Agentes: Packages

> Índice dos packages do monorepo DentAI Pro.

## Navegação

- [[../CLAUDE.md]] — Entry point raiz
- [[../AGENTS.md]] — Índice geral (pai)
- [[../docs/00-Index/Home]] — Hub de documentação

## Herança

- **Pai**: [[../AGENTS.md]]

## Packages

### Utilities

| Package | Caminho | Descrição |
|---------|---------|-----------|
| @repo/logger | [[logger/AGENTS.md]] | Logger compartilhado |

### PageShell Design System

> [!info] Arquitetura em Camadas
> PageShell segue arquitetura em camadas (L0 → L4).
> Import via barrel: `@repo/page-shell`.

```
L0  Core         → hooks, utils, types, formatters
L1  Primitives   → Radix UI wrappers
L2  Layouts      → grids, sidebars, page structure
L2  Interactions → forms, dropdowns, search
L3  Features     → feature-level components
L4  Composites   → full page patterns
```

| Package | Caminho | Layer | Descrição |
|---------|---------|-------|-----------|
| @repo/page-shell | [[page-shell/AGENTS.md]] | Facade | Barrel - re-exporta todos @pageshell/* |
| @pageshell/core | [[pageshell-core/AGENTS.md]] | L0 | Core hooks, utils e types |
| @pageshell/primitives | [[pageshell-primitives/AGENTS.md]] | L1 | Radix UI primitives |
| @pageshell/layouts | [[pageshell-layouts/AGENTS.md]] | L2 | Layout components |
| @pageshell/interactions | [[pageshell-interactions/AGENTS.md]] | L2 | Interactive components |
| @pageshell/features | [[pageshell-features/AGENTS.md]] | L3 | Feature components |
| @pageshell/composites | [[pageshell-composites/AGENTS.md]] | L4 | Page composites |
| @pageshell/shell | [[pageshell-shell/AGENTS.md]] | Facade | PageShell facade e query handling |
| @pageshell/theme | [[pageshell-theme/AGENTS.md]] | Infra | Theme context e hooks |
| @pageshell/themes | [[pageshell-themes/AGENTS.md]] | Infra | Theme presets |
| @pageshell/domain | [[pageshell-domain/AGENTS.md]] | Domain | Domain-specific UI components |

### Composites Disponíveis

> [!tip] Page Composites
> Use composites para 70-85% de redução de código em páginas.

| Composite | Use Case |
|-----------|----------|
| `ListPage` | CRUD lists com filtering, sorting, pagination |
| `FormPage` | Forms com validação |
| `FormModal` | Modal form dialogs |
| `DetailPage` | Detail/view com sections e tabs |
| `DashboardPage` | Stats & widgets |
| `WizardPage` | Multi-step flows |

## Instruções para Packages

> [!warning] Regras
> Aplicam-se a todos os packages.

| Regra | Descrição |
|-------|-----------|
| **Camadas** | Respeitar dependências L0 → L1 → L2 → L3 → L4 |
| **Barrel** | `@repo/page-shell` é read-only (apenas re-exports) |
| **Build** | Cada package usa `tsup` (ESM + types) |
| **Validação** | `pnpm -C packages/<nome> type-check` |
| **Testes** | Type-check obrigatório antes de PR |

## Comandos

| Comando | Descrição |
|---------|-----------|
| `pnpm -C packages/<nome> type-check` | Validação TypeScript |
| `pnpm -C packages/<nome> build` | Build do package |
| `pnpm turbo run type-check --filter=@pageshell/*` | Type-check todos PageShell |

## Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [[../docs/00-Index/Home]] | Hub de documentação |
| [[../docs/00-Index/Home#Packages]] | Seção de packages no hub |
| [[pageshell-composites/README]] | Guia completo de composites |

## Links

- [[../CLAUDE.md]] — Entry point raiz
- [[../AGENTS.md]] — Índice geral
- [[../docs/00-Index/Home]] — Hub de documentação

---
*Atualizado: 2026-02-04*
