# AURIA

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
├── apps/web/                       # App principal (Vite + React)
├── packages/logger/                # Logger compartilhado
├── packages/domain-odonto-ai/      # Componentes de domínio odontológico
├── packages/page-shell/            # Barrel package PageShell (externo)
├── packages/pageshell-*/           # Design system PageShell (externo, 11 packages)
├── supabase/functions/             # Edge functions (backend Deno)
```

## Links

- [[README.md]] - Documentação técnica
- [[AGENTS.md]] - Índice geral de agentes

---
*Atualizado: 2026-02-23*
