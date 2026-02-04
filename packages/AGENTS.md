# Agentes: Packages

> Índice dos packages do monorepo DentAI Pro.

## Herança

- **Pai**: [[../AGENTS.md]]

## Packages

| Package | Caminho | Descrição |
|---------|---------|-----------|
| @repo/logger | [[logger/AGENTS.md]] | Logger compartilhado |
| @repo/page-shell | [[page-shell/AGENTS.md]] | Barrel package - re-exporta todos @pageshell/* |
| @pageshell/core | [[pageshell-core/AGENTS.md]] | Core hooks, utils e types |
| @pageshell/primitives | [[pageshell-primitives/AGENTS.md]] | Radix UI primitives |
| @pageshell/layouts | [[pageshell-layouts/AGENTS.md]] | Layout components |
| @pageshell/interactions | [[pageshell-interactions/AGENTS.md]] | Interactive components |
| @pageshell/features | [[pageshell-features/AGENTS.md]] | Feature components (Layer 4) |
| @pageshell/composites | [[pageshell-composites/AGENTS.md]] | Page composites |
| @pageshell/shell | [[pageshell-shell/AGENTS.md]] | PageShell facade e query handling |
| @pageshell/theme | [[pageshell-theme/AGENTS.md]] | Theme context e hooks |
| @pageshell/themes | [[pageshell-themes/AGENTS.md]] | Theme presets |
| @pageshell/domain | [[pageshell-domain/AGENTS.md]] | Domain-specific UI components |

## Instruções para Packages

- Packages PageShell seguem arquitetura em camadas (ADR-0019): Primitives → Layouts → Interactions → Features → Composites
- Barrel package `@repo/page-shell` é read-only (apenas re-exports)
- Validação: `pnpm -C packages/<nome> type-check`

## Links

- [[../CLAUDE.md]] - Entry point raiz
- [[../AGENTS.md]] - Índice geral

---
*Atualizado: 2026-02-04*
