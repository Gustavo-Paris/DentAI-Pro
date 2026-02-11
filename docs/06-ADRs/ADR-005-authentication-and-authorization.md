---
title: "ADR-005: Authentication & Authorization"
adr_id: ADR-005
created: 2026-02-10
updated: 2026-02-10
status: accepted
deciders: Team AURIA
tags:
  - type/adr
  - status/accepted
  - domain/backend
  - domain/security
related:
  - "[[ADR-004-credit-model-and-monetization]]"
  - "[[docs/00-Index/Home]]"
---

# ADR-005: Authentication & Authorization

## Status

**Accepted** (2026-02-10)

## Context

AURIA handles sensitive clinical data (dental photos, patient information, treatment plans). The authentication and authorization strategy must:

1. **Support multiple auth methods** -- email/password, Google OAuth, and magic link for convenience.
2. **Secure edge functions** -- AI edge functions process clinical photos and return treatment protocols; they must verify the caller's identity.
3. **Handle ES256 JWT tokens** -- Supabase Auth switched from HS256 to ES256 for user JWTs, which broke the default `verify_jwt` gateway in edge functions.
4. **Enforce data isolation** -- Users must only access their own data (evaluations, patients, photos).
5. **Support idle timeout** -- Clinical workstations should auto-logout after inactivity for patient privacy.

## Decision

### Supabase Auth as Identity Provider

Use Supabase Auth for all authentication, with the following methods:

| Method | Implementation |
|--------|---------------|
| Email + Password | `supabase.auth.signUp()` / `supabase.auth.signInWithPassword()` |
| Google OAuth | `supabase.auth.signInWithOAuth({ provider: 'google' })` |
| Magic Link | Configured via Supabase dashboard |

The `AuthContext` (`apps/web/src/contexts/AuthContext.tsx`) provides `user`, `session`, `loading`, and auth actions to all components:

```typescript
const { user, session, signIn, signUp, signInWithGoogle, signOut } = useAuth();
```

### User Registration with Professional Metadata

Sign-up captures dental professional metadata (`full_name`, `cro` -- the Brazilian dental license number) via `options.data`:

```typescript
await supabase.auth.signUp({
  email, password,
  options: { data: { full_name: fullName, cro: cro || null } },
});
```

### `verify_jwt = false` Pattern for Edge Functions

> [!warning] Critical Architecture Decision
> ALL Supabase Edge Functions use `verify_jwt = false` in `supabase/config.toml` and are deployed with `--no-verify-jwt`. This is **not** a security bypass -- it is required because Supabase Auth issues ES256 JWTs, but the edge function relay only validates HS256 JWTs.

Every edge function performs its own authentication using the service role key:

```typescript
// 1. Extract Bearer token
const authHeader = req.headers.get("Authorization");
if (!authHeader?.startsWith("Bearer ")) {
  return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 401, corsHeaders);
}

// 2. Create service role client (can verify any JWT algorithm)
const supabaseService = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

// 3. Verify user via getUser() -- works with ES256 tokens
const token = authHeader.replace("Bearer ", "");
const { data: { user }, error: authError } = await supabaseService.auth.getUser(token);
```

This pattern is consistent across all 10 edge functions listed in `supabase/config.toml`:

```toml
[functions.recommend-resin]
verify_jwt = false

[functions.analyze-dental-photo]
verify_jwt = false

[functions.generate-dsd]
verify_jwt = false

# ... (all 10 functions)
```

### Resource Ownership Verification

Beyond authentication, edge functions verify that the authenticated user owns the resource they are operating on:

```typescript
// In recommend-resin: verify user owns the evaluation
if (data.userId !== userId) {
  return createErrorResponse(ERROR_MESSAGES.ACCESS_DENIED, 403, corsHeaders);
}

// In generate-dsd: verify evaluation ownership
const { data: ownerCheck } = await supabase
  .from("evaluations")
  .select("user_id")
  .eq("id", evaluationId)
  .single();
if (ownerCheck.user_id !== user.id) {
  return createErrorResponse(ERROR_MESSAGES.ACCESS_DENIED, 403, corsHeaders);
}
```

