---
title: Agentes do Projeto - AURIA
created: 2026-02-04
updated: 2026-02-25
author: Team AURIA
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

# Agentes do Projeto - AURIA

> Índice de todos os agentes/apps do monorepo.

## Navegação Rápida

- [[CLAUDE.md]] — Entry point (leia primeiro)
- [[docs/00-Index/Home]] — Hub de documentação
- [[README]] — Documentação técnica

## Hierarquia

```
AGENTS.md (este arquivo)
├── apps/
│   └── web/AGENTS.md              → App principal
├── packages/
│   ├── AGENTS.md                  → Índice de packages
│   └── logger/AGENTS.md
├── supabase/
│   ├── AGENTS.md                  → Instruções backend
│   └── functions/                 → Edge functions (backend)
└── docs/
    └── 00-Index/Home.md           → Hub de documentação
```

| Agente | Caminho | Descrição |
|--------|---------|-----------|
| web | [[apps/web/AGENTS.md]] | App principal - decisão clínica odontológica com IA |
| supabase | [[supabase/AGENTS.md]] | Edge functions backend (Deno) - IA, billing, LGPD |
| packages | [[packages/AGENTS.md]] | Índice de packages (logger local + PageShell externo) |
| logger | [[packages/logger/AGENTS.md]] | Logger compartilhado |

> [!info] Packages Externos
> PageShell (`@parisgroup-ai/pageshell`), page-shell (barrel) e domain-odonto-ai (`@parisgroup-ai/domain-odonto-ai`) são packages externos instalados via GitHub Packages. Não possuem AGENTS.md local. Ver [[packages/AGENTS.md]] para documentação de arquitetura.

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
| [[docs/06-ADRs/ADR-001-3-layer-frontend-architecture\|ADR-001]] | 3-Layer Frontend Architecture |
| [[docs/06-ADRs/ADR-002-pageshell-design-system-adoption\|ADR-002]] | PageShell Design System Adoption |
| [[docs/06-ADRs/ADR-003-centralized-prompt-management\|ADR-003]] | Centralized Prompt Management |
| [[docs/06-ADRs/ADR-004-credit-model-and-monetization\|ADR-004]] | Credit Model & Monetization |
| [[docs/06-ADRs/ADR-005-authentication-and-authorization\|ADR-005]] | Authentication & Authorization |
| [[docs/06-ADRs/ADR-006-ai-integration-strategy\|ADR-006]] | AI Integration Strategy |
| [[docs/06-ADRs/ADR-007-clinical-photo-storage\|ADR-007]] | Clinical Photo Storage |
| [[docs/06-ADRs/ADR-008-wizard-architecture-post-refactor\|ADR-008]] | Wizard Architecture (Post-Refactor) |
| [[docs/06-ADRs/ADR-009-Design-System-Coexistence\|ADR-009]] | Design System Coexistence (PageShell + shadcn/ui) |

→ [[docs/06-ADRs/ADR-Index]] — Índice completo + template

## Herança

Instruções aqui se aplicam a todos os filhos.
Filhos podem sobrescrever com `@override: razão`.

## Links Relacionados

- [[docs/00-Index/Home]] — Hub de documentação completo
- [[docs/plans/2026-02-04-frontend-architecture-design]] — Arquitetura frontend
- [[README]] — Setup e overview técnico

---
*Atualizado: 2026-02-26*
