---
title: "AGENTS.md (apps/web)"
created: 2026-02-04
updated: 2026-02-04
status: active
tags:
  - type/guide
  - status/active
  - app/web
related:
  - "[[../../AGENTS.md]]"
---

# Agente: DentAI Web

> Instruções específicas para apps/web.

## Herança

- **Pai**: [[../../AGENTS.md]]

## Project Context

`@dentai/web` é o app principal do DentAI Pro. Sistema de apoio à decisão clínica odontológica com IA, incluindo análise de fotos dentais, recomendação de resinas, cimentação e Digital Smile Design (DSD).

## Key Locations

- Entry: `apps/web/src/`
- Components: `apps/web/src/components/`
- Pages: `apps/web/src/pages/`
- Hooks: `apps/web/src/hooks/`
- Lib/Utils: `apps/web/src/lib/`
- Integrations: `apps/web/src/integrations/` (Supabase)
- Types: `apps/web/src/types/`

## Stack

| Tecnologia | Uso |
|-----------|-----|
| React 18 | UI framework |
| TypeScript | Tipagem |
| Vite | Build tool / dev server |
| Tailwind CSS | Styling |
| shadcn/ui + Radix | Component library |
| Supabase | Auth, Database, Edge Functions |
| Google Gemini AI | Análise de fotos e geração de recomendações |
| React Query | Server state management |
| React Hook Form + Zod | Forms e validação |
| React Router DOM | Routing |
| Vitest | Testes |

## Instruções Específicas

- Usar `vitest` para testes (`pnpm -C apps/web test`)
- Build: `pnpm -C apps/web build`
- Dev: `pnpm -C apps/web dev`
- Type-check: `pnpm -C apps/web type-check`
- Lint: `pnpm -C apps/web lint`

## Links

- [[CLAUDE.md]] - Entry point
- [[../../AGENTS.md]] - Índice geral

---
*Atualizado: 2026-02-04*
