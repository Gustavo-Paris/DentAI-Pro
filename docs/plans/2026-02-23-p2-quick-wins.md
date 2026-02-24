---
title: P2 Quick Wins — Implementation Plan
created: 2026-02-23
updated: 2026-02-23
status: draft
tags:
  - type/plan
  - status/draft
---

# P2 Quick Wins — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve 9 high-value P2 items from the production readiness audit — security hardening, clinical validation, error resilience, and observability.

**Architecture:** Incremental fixes, independently deployable. No schema-breaking changes.

**Tech Stack:** React 18 + TypeScript, Vite, Supabase Edge Functions (Deno), Zod, Sentry, PostgreSQL.

---

## Task 1: Sanitize PII from Production Logs

**Fixes:** SEC-P2-5

**Files:**
- Modify: `supabase/functions/_shared/logger.ts`
- Modify: `supabase/functions/delete-account/index.ts:78,88`

**Step 1: Add email sanitization to logger**

In `logger.ts`, add a helper that redacts emails before logging:

```typescript
function sanitize(msg: string): string {
  return msg.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[REDACTED_EMAIL]',
  );
}
```

Apply `sanitize()` inside each logger method (`log`, `warn`, `error`, `important`) before passing to `console.*`.

**Step 2: Remove explicit email from delete-account logs**

```typescript
// BEFORE (line 78):
logger.important(`[${reqId}] Account deletion confirmed for user ${userId} (${user.email})`);
// AFTER:
logger.important(`[${reqId}] Account deletion confirmed for user ${userId}`);

// BEFORE (line 88):
logger.log(`[${reqId}] Account-deleted email sent to ${user.email}`);
// AFTER:
logger.log(`[${reqId}] Account-deleted email sent to user ${userId}`);
```

**Step 3: Search for other PII leaks**

Grep all edge functions for `user.email`, `.email`, `userEmail` in logger calls. Fix any others found.

**Step 4: Commit**

```bash
git add supabase/functions/_shared/logger.ts supabase/functions/
git commit -m "fix: sanitize PII (emails) from production logs (LGPD)"
```

---

## Task 2: Remove Internal Table Names from delete-account Response

**Fixes:** SEC-P2-6

**Files:**
- Modify: `supabase/functions/delete-account/index.ts:314-322`

**Step 1: Strip deletionLog from the API response**

The `deletionLog` array exposes 19 internal table names. Keep it for server-side logging but remove from the response:

```typescript
// BEFORE (lines 314-322):
return new Response(JSON.stringify({
  success: deletionErrors.length === 0,
  message: deletionErrors.length === 0
    ? 'Conta excluída com sucesso.'
    : `Conta parcialmente excluída. ${deletionErrors.length} erro(s).`,
  deleted: deletionLog,
}), ...);

// AFTER:
// Log full details server-side
logger.important(`[${reqId}] Deletion complete: ${deletionLog.join(', ')}`);

return new Response(JSON.stringify({
  success: deletionErrors.length === 0,
  message: deletionErrors.length === 0
    ? 'Conta excluída com sucesso.'
    : 'Conta parcialmente excluída. Entre em contato com o suporte.',
}), ...);
```

**Step 2: Commit**

```bash
git add supabase/functions/delete-account/index.ts
git commit -m "fix: remove internal table names from delete-account response"
```

---

## Task 3: Strip Internal Details from health-check Response

**Fixes:** SEC-P2-2

**Files:**
- Modify: `supabase/functions/health-check/index.ts:214-220`

**Step 1: Restrict Gemini details to authenticated requests only**

The health-check endpoint is public. The basic health response (`status`, `db`, `latency_ms`, `timestamp`) is fine. But Gemini test results (model names, API endpoints, response bodies) should only be returned when the request includes a valid service-role auth header.

```typescript
// BEFORE:
const responseBody = {
  status: dbOk ? "ok" : "degraded",
  db: dbOk,
  latency_ms: latencyMs,
  timestamp: new Date().toISOString(),
  ...(Object.keys(geminiResult).length > 0 && { gemini: geminiResult }),
};

// AFTER:
const isServiceRole = req.headers.get('authorization')?.includes('service_role') ||
  req.headers.get('apikey') === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const responseBody = {
  status: dbOk ? "ok" : "degraded",
  db: dbOk,
  latency_ms: latencyMs,
  timestamp: new Date().toISOString(),
  ...(isServiceRole && Object.keys(geminiResult).length > 0 && { gemini: geminiResult }),
};
```

If service_role auth isn't simple to check, alternatively just return Gemini as a boolean:
```typescript
...(Object.keys(geminiResult).length > 0 && {
  gemini: { ok: !Object.values(geminiResult).some((v: any) => v?.error) },
}),
```

**Step 2: Commit**

