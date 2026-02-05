---
title: "AGENTS.md (apps/web)"
created: 2026-02-04
updated: 2026-02-04
author: Team DentAI
status: published
tags:
  - type/guide
  - status/published
  - app/web
related:
  - "[[../../AGENTS.md]]"
  - "[[../../docs/00-Index/Home]]"
  - "[[CLAUDE.md]]"
---

# Agente: DentAI Web

> Instruções específicas para apps/web.

## Navegação

- [[CLAUDE.md]] — Entry point deste app
- [[../../AGENTS.md]] — Índice geral (pai)
- [[../../docs/00-Index/Home]] — Hub de documentação

## Herança

- **Pai**: [[../../AGENTS.md]]

## Project Context

`@dentai/web` é o app principal do DentAI Pro. Sistema de apoio à decisão clínica odontológica com IA, incluindo análise de fotos dentais, recomendação de resinas, cimentação e Digital Smile Design (DSD).

## Key Locations

| Diretório | Conteúdo |
|-----------|----------|
| `src/` | Entry point |
| `src/components/` | Componentes React reutilizáveis |
| `src/pages/` | Páginas da aplicação (Page Adapters) |
| `src/hooks/` | Custom hooks (Domain Hooks) |
| `src/data/` | Data Client (Supabase wrappers) |
| `src/lib/` | Utilitários e configurações |
| `src/integrations/` | Integrações (Supabase) |
| `src/types/` | Definições TypeScript |

> [!info] Arquitetura 3 Camadas
> O app segue o padrão Data Client → Domain Hooks → Page Adapters.
> Ver [[../../docs/plans/2026-02-04-frontend-architecture-design|Frontend Architecture Design]].

## Stack

| Tecnologia | Uso |
|-----------|-----|
| React 18 | UI framework |
| TypeScript | Tipagem estrita |
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

> [!warning] Comandos
> Sempre executar a partir da raiz do monorepo.

| Comando | Descrição |
|---------|-----------|
| `pnpm -C apps/web dev` | Servidor de desenvolvimento |
| `pnpm -C apps/web build` | Build de produção |
| `pnpm -C apps/web test` | Executar testes (Vitest) |
| `pnpm -C apps/web type-check` | Validação TypeScript |
| `pnpm -C apps/web lint` | Lint check |

## Features

| Feature | Descrição | Edge Function |
|---------|-----------|---------------|
| Análise de Fotos | IA identifica cores VITA em fotos intraorais | `analyze-dental-photo` |
| Recomendação de Resina | Protocolo de estratificação personalizado | `recommend-resin` |
| Cimentação | Cimentos e técnicas ideais por caso | `recommend-cementation` |
| DSD | Digital Smile Design com simulação | `generate-dsd` |
| Pacientes | CRUD completo com histórico | - |
| Billing | Integração Stripe (assinaturas) | `stripe-webhook`, `create-checkout-session` |

## Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [[../../docs/00-Index/Home]] | Hub de documentação |
| [[../../docs/plans/2026-02-04-frontend-architecture-design]] | Arquitetura frontend (3 camadas) |
| [[../../docs/plans/2026-02-04-prompt-management-design]] | Gestão de prompts IA |
| [[../../README]] | Setup e overview |

## Links

- [[CLAUDE.md]] — Entry point
- [[../../AGENTS.md]] — Índice geral
- [[../../docs/00-Index/Home]] — Hub de documentação

---
*Atualizado: 2026-02-04*
