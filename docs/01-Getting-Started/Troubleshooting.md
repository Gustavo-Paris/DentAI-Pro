---
title: Troubleshooting
created: 2026-02-09
updated: 2026-02-09
author: Team AURIA
status: published
tags:
  - type/guide
  - status/published
related:
  - "[[docs/00-Index/Home]]"
  - "[[04-Development/Setup-Guide]]"
  - "[[05-Operations/Runbooks/Deploy-Edge-Functions]]"
  - "[[05-Operations/Runbooks/Supabase-Auth]]"
---

# Troubleshooting

Common issues, known limitations, and solutions for AURIA development.

---

## Build & Dev Server

### `pnpm install` fails

```bash
# Clear cache and retry
pnpm store prune
rm -rf node_modules
pnpm install
```

If you see `ERR_PNPM_INVALID_WORKSPACE`, check `pnpm-workspace.yaml` includes all workspace paths.

> [!warning] pnpm only
> Never use `npm` or `yarn`. The `packageManager` field in `package.json` locks pnpm to 9.15.4.

---

### Port 8080 already in use

Vite dev server binds to `[::]` (IPv6) port 8080.

```bash
lsof -ti:8080 | xargs kill -9
pnpm dev
```

---

### `@pageshell/shell` build error (DTS)

**Known issue.** Pre-existing DTS error in `@pageshell/shell`. Does not affect `apps/web` development — the shell package is consumed via the `page-shell` barrel which bypasses this build step.

**Action:** Ignore. Not a blocker.

---

### Large chunk warnings during build

Intentional. These chunks are lazy-loaded and suppressed via `chunkSizeWarningLimit: 600` in `vite.config.ts`:

| Chunk | Reason |
|-------|--------|
| `jspdf` | PDF generation (on-demand) |
| `heic-to` | HEIC image conversion (on-demand) |
| `recharts` | Dashboard charts (dashboard route only) |

**Action:** Ignore. Already optimized with code splitting.

---

### Turborepo build order issues

`build`, `lint`, `test`, and `type-check` all depend on `^build` (upstream packages built first). If a package build fails, downstream tasks will also fail.

```bash
# Debug build order
pnpm turbo run build --dry-run

# Build a specific package
pnpm turbo run build --filter=@pageshell/core
```

---

## TypeScript

### Strict mode errors in packages

Packages use **stricter** TypeScript than the web app:

| Setting | Web App | Packages |
|---------|---------|----------|
| `strict` | true | true |
| `noUncheckedIndexedAccess` | - | true |
| `noImplicitOverride` | - | true |
| `verbatimModuleSyntax` | - | true |

Code that compiles in `apps/web` may fail in packages. Always check the package's `tsconfig.json`.

---

### Deno type errors in edge functions

**Known issue.** Edge functions have pre-existing type errors in shared dependencies (`_shared/credits.ts:103` cast, etc.). These are Deno-specific and don't affect function behavior.

**Key Deno gotcha:** `withMetrics<T>` needs explicit type parameter — Deno's inference doesn't work across curried function boundaries.

```typescript
// WRONG — Deno can't infer T
const result = await withMetrics(fn)(args);

// CORRECT — explicit type param
const result = await withMetrics<ResponseType>(fn)(args);
```

---

## Edge Functions

### 401 Unauthorized on all edge function requests

**Root cause:** Missing `verify_jwt = false` in `supabase/config.toml`.

Supabase auth tokens use ES256, but the edge function relay only verifies HS256. All functions must have `verify_jwt = false` and be deployed with `--no-verify-jwt`.

**Fix:** See [[05-Operations/Runbooks/Supabase-Auth]] for full diagnosis and resolution.

---

### Edge function deploy hangs

**Root cause:** Docker Desktop not running.

```bash
open -a Docker
# Wait ~30s for Docker to initialize
npx supabase functions deploy <name> --no-verify-jwt --use-docker
```

See [[05-Operations/Runbooks/Deploy-Edge-Functions]] for full deploy procedures.

---

### Import errors in Deno edge functions

Edge functions run Deno — can't use pnpm workspace packages or bare imports.

```typescript
// CORRECT — relative path with .ts extension
import { corsHeaders } from "../_shared/cors.ts";

// WRONG — bare import (Node.js style)
import { corsHeaders } from "@shared/cors";
```

**CDN imports:** All `esm.sh` imports have been migrated to `jsr:` (supabase-js) and `npm:` (stripe) due to esm.sh CDN unreliability.

```typescript
// CORRECT
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14";

// WRONG — unreliable
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
```

---

### Gemini returns English enum values instead of Portuguese

**Known issue.** The AI sometimes returns English values (`"anterior-superior"`, `"high"`) instead of Portuguese (`"anterior-superior"`, `"alta"`).