```bash
git add supabase/functions/health-check/index.ts
git commit -m "fix: strip internal details from public health-check response"
```

---

## Task 4: Fix Case-Insensitive Error Filter

**Fixes:** ERR-P2-6

**Files:**
- Modify: `apps/web/src/lib/errorHandler.ts:41-52`

**Step 1: Enforce lowercase at the function boundary**

The function receives `lowerMsg` but doesn't guarantee it's actually lowercase. Add defensive `.toLowerCase()` inside the function:

```typescript
// BEFORE:
function containsSensitiveInfo(lowerMsg: string): boolean {
  const sensitivePatterns = [
    'sql', 'select ', 'insert ', 'update ', 'delete from',
    ...
  ];
  return sensitivePatterns.some(p => lowerMsg.includes(p));
}

// AFTER:
function containsSensitiveInfo(msg: string): boolean {
  const lower = msg.toLowerCase();
  const sensitivePatterns = [
    'sql', 'select ', 'insert ', 'update ', 'delete from',
    'relation ', 'column ', 'constraint', 'violates',
    'stack', 'trace', 'at ', '/src/', '/node_modules/',
    'econnrefused', 'enotfound', 'etimedout',
    'supabase', 'postgres', 'deno', 'edge function',
    'secret', 'key', 'password', 'credential',
  ];
  return sensitivePatterns.some(p => lower.includes(p));
}
```

Also remove redundant `.toLowerCase()` calls at all call sites (line 125, etc.) since the function now handles it internally.

**Step 2: Commit**

```bash
git add apps/web/src/lib/errorHandler.ts
git commit -m "fix: error filter — enforce case-insensitive at function boundary"
```

---

## Task 5: PDF Export — Promise.allSettled for Image Resilience

**Fixes:** ERR-P2-4

**Files:**
- Modify: `apps/web/src/hooks/domain/useResult.ts:287-292`

**Step 1: Replace Promise.all with Promise.allSettled**

```typescript
// BEFORE:
const [photoFrontalBase64, photo45Base64, photoFaceBase64, dsdSimBase64] = await Promise.all([
  photoUrls.frontal ? fetchImageAsBase64(photoUrls.frontal) : Promise.resolve(null),
  photoUrls.angle45 ? fetchImageAsBase64(photoUrls.angle45) : Promise.resolve(null),
  photoUrls.face ? fetchImageAsBase64(photoUrls.face) : Promise.resolve(null),
  dsdSimulationUrl ? fetchImageAsBase64(dsdSimulationUrl) : Promise.resolve(null),
]);

// AFTER:
const imageResults = await Promise.allSettled([
  photoUrls.frontal ? fetchImageAsBase64(photoUrls.frontal) : Promise.resolve(null),
  photoUrls.angle45 ? fetchImageAsBase64(photoUrls.angle45) : Promise.resolve(null),
  photoUrls.face ? fetchImageAsBase64(photoUrls.face) : Promise.resolve(null),
  dsdSimulationUrl ? fetchImageAsBase64(dsdSimulationUrl) : Promise.resolve(null),
]);

const [photoFrontalBase64, photo45Base64, photoFaceBase64, dsdSimBase64] = imageResults.map(
  (r) => (r.status === 'fulfilled' ? r.value : null),
);
```

PDF generation continues with `null` for any failed images — the PDF template should already handle null images by omitting that section.

**Step 2: Commit**

```bash
git add apps/web/src/hooks/domain/useResult.ts
git commit -m "fix: PDF export — use Promise.allSettled so single image failure doesn't block"
```

---

## Task 6: FDI Regex — Restrict to Permanent Teeth Only

**Fixes:** CLIN-P2-3

**Files:**
- Modify: `supabase/functions/recommend-cementation/index.ts:58`

**Step 1: Replace regex with permanent-teeth-only pattern**

Cementation protocols are for permanent teeth. The application uses FDI notation where:
- Quadrants 1-4 = permanent teeth (positions 1-8)
- Quadrants 5-8 = deciduous teeth (positions 1-5 only)

Since cementation is for permanent teeth only:

```typescript
// BEFORE:
const FDI_TOOTH_REGEX = /^[1-8][1-8]$/;

// AFTER:
const FDI_TOOTH_REGEX = /^[1-4][1-8]$/;
```

This restricts to quadrants 1-4 only (permanent teeth), matching the FDI validation in `generate-dsd/post-processing.ts` which already uses `/^[1-4][1-8]$/`.

**Step 2: Also check recommend-resin for the same issue**

Search `supabase/functions/recommend-resin/` for FDI regex patterns and apply the same fix if needed.

**Step 3: Commit**

```bash
git add supabase/functions/recommend-cementation/ supabase/functions/recommend-resin/
git commit -m "fix: FDI regex — restrict to permanent teeth only (quadrants 1-4)"
```

