---
title: "AGENTS.md (packages/domain-odonto-ai)"
created: 2026-02-23
updated: 2026-02-23
author: Team AURIA
status: published
tags:
  - type/guide
  - status/published
  - package/domain-odonto-ai
related:
  - "[[../AGENTS.md]]"
  - "[[../../AGENTS.md]]"
  - "[[CLAUDE.md]]"
---

# Agente: Domain Odonto AI

> Instruções específicas para packages/domain-odonto-ai.

## Navegação

- [[CLAUDE.md]] — Entry point deste package
- [[../AGENTS.md]] — Packages index (pai)
- [[../../AGENTS.md]] — Índice geral

## Herança

- **Pai**: [[../AGENTS.md]] (packages)
- **Root**: [[../../AGENTS.md]]

## Project Context

`@parisgroup-ai/domain-odonto-ai` fornece componentes de domínio odontológico construídos sobre PageShell composites. Publicado no GitHub Packages.

## Key Locations

| Diretório | Conteúdo |
|-----------|----------|
| `src/patients/` | Componentes de pacientes |
| `src/appointments/` | Agendamentos |
| `src/treatments/` | Tratamentos |
| `src/billing/` | Faturamento |
| `src/dashboard/` | Dashboard |
| `src/settings/` | Configurações |
| `src/inventory/` | Inventário |
| `src/imaging/` | Imagens clínicas |
| `src/prescriptions/` | Prescrições |
| `src/evaluations/` | Avaliações |
| `src/shared/` | Componentes e utils compartilhados |
| `src/index.ts` | Entry point |
| `src/client.ts` | Client configuration |

## Instruções Específicas

- Usar PageShell composites (ListPage, FormPage, DetailPage, etc.) como base
- Peer dependency: `@parisgroup-ai/pageshell ^2.10.2`
- Build: `tsup` (ESM + types)
- Validação: `pnpm -C packages/domain-odonto-ai type-check`

## Links

- [[CLAUDE.md]] — Entry point
- [[../AGENTS.md]] — Packages index

---
*Atualizado: 2026-02-23*
