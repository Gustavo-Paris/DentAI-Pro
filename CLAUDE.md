# DentAI Pro

> Entry point. Leia primeiro.

## Instruções do Agente

→ [[AGENTS.md]]

## Contexto

- **O quê**: Sistema de apoio à decisão clínica odontológica com IA
- **Stack**: React 18 + TypeScript, Vite, Tailwind CSS + shadcn/ui, Supabase, Google Gemini AI
- **Monorepo**: Turborepo + pnpm workspaces

## Estrutura

```
dentai-pro/
├── apps/web/          # App principal (Vite + React)
├── packages/logger/   # Logger compartilhado
├── packages/page-shell/        # Barrel package PageShell
├── packages/pageshell-*/       # Design system PageShell (11 packages)
```

## Links

- [[README.md]] - Documentação técnica
- [[AGENTS.md]] - Índice geral de agentes

---
*Atualizado: 2026-02-04*