---

## Task 7: tooth_bounds Schema — Add 0-100 Percentage Validation

**Fixes:** CLIN-P2-5

**Files:**
- Modify: `supabase/functions/_shared/aiSchemas.ts:68-75`

**Step 1: Add min/max constraints to ToothBoundsSchema**

```typescript
// BEFORE:
const ToothBoundsSchema = z
  .object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  })
  .passthrough();

// AFTER:
const ToothBoundsSchema = z
  .object({
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
    width: z.number().min(0).max(100),
    height: z.number().min(0).max(100),
  })
  .passthrough();
```

This prevents AI hallucinations where bounds exceed valid percentage ranges. Values outside 0-100 would cause rendering issues in the DSD overlay.

**Step 2: Commit**

```bash
git add supabase/functions/_shared/aiSchemas.ts
git commit -m "fix: tooth_bounds — add 0-100 percentage validation to prevent AI hallucination"
```

---

## Task 8: Add Partial Index for Non-Completed Evaluations

**Fixes:** DATA-P2-2

**Files:**
- Create: `supabase/migrations/041_evaluation_partial_indexes.sql`

**Step 1: Create migration with partial index**

```sql
-- ===========================================
-- Migration 041: Partial Indexes for Evaluations
-- ===========================================
-- Optimize common queries that filter by non-completed status.
-- Dashboard and list views frequently query analyzing/draft evaluations.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evaluations_raw_user_pending
  ON public.evaluations_raw(user_id, created_at DESC)
  WHERE status IN ('draft', 'analyzing');

-- Index for recent evaluations (dashboard metrics)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evaluations_raw_user_recent
  ON public.evaluations_raw(user_id, created_at DESC)
  WHERE created_at > NOW() - INTERVAL '30 days';
```

NOTE: `CREATE INDEX CONCURRENTLY` cannot run inside a transaction. If `supabase db push` wraps migrations in transactions, remove `CONCURRENTLY` and accept the brief lock.

**Step 2: Commit**

```bash
git add supabase/migrations/041_evaluation_partial_indexes.sql
git commit -m "feat: add partial indexes for non-completed evaluations (performance)"
```

---

## Task 9: Sentry Source Maps Upload

**Fixes:** INFRA-P2-7

**Files:**
- Modify: `apps/web/vite.config.ts`
- Modify: `apps/web/package.json` (via pnpm add)

**Step 1: Install Sentry Vite plugin**

```bash
pnpm --filter web add -D @sentry/vite-plugin
```

**Step 2: Configure in vite.config.ts**

```typescript
import { sentryVitePlugin } from '@sentry/vite-plugin';

// In plugins array (production only):
...(process.env.SENTRY_AUTH_TOKEN ? [
  sentryVitePlugin({
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    sourcemaps: {
      filesToDeleteAfterUpload: ['**/*.map'],
    },
  }),
] : []),
```

**Step 3: Enable source maps in build config**

```typescript
// In build config:
build: {
  sourcemap: true, // or 'hidden' to avoid exposing .map files in prod
  ...
}
```

Use `sourcemap: 'hidden'` to generate source maps for Sentry upload but not serve them publicly.

**Step 4: Add env vars to Vercel**

Document that the following env vars are needed in Vercel:
- `SENTRY_AUTH_TOKEN` — from Sentry dashboard (Settings > Auth Tokens)
- `SENTRY_ORG` — Sentry organization slug
- `SENTRY_PROJECT` — Sentry project slug

**Step 5: Commit**

```bash
git add apps/web/vite.config.ts apps/web/package.json pnpm-lock.yaml
git commit -m "feat: upload source maps to Sentry on production builds"
```

---

## Tracking Matrix

| Task | Finding | Phase | Files | Effort |
|------|---------|-------|-------|--------|
| 1 | SEC-P2-5 | Security | logger.ts, delete-account | 10 min |
| 2 | SEC-P2-6 | Security | delete-account | 5 min |
| 3 | SEC-P2-2 | Security | health-check | 5 min |
| 4 | ERR-P2-6 | Error | errorHandler.ts | 5 min |
| 5 | ERR-P2-4 | Error | useResult.ts | 5 min |
| 6 | CLIN-P2-3 | Clinical | recommend-cementation | 5 min |
| 7 | CLIN-P2-5 | Clinical | aiSchemas.ts | 5 min |
| 8 | DATA-P2-2 | Data | Migration 041 | 5 min |
| 9 | INFRA-P2-7 | Infra | vite.config.ts | 15 min |

**Note:** INFRA-P2-5 (Dependabot) was already configured — verified in `.github/dependabot.yml`.

---

*Related: [[2026-02-23-production-readiness-audit.md]], [[2026-02-23-deferred-p1-fixes.md]]*
