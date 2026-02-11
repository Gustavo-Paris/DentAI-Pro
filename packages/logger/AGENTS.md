---
title: "AGENTS.md (packages/logger)"
created: 2026-02-04
updated: 2026-02-04
status: active
tags:
  - type/guide
  - status/active
  - package/logger
related:
  - "[[../AGENTS.md]]"
  - "[[../../AGENTS.md]]"
---

# Agente: Logger

> Instruções específicas para packages/logger.

## Herança

- **Pai**: [[../AGENTS.md]] (packages)
- **Root**: [[../../AGENTS.md]]

## Project Context

`@repo/logger` é o logger compartilhado do monorepo AURIA. Package simples com entry point em `src/index.ts`.

## Key Locations

- Public entry: `packages/logger/src/index.ts`

## Instruções Específicas

- Package simples, sem build step (importação direta de .ts)
- Manter API minimal e consistente

## Links

- [[CLAUDE.md]] - Entry point
- [[../AGENTS.md]] - Packages index

---
*Atualizado: 2026-02-04*
