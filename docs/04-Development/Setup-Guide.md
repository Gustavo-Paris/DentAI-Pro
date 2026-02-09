---
title: Developer Setup Guide
created: 2026-02-09
updated: 2026-02-09
author: Team AURIA
status: published
tags:
  - type/guide
  - status/published
related:
  - "[[docs/00-Index/Home]]"
  - "[[02-Architecture/Overview]]"
  - "[[02-Architecture/Tech-Stack]]"
---

# Developer Setup Guide

Guia completo para configurar o ambiente de desenvolvimento AURIA do zero.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Node.js** | v20+ | [nodejs.org](https://nodejs.org) |
| **pnpm** | 9.15+ | `corepack enable && corepack prepare pnpm@9.15.4 --activate` |
| **Supabase CLI** | Latest | `npm install -g supabase` |
| **Docker Desktop** | Latest | [docker.com](https://www.docker.com/products/docker-desktop/) (required for edge function deploy) |
| **Git** | 2.x+ | Pre-installed on macOS |

> [!warning] pnpm Only
> This project uses **pnpm exclusively**. Never use `npm` or `yarn` — they will break workspace resolution.

---

## 1. Clone & Install

```bash
git clone <repo-url> dentai-pro
cd dentai-pro

# Install all dependencies (monorepo-wide)
pnpm install
```

This installs dependencies for all workspaces defined in `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"        # apps/web
  - "packages/*"    # 11 PageShell packages + logger + page-shell barrel
```

---

## 2. Environment Variables

### Frontend (`apps/web/.env`)

```bash
cp apps/web/.env.example apps/web/.env
```

Edit with your Supabase project credentials:

```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
```

> [!tip] Where to find these
> Supabase Dashboard → Settings → API → Project URL and `anon` `public` key.

Optional (production only):

```env
VITE_SENTRY_DSN="your-sentry-dsn"
```

### Edge Function Secrets

Set via Supabase CLI (not in files — never commit secrets):

```bash
# Google Gemini (required for AI functions)
supabase secrets set GOOGLE_AI_API_KEY=your-google-ai-key

# Stripe (required for billing functions)
supabase secrets set STRIPE_SECRET_KEY=sk_test_XXXXX
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_XXXXX

# Verify
supabase secrets list
```

**Auto-injected by Supabase** (no setup needed):

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | API endpoint |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role auth |
| `SUPABASE_ANON_KEY` | Public anon key |

---

## 3. Start Development

```bash
# Start all apps + packages in watch mode
pnpm dev
```

The web app runs at **http://localhost:8080** (IPv6 `[::]`).

To run only the web app:

```bash
pnpm -C apps/web dev
```

### Available Scripts

| Command | Scope | Description |
|---------|-------|-------------|
| `pnpm dev` | Monorepo | Start all apps in dev mode |
| `pnpm build` | Monorepo | Production build (topological) |
| `pnpm lint` | Monorepo | ESLint across all packages |
| `pnpm test` | Monorepo | Run all tests with coverage |
| `pnpm type-check` | Monorepo | TypeScript validation |
| `pnpm clean` | Monorepo | Remove build artifacts |

Web-app specific (prefix with `pnpm -C apps/web`):

| Command | Description |
|---------|-------------|
| `dev` | Vite dev server (port 8080) |
| `build` | Production build → `dist/` |
| `preview` | Preview built output (port 4173) |
| `test:watch` | Vitest in watch mode |

> [!info] Turborepo
> All root scripts use Turborepo for task orchestration. `build`, `lint`, `test`, and `type-check` respect dependency topology (`^build`). `dev` runs persistently without caching.

---

## 4. Supabase Local (Optional)

For local backend development without hitting the remote Supabase instance:

```bash
# Start local Supabase (Docker must be running)
supabase start

# Stop
supabase stop
```

To link to the remote project (required for deploys):

```bash
supabase login
supabase link --project-ref your-project-id
```

---

## 5. Project Structure

```
auria/
├── apps/web/                    # React 18 + Vite
│   ├── src/
│   │   ├── pages/               # 16 route pages (Page Adapters)
│   │   ├── components/          # ~104 components
│   │   ├── hooks/domain/        # 10 domain hooks (React Query)
│   │   ├── data/                # 10 data client modules (Supabase)
│   │   ├── lib/                 # Utilities + Zod schemas
│   │   ├── contexts/            # AuthContext
│   │   └── integrations/        # Supabase client + generated types
│   └── .env                     # Environment vars (gitignored)
│
├── packages/                    # Shared packages
│   ├── pageshell-*/             # 11 design system packages (L0–L4)
│   ├── page-shell/              # Barrel re-export
│   └── logger/                  # Structured logging
│
├── supabase/
│   ├── functions/               # 8 Edge Functions (Deno)
│   │   └── _shared/             # CORS, auth, prompts, credits, gemini
│   ├── migrations/              # 14 SQL migrations
│   └── config.toml              # Supabase project config
│
├── docs/                        # Obsidian documentation vault
├── turbo.json                   # Turborepo pipeline
├── pnpm-workspace.yaml          # Workspace definition
└── vercel.json                  # Vercel deploy config
```

> [!info] Architecture Details
> See [[02-Architecture/Overview]] for the full system diagram and 3-layer frontend architecture.

---

## 6. Key Conventions

### Code Style

- **TypeScript strict mode** everywhere
- **Tailwind CSS + shadcn/ui** for styling (no custom CSS classes)
- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- **PageShell composites** for pages: `ListPage`, `FormPage`, `DetailPage`, `DashboardPage`

### Architecture: 3-Layer Frontend

| Layer | Location | Rule |
|-------|----------|------|
| **Data Client** | `src/data/` | Typed Supabase wrappers — no business logic, no React |
| **Domain Hooks** | `src/hooks/domain/` | React Query + business rules — no UI |
| **Page Adapters** | `src/pages/` | Map domain data → PageShell composites — no fetching |

> [!danger] Never skip layers
> Pages must NOT call `src/data/` directly. Always go through domain hooks.

### Edge Functions (Deno)

- **Relative imports** with `.ts` extensions (no pnpm workspace packages)
- **All functions** have `verify_jwt = false` in `config.toml` (auth is internal)
- **Deploy** always with `--no-verify-jwt --use-docker`

See [[05-Operations/Runbooks/Deploy-Edge-Functions]] for the full deploy runbook.

---

## 7. Common Issues

### `pnpm install` fails

```bash
# Clear pnpm cache and retry
pnpm store prune
rm -rf node_modules
pnpm install
```

### Port 8080 in use

Vite dev server binds to `[::]` (IPv6) port 8080. Kill any existing process:

```bash
lsof -ti:8080 | xargs kill -9
```

### `@pageshell/shell` build error

Pre-existing DTS error in `@pageshell/shell`. Does not affect `apps/web` development — the shell package is consumed via the `page-shell` barrel which skips this build step.

### Edge function deploy hangs

Ensure Docker Desktop is running:

```bash
open -a Docker
# Wait for Docker to start, then retry
npx supabase functions deploy <name> --no-verify-jwt --use-docker
```

### ES256 JWT rejected by edge function

All edge functions must have `verify_jwt = false` in `supabase/config.toml`. Supabase auth tokens use ES256, but the edge function relay only supports HS256 verification. Functions authenticate internally via `supabase.auth.getUser(token)`.

See [[05-Operations/Runbooks/Supabase-Auth]] for details.

---

## Related

- [[docs/00-Index/Home]] — Documentation Hub
- [[02-Architecture/Overview]] — System Architecture
- [[02-Architecture/Tech-Stack]] — Full Dependency Catalog
- [[03-API/Edge-Functions]] — API Reference
- [[05-Operations/Runbooks/Deploy-Edge-Functions]] — Deploy Runbook

---
*Updated: 2026-02-09*
