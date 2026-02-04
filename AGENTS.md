# Agentes do Projeto - DentAI Pro

> Índice de todos os agentes/apps do monorepo.

## Hierarquia

| Agente | Caminho | Descrição |
|--------|---------|-----------|
| web | [[apps/web/AGENTS.md]] | App principal - decisão clínica odontológica com IA |
| logger | [[packages/logger/AGENTS.md]] | Logger compartilhado |
| page-shell | [[packages/page-shell/AGENTS.md]] | Barrel package - re-exporta todos @pageshell/* |
| pageshell-core | [[packages/pageshell-core/AGENTS.md]] | Core hooks, utils e types |
| pageshell-primitives | [[packages/pageshell-primitives/AGENTS.md]] | Radix UI primitives |
| pageshell-layouts | [[packages/pageshell-layouts/AGENTS.md]] | Layout components |
| pageshell-interactions | [[packages/pageshell-interactions/AGENTS.md]] | Interactive components |
| pageshell-features | [[packages/pageshell-features/AGENTS.md]] | Feature components (Layer 4) |
| pageshell-composites | [[packages/pageshell-composites/AGENTS.md]] | Page composites (ListPage, FormPage, etc.) |
| pageshell-shell | [[packages/pageshell-shell/AGENTS.md]] | PageShell facade e query handling |
| pageshell-theme | [[packages/pageshell-theme/AGENTS.md]] | Theme context e hooks |
| pageshell-themes | [[packages/pageshell-themes/AGENTS.md]] | Theme presets (admin, creator, student) |
| pageshell-domain | [[packages/pageshell-domain/AGENTS.md]] | Domain-specific UI components |

## Instruções Globais

- **Linguagem**: TypeScript strict mode em todo o projeto
- **Package manager**: pnpm (nunca npm ou yarn)
- **Build**: Turborepo (`turbo run build/dev/test/lint/type-check`)
- **Testes**: Vitest para apps/web, type-check para packages
- **Lint**: ESLint 9 flat config
- **Estilo**: Tailwind CSS + shadcn/ui
- **Commits**: Conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`)

## Herança

Instruções aqui se aplicam a todos os filhos.
Filhos podem sobrescrever com `@override: razão`.

---
*Atualizado: 2026-02-04*
