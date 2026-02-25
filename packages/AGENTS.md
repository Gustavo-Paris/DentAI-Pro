---
title: "AGENTS.md (packages)"
created: 2026-02-04
updated: 2026-02-25
author: Team AURIA
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

> Índice dos packages do monorepo AURIA.

## Navegação

- [[../CLAUDE.md]] — Entry point raiz
- [[../AGENTS.md]] — Índice geral (pai)
- [[../docs/00-Index/Home]] — Hub de documentação

## Herança

- **Pai**: [[../AGENTS.md]]

## Packages

### Local Packages

| Package | Caminho | Descrição |
|---------|---------|-----------|
| @repo/logger | [[logger/AGENTS.md]] | Logger compartilhado |

### External Packages

> [!info] Packages Externos
> PageShell (`@parisgroup-ai/pageshell`) e domain-odonto-ai (`@parisgroup-ai/domain-odonto-ai`) são packages externos instalados via GitHub Packages.
> Os diretórios `page-shell/` e `pageshell-*/` contêm apenas `node_modules/` — não há código fonte local.
> Import via: `@parisgroup-ai/pageshell` e `@parisgroup-ai/domain-odonto-ai`.

Arquitetura em camadas (L0 → L4):

```
L0  Core         → hooks, utils, types, formatters
L1  Primitives   → Radix UI wrappers
L2  Layouts      → grids, sidebars, page structure
L2  Interactions → forms, dropdowns, search
L3  Features     → feature-level components
L4  Composites   → full page patterns
```

| Package | Layer | Descrição |
|---------|-------|-----------|
| @pageshell/core | L0 | Core hooks, utils e types |
| @pageshell/primitives | L1 | Radix UI primitives |
| @pageshell/layouts | L2 | Layout components |
| @pageshell/interactions | L2 | Interactive components |
| @pageshell/features | L3 | Feature components |
| @pageshell/composites | L4 | Page composites |
| @pageshell/shell | Facade | PageShell facade e query handling |
| @pageshell/theme | Infra | Theme context e hooks |
| @pageshell/themes | Infra | Theme presets |
| @pageshell/domain | Domain | Domain-specific UI components |

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

## Links

- [[../CLAUDE.md]] — Entry point raiz
- [[../AGENTS.md]] — Índice geral
- [[../docs/00-Index/Home]] — Hub de documentação

---
*Atualizado: 2026-02-25*