### Row-Level Security (RLS)

Supabase RLS policies enforce data isolation at the database level. The frontend Supabase client operates with the user's JWT, so RLS policies automatically scope queries to `auth.uid() = user_id`.

The service role client in edge functions bypasses RLS (necessary for admin operations like credit deduction and cross-user queries), but always verifies ownership in application code.

### Idle Timeout

The `AuthContext` implements a 30-minute idle timeout:

```typescript
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// Reset timer on user activity
const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
events.forEach(e => document.addEventListener(e, resetIdleTimer, { passive: true }));

// Auto sign-out after timeout
idleTimerRef.current = setTimeout(() => {
  supabase.auth.signOut();
}, IDLE_TIMEOUT_MS);
```

### Auth Configuration

Key settings in `supabase/config.toml`:

```toml
[auth]
site_url = "https://auria-ai.vercel.app"
additional_redirect_urls = ["https://auria-ai.vercel.app/**", "http://localhost:3000/**"]

[auth.mfa.totp]
enroll_enabled = true
verify_enabled = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = true
```

> [!info] MFA Support
> TOTP-based MFA is enabled at the Supabase level (`enroll_enabled = true`). This is available for users who want additional security for their clinical data.

## Alternatives Considered

### 1. Keep Default `verify_jwt = true`

- **Pros:** Simpler deployment, no custom auth code in each function
- **Cons:** Breaks with ES256 tokens -- all authenticated requests would be rejected
- **Rejected because:** Supabase Auth uses ES256 JWTs, which the relay gateway cannot verify. This is a known Supabase limitation.

### 2. External Auth Provider (Auth0, Clerk)

- **Pros:** More features (social logins, organization management)
- **Cons:** Additional cost, integration complexity, separate user management
- **Rejected because:** Supabase Auth is tightly integrated with RLS, storage policies, and edge functions. Using an external provider would require building custom middleware.

### 3. Custom JWT Validation in Edge Functions

- **Pros:** Could validate ES256 tokens directly
- **Cons:** Requires importing crypto libraries in Deno, maintaining key rotation, duplicating Supabase Auth's validation logic
- **Rejected because:** `supabase.auth.getUser(token)` already handles all validation server-side. It is simpler and more maintainable.

## Consequences

### Positive

- **Works with ES256** -- The `getUser()` approach is algorithm-agnostic.
- **Consistent pattern** -- All edge functions follow the same auth pattern, making it easy to add new functions.
- **Defense in depth** -- RLS at the DB level + ownership checks in application code + auth in each function.
- **Idle safety** -- Auto-logout protects patient data on unattended workstations.

### Negative

- **Boilerplate** -- Every edge function has ~15 lines of identical auth code.
- **Service role key exposure** -- Each function uses `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS. A bug in ownership checks could expose other users' data.
- **`verify_jwt = false` confusion** -- New contributors might assume functions are unprotected.

### Risks

- **Service role key compromise** -- Mitigated by keeping it only in Supabase environment variables (never in client code).
- **Ownership check gaps** -- Mitigated by consistent patterns and the fact that most data access goes through the user-scoped frontend client (with RLS).

## Implementation

Key files:

- `apps/web/src/contexts/AuthContext.tsx` -- Frontend auth context with idle timeout
- `supabase/config.toml` -- Edge function JWT verification config
- `supabase/functions/_shared/cors.ts` -- Shared CORS and error response helpers
- All edge functions in `supabase/functions/*/index.ts` -- Per-function auth verification

## Links

- [[ADR-004-credit-model-and-monetization]] -- Credit system uses the same auth pattern
- [[ADR-006-ai-integration-strategy]] -- AI functions implement this auth pattern
- [[ADR-Index]] -- ADR Index

---
*Created: 2026-02-10 | Last updated: 2026-02-10*