**Fix:** Always normalize enums on both backend AND frontend, close to where the value is first obtained. Don't assume Gemini will follow the prompt language consistently.

---

### Edge function returns 500

**Diagnosis:**

```bash
# Check function logs
supabase functions logs <function-name> --tail

# Test with curl
curl -i -X POST \
  'https://<project-id>.supabase.co/functions/v1/<function-name>' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Common causes:
1. Missing secret (`GOOGLE_AI_API_KEY`, `STRIPE_SECRET_KEY`) — check `supabase secrets list`
2. Gemini API rate limit — function logs will show 429 from Google
3. Invalid request body — function logs will show validation error

---

## Supabase & Database

### Credit race condition

**Known issue (mitigated).** The credit system uses `SELECT FOR UPDATE` row locking (migration 014) to prevent race conditions. If you see duplicate credit deductions, check that the `use_credits()` RPC is using the latest version with row locking.

---

### RLS blocking queries

All user-scoped tables require `auth.uid() = user_id`. Common gotchas:

1. **Missing auth context** — Ensure the Supabase client is initialized with the user's JWT
2. **Service role needed** — Edge functions that modify other users' data (webhooks) must use the service role client
3. **Public tables** — `resins`, `resin_catalog`, `subscription_plans`, `credit_costs` are public read

---

### PHI encryption not working

PHI encryption requires a Vault key. If the key isn't set, the trigger degrades gracefully (stores plaintext only).

Check Vault key:
```sql
SELECT * FROM vault.secrets WHERE name = 'phi_encryption_key';
```

---

## Frontend

### CORS errors calling edge functions

Allowed origins are defined in `supabase/functions/_shared/cors.ts`:

**Production:** `dentai.pro`, `www.dentai.pro`, `auria-ai.vercel.app`, `dentai-pro.vercel.app`, `*.dentai.pro`
**Development:** `localhost:*`, `127.0.0.1:*`

If deploying to a new domain, update `_shared/cors.ts` and redeploy all functions.

---

### CSP blocking external resources

Vercel serves strict Content-Security-Policy headers. Allowed external sources:

| Directive | Allowed |
|-----------|---------|
| `script-src` | `self`, `unsafe-inline`, `js.stripe.com` |
| `connect-src` | `self`, `*.supabase.co`, `wss://*.supabase.co`, `generativelanguage.googleapis.com`, `api.stripe.com` |
| `frame-src` | `self`, `js.stripe.com` |
| `img-src` | `self`, `data:`, `blob:`, `*.supabase.co` |

If you need to add a new external service, update the CSP in `vercel.json`.

---

### ESLint architecture violation

The ESLint config enforces the 3-layer architecture:

```
Pages (src/pages/) ──✗──→ @/integrations/supabase/*
Domain Hooks (src/hooks/domain/) ──✗──→ @/integrations/supabase/*
```

Pages and domain hooks **cannot** import directly from Supabase. All data access must go through `src/data/`.

**Exceptions** (configured in `eslint.config.js`): Auth pages (Login, Register, ForgotPassword, ResetPassword), SharedEvaluation, and useWizardFlow (legitimate storage/edge function needs).

---

### `const` declarations in loops — TDZ bugs

**Lesson learned.** `const` declarations inside loops can cause Temporal Dead Zone bugs if used before declaration. Move normalization logic close to where the value is first obtained.

```typescript
// BUG — normalizedValue used before const declaration
for (const item of items) {
  doSomething(normalizedValue); // TDZ error
  const normalizedValue = normalize(item.value);
}

// FIX — declare before use
for (const item of items) {
  const normalizedValue = normalize(item.value);
  doSomething(normalizedValue);
}
```

---

## CI/CD

### CI fails but local passes

Common causes:

1. **Missing env vars** — CI uses placeholder Supabase URLs. If your code requires real API calls at build time, it will fail.
2. **Dependency not installed** — CI runs `pnpm install --frozen-lockfile`. If you changed dependencies, commit `pnpm-lock.yaml`.
3. **Build order** — CI builds all packages topologically. A package you never build locally might fail.

```bash
# Reproduce CI locally
pnpm install --frozen-lockfile
pnpm turbo run lint
pnpm turbo run type-check
pnpm turbo run test
pnpm turbo run build
```

---

### Vercel preview deploy fails

Check Vercel build command matches: `pnpm turbo run build --filter=@dentai/web`

Output directory must be `apps/web/dist` (not `dist` or `build`).

---

## Related

- [[docs/00-Index/Home]] — Documentation Hub
- [[04-Development/Setup-Guide]] — Environment Setup
- [[04-Development/Testing-Guide]] — Testing Conventions
- [[05-Operations/Runbooks/Deploy-Edge-Functions]] — Deploy Runbook
- [[05-Operations/Runbooks/Supabase-Auth]] — Auth Runbook

---
*Updated: 2026-02-09*
