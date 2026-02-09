---
title: "Runbook: Deploy Edge Functions"
created: 2026-02-09
updated: 2026-02-09
owner: Team AURIA
severity: P2
tags:
  - type/runbook
  - status/published
related:
  - "[[docs/00-Index/Home]]"
  - "[[03-API/Edge-Functions]]"
  - "[[05-Operations/Runbooks/Supabase-Auth]]"
---

# Runbook: Deploy Edge Functions

> [!warning] Severity
> **P2** — Incorrect deployment can break AI analysis and billing for all users.

---

## Overview

Deploy Supabase Edge Functions (Deno runtime) for AURIA. Covers single-function and full deploys, secret management, and common failure modes.

---

## Prerequisites

- Supabase CLI installed (`npm install -g supabase`)
- Logged in (`supabase login`)
- Project linked (`supabase link --project-ref <project-id>`)
- Docker Desktop **running** (required for `--use-docker`)

---

## Deploy a Single Function

```bash
# 1. Ensure Docker is running
open -a Docker

# 2. Deploy (ALWAYS use both flags)
npx supabase functions deploy <function-name> --no-verify-jwt --use-docker
```

> [!danger] Both flags are mandatory
> - `--no-verify-jwt`: Required because auth tokens use ES256 (edge relay only supports HS256)
> - `--use-docker`: Required for local bundling (avoids remote bundler timeouts)

### Example: Deploy analyze-dental-photo

```bash
npx supabase functions deploy analyze-dental-photo --no-verify-jwt --use-docker
```

---

## Deploy All Functions

```bash
# Deploy every function in supabase/functions/
npx supabase functions deploy --no-verify-jwt --use-docker
```

This deploys all 8 functions:

| Function | Type |
|----------|------|
| `analyze-dental-photo` | AI |
| `generate-dsd` | AI |
| `recommend-resin` | AI |
| `recommend-cementation` | AI |
| `stripe-webhook` | Billing |
| `create-checkout-session` | Billing |
| `create-portal-session` | Billing |
| `sync-subscription` | Billing |

---

## Adding a New Function

When creating a new edge function, follow **all** steps:

### 1. Create the function

```bash
supabase functions new my-new-function
```

### 2. Add to config.toml

```toml
# supabase/config.toml — ADD THIS BLOCK
[functions.my-new-function]
verify_jwt = false
```

> [!danger] Missing config = 401 errors
> If you skip this step, the edge function relay will reject ES256 JWTs and all authenticated requests will fail with 401.

### 3. Use relative imports with `.ts` extensions

Edge functions run Deno — no pnpm workspace packages, no bare imports:

```typescript
// CORRECT
import { corsHeaders } from "../_shared/cors.ts";

// WRONG — will fail in Deno
import { corsHeaders } from "@shared/cors";
```

### 4. Deploy with both flags

```bash
npx supabase functions deploy my-new-function --no-verify-jwt --use-docker
```

### 5. Verify

```bash
curl -X POST \
  'https://<project-id>.supabase.co/functions/v1/my-new-function' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

---

## Manage Secrets

```bash
# Set a secret
supabase secrets set KEY=value

# Set multiple
supabase secrets set GOOGLE_AI_API_KEY=xxx STRIPE_SECRET_KEY=yyy

# List all secrets
supabase secrets list

# Unset a secret
supabase secrets unset KEY
```

### Required Secrets

| Secret | Used By | How to Get |
|--------|---------|------------|
| `GOOGLE_AI_API_KEY` | AI functions | [Google AI Studio](https://aistudio.google.com/apikey) |
| `STRIPE_SECRET_KEY` | Billing functions | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) → Secret key |
| `STRIPE_WEBHOOK_SECRET` | stripe-webhook | Stripe Dashboard → Webhooks → Signing secret |

**Auto-injected** (no setup needed): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`.

---

## Troubleshooting

### Deploy hangs or times out

**Cause:** Docker Desktop not running.

```bash
# Start Docker
open -a Docker
# Wait ~30s for Docker to initialize, then retry
npx supabase functions deploy <name> --no-verify-jwt --use-docker
```

### 401 Unauthorized on all requests

**Cause:** Missing `verify_jwt = false` in `config.toml`.

**Fix:**

1. Add to `supabase/config.toml`:
   ```toml
   [functions.my-function]
   verify_jwt = false
   ```
2. Redeploy:
   ```bash
   npx supabase functions deploy my-function --no-verify-jwt --use-docker
   ```

See [[05-Operations/Runbooks/Supabase-Auth]] for full auth troubleshooting.

### Import error in Deno

**Cause:** Using bare imports instead of relative `.ts` imports, or using pnpm workspace packages.

**Fix:** Edge functions must use relative imports:

```typescript
// Use this
import { foo } from "../_shared/module.ts";

// NOT this
import { foo } from "@shared/module";
```

### esm.sh CDN errors

**Cause:** esm.sh CDN can be unreliable.

**Fix:** Use `jsr:` or `npm:` specifiers instead:

```typescript
// Use JSR for Supabase
import { createClient } from "jsr:@supabase/supabase-js@2";

// Use npm: for Stripe
import Stripe from "npm:stripe@14";
```

### Remote bundler timeout (without --use-docker)

**Cause:** Large function bundles timeout on Supabase's remote bundler.

**Fix:** Always use `--use-docker` for local bundling.

### Function deployed but not working

**Diagnosis steps:**

```bash
# 1. Check function logs
supabase functions logs <function-name> --tail

# 2. Test with curl
curl -i -X POST \
  'https://<project-id>.supabase.co/functions/v1/<function-name>' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json'

# 3. Verify config.toml has the function listed
grep -A1 'functions.<function-name>' supabase/config.toml
```

---

## Rollback

### Rollback to previous version

Supabase doesn't have built-in function versioning. Rollback via git:

```bash
# 1. Find the last working commit
git log --oneline -- supabase/functions/<function-name>/

# 2. Restore files
git checkout <commit-hash> -- supabase/functions/<function-name>/

# 3. Redeploy
npx supabase functions deploy <function-name> --no-verify-jwt --use-docker
```

### Disable a function (emergency)

There is no built-in disable command. Options:

1. Deploy a version that returns 503 immediately
2. Remove CORS headers so frontend requests fail at preflight

---

## Post-Deploy Checklist

- [ ] Function responds to health check / test request
- [ ] Auth works (valid token → 200, invalid → 401)
- [ ] CORS allows production origin (`dentai.pro`)
- [ ] Rate limiting active (if AI function)
- [ ] Credits consumed correctly (if applicable)
- [ ] Logs visible in `supabase functions logs`

---

## Related

- [[docs/00-Index/Home]] — Documentation Hub
- [[03-API/Edge-Functions]] — API Reference
- [[05-Operations/Runbooks/Supabase-Auth]] — Auth Troubleshooting
- [[04-Development/Setup-Guide]] — Developer Setup

---
*Updated: 2026-02-09*
