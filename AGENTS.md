---
title: Agentes do Projeto - DentAI Pro
created: 2026-02-04
updated: 2026-02-11
author: Team DentAI
status: published
tags:
  - type/guide
  - type/index
  - status/published
related:
  - "[[CLAUDE.md]]"
  - "[[docs/00-Index/Home]]"
  - "[[README]]"
---

# Agentes do Projeto - DentAI Pro

> Índice de todos os agentes/apps do monorepo.

## Navegação Rápida

- [[CLAUDE.md]] — Entry point (leia primeiro)
- [[docs/00-Index/Home]] — Hub de documentação
- [[README]] — Documentação técnica

## Hierarquia

```
AGENTS.md (este arquivo)
├── apps/
│   └── web/AGENTS.md          → App principal
├── packages/
│   ├── AGENTS.md              → Índice de packages
│   ├── logger/AGENTS.md
│   ├── page-shell/AGENTS.md
│   └── pageshell-*/AGENTS.md  → Design system (11 packages)
└── docs/
    └── 00-Index/Home.md       → Hub de documentação
```

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

> [!warning] Obrigatório
> Estas instruções se aplicam a **todos** os agentes do monorepo.

| Aspecto | Regra |
|---------|-------|
| **Linguagem** | TypeScript strict mode |
| **Package manager** | pnpm (nunca npm ou yarn) |
| **Build** | Turborepo (`turbo run build/dev/test/lint/type-check`) |
| **Testes** | Vitest para apps/web, type-check para packages |
| **Lint** | ESLint 9 flat config |
| **Estilo** | Tailwind CSS + shadcn/ui |
| **Commits** | Conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`) |

## Documentação

> [!info] Hub de Documentação
> A documentação centralizada segue convenções Obsidian para navegabilidade e rastreabilidade.

| Tipo | Localização | Descrição |
|------|-------------|-----------|
| **Hub** | [[docs/00-Index/Home]] | Ponto de entrada da documentação |
| **Architecture Plans** | `docs/plans/` | Design documents e implementation plans |
| **Templates** | `docs/Templates/` | Templates para ADRs, PRs, Runbooks |
| **Assets** | `docs/Assets/` | Diagramas e imagens |

### Convenções de Documentação

1. **Frontmatter YAML** — Todo documento deve ter: `title`, `created`, `updated`, `status`, `tags`
2. **Links internos** — Usar formato `[[wikilink]]` para navegação
3. **Callouts** — Usar para avisos importantes:
   - `> [!info]` — Informação
   - `> [!tip]` — Dica
   - `> [!warning]` — Aviso
   - `> [!danger]` — Crítico
4. **Tags padrão**:
   - `type/guide`, `type/adr`, `type/runbook`, `type/api`
   - `status/draft`, `status/review`, `status/published`

### Governance

> [!danger] Regras de Rastreabilidade
> Mudanças estruturais requerem ADR vinculado antes do PR.

| Artefato | Formato ID | Exemplo |
|----------|------------|---------|
| Requisito | `REQ-###` | REQ-042 |
| ADR | `ADR-###` | ADR-007 |
| PR | `PR #####` | PR #123 |
| Teste | `TEST-###` | TEST-101 |

**Links bidirecionais obrigatórios:**
```
REQ-042 ←→ ADR-007 ←→ PR #123 ←→ TEST-101
```

**ADRs existentes:**

| ADR | Decisão |
|-----|---------|
| [[06-ADRs/ADR-001-3-layer-frontend-architecture\|ADR-001]] | 3-Layer Frontend Architecture |
| [[06-ADRs/ADR-002-pageshell-design-system-adoption\|ADR-002]] | PageShell Design System Adoption |
| [[06-ADRs/ADR-003-centralized-prompt-management\|ADR-003]] | Centralized Prompt Management |
| [[06-ADRs/ADR-004-credit-model-and-monetization\|ADR-004]] | Credit Model & Monetization |
| [[06-ADRs/ADR-005-authentication-and-authorization\|ADR-005]] | Authentication & Authorization |
| [[06-ADRs/ADR-006-ai-integration-strategy\|ADR-006]] | AI Integration Strategy |
| [[06-ADRs/ADR-007-clinical-photo-storage\|ADR-007]] | Clinical Photo Storage |
| [[06-ADRs/ADR-008-wizard-architecture-post-refactor\|ADR-008]] | Wizard Architecture (Post-Refactor) |

→ [[06-ADRs/ADR-Index]] — Índice completo + template

## Herança

Instruções aqui se aplicam a todos os filhos.
Filhos podem sobrescrever com `@override: razão`.

## Links Relacionados

- [[docs/00-Index/Home]] — Hub de documentação completo
- [[docs/plans/2026-02-04-frontend-architecture-design]] — Arquitetura frontend
- [[README]] — Setup e overview técnico

---
*Atualizado: 2026-02-11*
