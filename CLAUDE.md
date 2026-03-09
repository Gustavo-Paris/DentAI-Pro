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
├── packages/page-shell/            # Barrel package PageShell (externo)
├── packages/pageshell-*/           # Design system PageShell (externo, 11 packages)
├── supabase/functions/             # Edge functions (backend Deno)
```

## Links

- [[README.md]] - Documentação técnica
- [[AGENTS.md]] - Índice geral de agentes

---
*Atualizado: 2026-02-26*


<!-- AgentHub:start -->
# AgentHub — Enforcement Rules

> Non-negotiable rules for ALL conversations and ALL Agent Teams teammates.

## 1. QA Testing = Agent Teams

QA flow: `TeamCreate` → `Agent(team_name)` → `SendMessage` → `TaskCreate/TaskList/TaskUpdate` → `TeamDelete`

## 2. Load Deferred Tools First

Before using ANY Agent Teams tool, call:
```
ToolSearch({ query: "select:TeamCreate,TeamDelete,SendMessage,TaskCreate,TaskGet,TaskList,TaskUpdate,TaskOutput,TaskStop" })
```

## 3. Browser Testing = Hub API Only

ALL browser interactions go through `http://localhost:{port}/api/browsers/{id}/...`
**NEVER** use WebFetch or puppeteer directly. AgentHub manages the browser pool.

## 4. Agent Communication = SendMessage

Text output is INVISIBLE to teammates. Agents MUST use `SendMessage` to communicate.
Update progress via `TaskUpdate`. Report findings via Hub API.

## 5. Hub API Endpoints

- **Bugs:** `POST /api/bugs` | `GET /api/bugs` | `PATCH /api/bugs/{id}`
- **Comments:** `POST /api/comments`
- **Browsers:** `POST /api/browsers` | `GET /api/browsers/{id}/screenshot` | etc.

## 6. QA Skill Trigger

When user says "run qa", "test", "qa pipeline", "run playbook", or "smoke test" → invoke `qa-pipeline-orchestrator` skill.

<!-- AgentHub:end -->