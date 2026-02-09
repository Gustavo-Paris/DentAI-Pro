---
title: "Runbook: Supabase Auth & JWT Troubleshooting"
created: 2026-02-09
updated: 2026-02-09
owner: Team AURIA
severity: P1
tags:
  - type/runbook
  - status/published
related:
  - "[[docs/00-Index/Home]]"
  - "[[03-API/Edge-Functions]]"
  - "[[05-Operations/Runbooks/Deploy-Edge-Functions]]"
---

# Runbook: Supabase Auth & JWT Troubleshooting

> [!danger] Severity
> **P1** — Auth failures block all authenticated features (AI analysis, billing, patient data).

---

## Overview

AURIA uses Supabase Auth with a non-standard JWT setup. This runbook covers the ES256/HS256 split, common auth failures, and how to diagnose them.

---

## Architecture: How Auth Works

```
┌──────────┐     ES256 JWT      ┌──────────────┐
│  Browser  │──────────────────→ │ Edge Function │
│  (React)  │                    │   (Deno)      │
└──────────┘                    └──────┬───────┘
                                       │
                    verify_jwt=false    │  supabase.auth.getUser(token)
                    (relay skips        │  with SERVICE_ROLE_KEY
                     verification)      │
                                       ↓
                                ┌──────────────┐
                                │   Supabase   │
                                │   Auth API   │
                                └──────────────┘
```

### Key Facts

| Layer | JWT Type | Purpose |
|-------|----------|---------|
| **Auth tokens** (user sessions) | **ES256** | Signed by Supabase Auth (new format) |
| **Anon key** (apikey header) | **HS256** | Project-level public key for PostgREST |
| **Edge function relay** | Expects HS256 | Rejects ES256 unless `verify_jwt = false` |
| **PostgREST** (REST API) | Uses `apikey` header | Not affected by ES256 |

> [!warning] The core issue
> Supabase Auth now issues **ES256** JWTs, but the edge function relay only verifies **HS256**. Without `verify_jwt = false`, all authenticated edge function requests fail with 401.

---

## Symptoms & Diagnosis

### Symptom: 401 on all edge function calls

**Check 1:** Is `verify_jwt = false` set in config?

```bash
# Check config.toml for the function
grep -A2 'functions\.<function-name>' supabase/config.toml
```

Expected output:
```toml
[functions.my-function]
verify_jwt = false
```

**Check 2:** Was it deployed with `--no-verify-jwt`?

Redeploy to be safe:
```bash
npx supabase functions deploy <function-name> --no-verify-jwt --use-docker
```

**Check 3:** Is the function doing internal auth?

All AI/billing functions should have this pattern:
```typescript
const authHeader = req.headers.get("Authorization");
const token = authHeader.replace("Bearer ", "");
const { data, error } = await supabaseAuth.auth.getUser(token);
```

If `getUser` returns an error, the token is expired or invalid (user-side issue, not config).

---

### Symptom: 401 on REST API calls (PostgREST)

REST API uses the `apikey` header (HS256 anon key), not Bearer tokens.

**Check:** Is the frontend sending the correct header?

```typescript
// supabase client config (apps/web/src/integrations/supabase/client.ts)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

The anon key is the `VITE_SUPABASE_PUBLISHABLE_KEY` env var. Verify it matches the project's anon key in Supabase Dashboard → Settings → API.

---

### Symptom: Auth works in dev, fails in production

**Check 1:** Environment variables on Vercel

Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set correctly in Vercel dashboard.

**Check 2:** CORS blocking

Production origins must be in `_shared/cors.ts` allowlist:
- `https://dentai.pro`
- `https://www.dentai.pro`
- `https://auria-ai.vercel.app`
- `https://dentai-pro.vercel.app`

**Check 3:** Supabase auth redirect URLs

In `supabase/config.toml` and Supabase Dashboard → Auth → URL Configuration:
```toml
site_url = "https://auria-ai.vercel.app"
additional_redirect_urls = [
  "https://auria-ai.vercel.app/**",
  "https://dentai-pro.vercel.app/**",
  "http://localhost:3000/**"
]
```

---

### Symptom: "Invalid token" from getUser()

**Possible causes:**

1. **Token expired** — Supabase client should auto-refresh. Check that `supabase.auth.onAuthStateChange` is set up.
2. **Wrong Supabase URL** — Edge function is hitting a different project than the one that issued the token.
3. **Service role key mismatch** — The `SUPABASE_SERVICE_ROLE_KEY` secret must match the project.

**Diagnosis:**

```bash
# Check edge function logs for the exact error
supabase functions logs <function-name> --tail
```

---

## Configuration Reference

### supabase/config.toml — All Functions

Every edge function **must** be listed with `verify_jwt = false`:

```toml
[functions.analyze-dental-photo]
verify_jwt = false

[functions.generate-dsd]
verify_jwt = false

[functions.recommend-resin]
verify_jwt = false

[functions.recommend-cementation]
verify_jwt = false

[functions.stripe-webhook]
verify_jwt = false

[functions.create-checkout-session]
verify_jwt = false

[functions.create-portal-session]
verify_jwt = false

[functions.sync-subscription]
verify_jwt = false
```

> [!danger] Adding a new function?
> You **must** add `verify_jwt = false` to config.toml AND deploy with `--no-verify-jwt`. Forgetting this is the #1 cause of auth failures.

### Auth Configuration

```toml
[auth]
site_url = "https://auria-ai.vercel.app"

[auth.email]
enable_signup = true
enable_confirmations = true
max_frequency = "1m0s"
otp_length = 8

[auth.mfa.totp]
enroll_enabled = true
verify_enabled = true
```

---

## Resolution Steps

### Fix: Function returning 401 for valid tokens

1. **Verify config.toml:**
   ```bash
   grep -A1 'functions\.<name>' supabase/config.toml
   ```
   Must show `verify_jwt = false`.

2. **Redeploy:**
   ```bash
   npx supabase functions deploy <name> --no-verify-jwt --use-docker
   ```

3. **Test:**
   ```bash
   # Get a fresh token from browser DevTools → Application → Supabase auth
   curl -i -X POST \
     'https://<project>.supabase.co/functions/v1/<name>' \
     -H 'Authorization: Bearer <token>' \
     -H 'Content-Type: application/json' \
     -d '{}'
   ```

4. **Verify response** is not 401.

### Fix: New function not authenticating

Follow the [[05-Operations/Runbooks/Deploy-Edge-Functions#Adding a New Function]] checklist completely.

### Fix: Token refresh not working

Check the Supabase client setup in `apps/web/src/integrations/supabase/client.ts`:

```typescript
const supabase = createClient(url, anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
```

All three auth options should be `true` (they are by default).

---

## Escalation

| Level | Contact | When |
|-------|---------|------|
| L1 | On-call dev | First response — check config & redeploy |
| L2 | Team lead | After 30 min — may need Supabase Dashboard access |
| L3 | Supabase support | If `getUser` fails for valid tokens (platform issue) |

---

## Related

- [[docs/00-Index/Home]] — Documentation Hub
- [[03-API/Edge-Functions]] — API Reference
- [[05-Operations/Runbooks/Deploy-Edge-Functions]] — Deploy Runbook
- [[04-Development/Setup-Guide]] — Developer Setup

---
*Updated: 2026-02-09*
