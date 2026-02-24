---
title: Deferred P1 Fixes — Implementation Plan
created: 2026-02-23
updated: 2026-02-23
status: draft
tags:
  - type/plan
  - status/draft
---

# Deferred P1 Fixes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve the 22 P1 items deferred from the production readiness audit, improving security, error handling, UX, testing, and data integrity for the post-soft-launch phase.

**Architecture:** Incremental fixes grouped by domain. Each task is independently deployable. No schema-breaking changes — all migrations are additive.

**Tech Stack:** React 18 + TypeScript, Vite, Tailwind + shadcn/ui, Supabase Edge Functions (Deno), Supabase PostgreSQL, Vitest, Playwright.

---

## Phase 1: Security Hardening

### Task 1: CORS — Require Explicit Environment Variable

**Fixes:** SEC-P1-4

**Files:**
- Modify: `supabase/functions/_shared/cors.ts:25`

**Step 1: Change isDevelopment check**

```typescript
// BEFORE (line 25):
const isDevelopment = Deno.env.get("ENVIRONMENT") !== "production";

// AFTER:
const isDevelopment = Deno.env.get("ENVIRONMENT") === "development";
```

This flips the default: if `ENVIRONMENT` is unset, localhost is NOT allowed. Only `ENVIRONMENT=development` enables localhost CORS.

**Step 2: Commit**

```bash
git add supabase/functions/_shared/cors.ts
git commit -m "fix: CORS — require explicit ENVIRONMENT=development for localhost"
```

---

### Task 2: Gemini API Key — Move to Authorization Header

**Fixes:** SEC-P1-7

**Files:**
- Modify: `supabase/functions/_shared/gemini.ts:239`

**Step 1: Read the file to understand the full request pattern**

Check how `fetch()` is called with the Gemini API URL and identify all call sites.

**Step 2: Move API key from URL to header**

```typescript
// BEFORE (~line 239):
const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;
const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

// AFTER:
const url = `${GEMINI_API_BASE}/${model}:generateContent`;
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-goog-api-key': apiKey,
  },
  body: JSON.stringify(payload),
});
```

Apply the same pattern to ALL Gemini API call sites in the file (generateContent, image edit, etc.). Google's Generative Language API supports `x-goog-api-key` header as an alternative to query param.

**Step 3: Verify no other files pass API key in URL**

Search for `key=${` or `?key=` in all edge function files.

**Step 4: Commit**

```bash
git add supabase/functions/_shared/gemini.ts
git commit -m "fix: move Gemini API key from URL query param to x-goog-api-key header"
```

---

### Task 3: Shared Links Migration Verification

**Fixes:** SEC-P1-2

**Files:**
- Read: `supabase/migrations/019_secure_shared_links.sql`

**Step 1: Verify migration 019 is deployed**

```bash
npx supabase migration list
```

Confirm `019` shows as applied. If yes, this item is resolved — the secure RPC `get_shared_evaluation()` replaces the vulnerable RLS policies.

**Step 2: Mark as done (no code change needed)**

---

## Phase 2: Error Handling & Stability

### Task 4: send-email Error Context

**Fixes:** ERR-P1-4

**Files:**
- Modify: `supabase/functions/send-email/index.ts:~132`

**Step 1: Wrap sendEmail in try-catch with context**

```typescript
// BEFORE (~line 132):
await sendEmail({
  to: userEmail,
  subject: emailContent.subject,
  html: emailContent.html,
});

// AFTER:
try {
  await sendEmail({
    to: userEmail,
    subject: emailContent.subject,
    html: emailContent.html,
  });
} catch (emailError) {
  logger.error(`[${reqId}] Failed to send email: template="${template}", error=${(emailError as Error).message}`);
  return createErrorResponse(
    'Falha ao enviar email. Tente novamente mais tarde.',
    502,
    corsHeaders,
    undefined,
    reqId,
  );
}
```

**Step 2: Commit**

```bash
git add supabase/functions/send-email/index.ts
git commit -m "fix: send-email — add try-catch with error context around sendEmail"
```

---

### Task 5: Circuit Breaker Documentation + Config

**Fixes:** ERR-P1-1

**Files:**
- Modify: `supabase/functions/_shared/circuit-breaker.ts:30-33`

**Step 1: Externalize thresholds to env vars with sensible defaults**

```typescript
// BEFORE (lines 30-33):
const FAILURE_THRESHOLD = 3;
const RESET_TIMEOUT_MS = 30_000;
const FAILURE_WINDOW_MS = 60_000;

// AFTER:
const FAILURE_THRESHOLD = parseInt(Deno.env.get('CB_FAILURE_THRESHOLD') || '3', 10);
const RESET_TIMEOUT_MS = parseInt(Deno.env.get('CB_RESET_TIMEOUT_MS') || '30000', 10);
const FAILURE_WINDOW_MS = parseInt(Deno.env.get('CB_FAILURE_WINDOW_MS') || '60000', 10);
```

**Step 2: Add a comment documenting per-isolate limitation**

```typescript
// At top of file, after imports:
/**
 * Circuit breaker for edge functions.
 *
 * IMPORTANT: State is per-isolate (module scope). In serverless, each cold start
 * resets the breaker. This is acceptable for soft launch scale — the breaker
 * still protects within a warm isolate's lifetime (~5-10 min).
 *
 * For production scale, consider external state (Redis/Supabase row) for
 * cross-isolate coordination.
 */
```

**Step 3: Commit**

```bash
git add supabase/functions/_shared/circuit-breaker.ts
git commit -m "fix: circuit breaker — externalize thresholds, document per-isolate limitation"
```

---

### Task 6: React Query Retry Config

**Fixes:** ERR-P1-8

**Files:**
- Modify: `apps/web/src/App.tsx:78-86`

**Step 1: Add smart retry with exponential backoff**

```typescript
// BEFORE (lines 78-86):
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: QUERY_STALE_TIMES.SHORT,
    },
  },
});

// AFTER:
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry 4xx errors (client errors)
        if (error instanceof Error && 'status' in error && (error as { status: number }).status < 500) {
          return false;
        }
        return failureCount < 2; // 2 retries for server/network errors
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      staleTime: QUERY_STALE_TIMES.SHORT,
    },
    mutations: {
      retry: 0, // Never auto-retry mutations (payments, AI calls, etc.)
    },
  },
});
```

**Step 2: Commit**

```bash
git add apps/web/src/App.tsx
git commit -m "fix: React Query — smart retry with backoff, no mutation retry"
```

---

### Task 7: Error Response Format Standardization

**Fixes:** ERR-P1-6

**Files:**
- Modify: `supabase/functions/_shared/cors.ts` (where `createErrorResponse` lives)

**Step 1: Read createErrorResponse to understand current format**

**Step 2: Ensure all error responses follow a consistent shape**

The `createErrorResponse` utility in `cors.ts` already standardizes the format. Verify that all edge functions use it (not manual `new Response(JSON.stringify({error: ...}))`). Search for manual error responses and replace with `createErrorResponse`.

Grep for:
```
new Response(JSON.stringify.*error
```

Replace any manual error responses with `createErrorResponse(message, status, corsHeaders, undefined, reqId)`.

**Step 3: Commit**

```bash
git add supabase/functions/
git commit -m "fix: standardize all error responses to use createErrorResponse"
```

---

### Task 8: handleSubmitTeeth Partial Failure Recovery

**Fixes:** ERR-P0-4

**Files:**
- Modify: `apps/web/src/hooks/domain/useEvaluationDetail.ts:462-600`

**Step 1: Read the function to understand the full flow**

**Step 2: Add per-tooth result tracking and user feedback**

After the edge function call loop, collect results per tooth:

```typescript
// Track results per tooth
const results: Array<{ tooth: string; success: boolean; error?: string }> = [];

// After each edge function call:
results.push({ tooth: toothId, success: true });
// On failure:
results.push({ tooth: toothId, success: false, error: (err as Error).message });

// After all calls, show summary:
const failed = results.filter(r => !r.success);
if (failed.length > 0 && failed.length < results.length) {
  toast.warning(
    t('toasts.evaluationDetail.partialSuccess', {
      defaultValue: `${results.length - failed.length} de ${results.length} dentes processados. ${failed.length} falharam — tente novamente.`,
    }),
    { duration: 10000 },
  );
}
```

**Step 3: Add retry option for failed teeth**

Expose `failedTeeth` state so the UI can show a "Retry failed" button.

**Step 4: Commit**

```bash
git add apps/web/src/hooks/domain/useEvaluationDetail.ts
git commit -m "fix: handleSubmitTeeth — track per-tooth results, show partial failure feedback"
```

---

### Task 9: beforeunload Mobile Mitigation

**Fixes:** ERR-P1-7

**Files:**
- Modify: `apps/web/src/hooks/domain/useWizardFlow.ts`

**Step 1: Add visibilitychange handler as mobile fallback**

`beforeunload` is unreliable on iOS Safari and Android WebView. Add `visibilitychange` as a complementary handler that auto-saves the draft when the page goes hidden:

```typescript
// Add alongside the existing beforeunload handler:
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden' && nav.step >= 2 && imageBase64 !== null) {
      // Auto-save draft when page becomes hidden (mobile tab switch, app switch)
      submit.saveDraft?.();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [nav.step, imageBase64, submit.saveDraft]);
```

Check if `submit.saveDraft` or equivalent exists. If not, extract the draft saving logic into a callable function.

**Step 2: Commit**

```bash
git add apps/web/src/hooks/domain/useWizardFlow.ts
git commit -m "fix: wizard — auto-save draft on visibilitychange for mobile reliability"
```

---

## Phase 3: UX Polish

### Task 10: Patient Dialog Validation Feedback

**Fixes:** UX-P1-2

**Files:**
- Modify: `apps/web/src/pages/Patients.tsx:223-282`

**Step 1: Add inline validation for email and phone**

```typescript
// Add validation state:
const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

// Validate on blur:
const validateField = (field: string, value: string) => {
  const errors = { ...validationErrors };
  if (field === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    errors.email = t('patients.invalidEmail', { defaultValue: 'Email inválido' });
  } else {
    delete errors.email;
  }
  if (field === 'phone' && value && !/^[\d\s\(\)\-\+]{8,}$/.test(value)) {
    errors.phone = t('patients.invalidPhone', { defaultValue: 'Telefone inválido' });
  } else {
    delete errors.phone;
  }
  setValidationErrors(errors);
};
```

Show error below each input:

```tsx
{validationErrors.email && (
  <p className="text-sm text-destructive">{validationErrors.email}</p>
)}
```

Disable Save button when validation errors exist.

**Step 2: Commit**

```bash
git add apps/web/src/pages/Patients.tsx
git commit -m "fix: patient dialog — add inline validation for email and phone"
```

---

### Task 11: Skip-to-Content Link

**Fixes:** UX-P1-3

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/pages/Dashboard.tsx` (or the layout component)

**Step 1: Add skip-to-content link at the top of the app**

```tsx
// At the very top of the App component return, before <Router>:
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-background focus:px-4 focus:py-2 focus:rounded-md focus:ring-2 focus:ring-primary"
>
  {t('common.skipToContent', { defaultValue: 'Pular para o conteúdo' })}
</a>
```

**Step 2: Add `id="main-content"` to the main content area of each page layout**

Find the shared layout wrapper (likely in the router or a layout component) and add `id="main-content"` to the `<main>` element. If `id="main-content"` is only on Dashboard, move it to the shared layout.

**Step 3: Commit**

```bash
git add apps/web/src/App.tsx apps/web/src/
git commit -m "fix: add skip-to-content link for keyboard navigation (a11y)"
```

---

### Task 12: Landing Page i18n Audit

**Fixes:** UX-P1-4

**Files:**
- Read: `apps/web/src/pages/Landing.tsx`

**Step 1: Audit entire file for hardcoded Portuguese**

Search for any string literals in Portuguese that aren't wrapped in `t()`. The exploration found all strings properly internationalized — verify the pricing/features section (lines 487-636 per audit).

**Step 2: If all strings are i18n'd, mark as done. Otherwise, wrap remaining strings.**

**Step 3: Commit (if changes made)**

```bash
git add apps/web/src/pages/Landing.tsx apps/web/src/locales/
git commit -m "fix: Landing page — wrap remaining hardcoded strings in i18n"
```

---

### Task 13: DraftRestoreModal Explanation + Dismiss

**Fixes:** UX-P1-5

**Files:**
- Modify: `apps/web/src/pages/NewCase.tsx:390-397`
- Modify: `apps/web/src/components/wizard/DraftRestoreModal.tsx` (if it exists as a separate component)

**Step 1: Read the DraftRestoreModal component**

**Step 2: Add explanatory text and allow Escape dismiss**

Add a brief description explaining what the draft is:

```tsx
<p className="text-sm text-muted-foreground">
  {t('wizard.draftRestoreExplanation', {
    defaultValue: 'Você tem um caso em andamento que não foi concluído. Deseja continuar de onde parou ou iniciar um novo caso?',
  })}
</p>
```

Allow Escape to dismiss (maps to "Discard"):

```typescript
// Change onOpenChange from no-op to:
onOpenChange={(open) => {
  if (!open) wizard.handleDiscardDraft();
}}
```

**Step 3: Commit**

```bash
git add apps/web/src/pages/NewCase.tsx apps/web/src/components/wizard/
git commit -m "fix: DraftRestoreModal — add explanation text, allow Escape to dismiss"
```

---

### Task 14: Profile Loading Flash

**Fixes:** UX-P1-6

**Files:**
- Modify: `apps/web/src/pages/Profile.tsx:80-124`

**Step 1: Read the component to understand loading state**

The `DetailPage` composite from PageShell should already handle loading states via the `query` prop. If the flash happens because form fields render with empty values before data arrives, add a loading guard.

**Step 2: Add explicit loading guard before form renders**

If `DetailPage` doesn't handle it, add:

```typescript
if (p.isLoading) {
  return null; // DetailPage should show its own skeleton
}
```

Or ensure the form fields use `p.profile?.full_name || ''` pattern to prevent undefined flashes.

**Step 3: Commit**

```bash
git add apps/web/src/pages/Profile.tsx
git commit -m "fix: Profile — prevent empty form flash during loading"
```

---

### Task 15: Evaluation List Filter Behavior

**Fixes:** UX-P1-8

**Files:**
- Modify: `apps/web/src/pages/Evaluations.tsx:143-164`

**Step 1: Verify filters are actually applied by ListPage**

Read the `filtersConfig` and check how PageShell's `ListPage` consumes it. If filters are configured but not wired to the data query, add client-side filtering:

```typescript
const filteredSessions = useMemo(() => {
  let result = sessions;
  if (activeFilters?.status && activeFilters.status !== 'all') {
    result = result.filter(s => s.status === activeFilters.status);
  }
  if (activeFilters?.treatmentTypes && activeFilters.treatmentTypes !== 'all') {
    result = result.filter(s => s.treatmentType === activeFilters.treatmentTypes);
  }
  return result;
}, [sessions, activeFilters]);
```

**Step 2: Persist filter state in URL search params**

```typescript
const [searchParams, setSearchParams] = useSearchParams();
// Initialize filters from URL:
const initialStatus = searchParams.get('status') || 'all';
```

**Step 3: Commit**

```bash
git add apps/web/src/pages/Evaluations.tsx
git commit -m "fix: evaluation list — wire filter logic, persist in URL params"
```

---

### Task 16: CookieConsent + OfflineBanner Z-Index Overlap

**Fixes:** UX-P1-13

**Files:**
- Modify: `apps/web/src/components/OfflineBanner.tsx`
- Read: CookieConsent component (find it first)

**Step 1: Check both z-index values**

OfflineBanner uses `z-[60]`. Find CookieConsent and check its z-index.

**Step 2: Ensure OfflineBanner is always on top when both visible**

If they overlap, add `bottom` spacing to one when the other is visible. Or ensure OfflineBanner z-index > CookieConsent:

```tsx
// OfflineBanner:
className="... z-[70]" // higher than CookieConsent

// Also add bottom margin if CookieConsent is visible:
className={cn("... z-[70]", isCookieConsentVisible && "mb-16")}
```

**Step 3: Commit**

```bash
git add apps/web/src/components/
git commit -m "fix: prevent CookieConsent and OfflineBanner z-index overlap"
```

---

## Phase 4: Infra & Build

### Task 17: PWA Service Worker

**Fixes:** INFRA-P1-1

**Files:**
- Modify: `apps/web/vite.config.ts`
- Modify: `apps/web/public/manifest.json`
- Create: `apps/web/src/sw.ts` (if using vite-plugin-pwa)

**Step 1: Add vite-plugin-pwa**

```bash
pnpm --filter web add -D vite-plugin-pwa
```

**Step 2: Configure in vite.config.ts**

```typescript
import { VitePWA } from 'vite-plugin-pwa';

// Add to plugins array:
VitePWA({
  registerType: 'prompt', // Ask user before updating
  includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
  manifest: false, // Use existing manifest.json
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com/,
        handler: 'StaleWhileRevalidate',
        options: { cacheName: 'google-fonts-stylesheets' },
      },
    ],
  },
}),
```

**Step 3: Update manifest.json — add maskable icon**

```json
{
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

**Step 4: Commit**

```bash
git add apps/web/vite.config.ts apps/web/public/manifest.json
git commit -m "feat: add service worker via vite-plugin-pwa for PWA install"
```

---

### Task 18: Test Coverage Thresholds

**Fixes:** INFRA-P1-4

**Files:**
- Modify: `apps/web/vitest.config.ts:27-32`

**Step 1: Raise thresholds incrementally**

```typescript
// BEFORE:
thresholds: {
  statements: 22,
  branches: 76,
  functions: 44,
  lines: 22,
},

// AFTER:
thresholds: {
  statements: 40,
  branches: 70,
  functions: 50,
  lines: 40,
},
```

Start conservative (40%) to avoid blocking CI immediately. Increase over time.

**Step 2: Run tests to verify current coverage meets new thresholds**

```bash
pnpm --filter web test -- --coverage
```

If current coverage is below the new thresholds, either write tests for the gap or lower the threshold to just above current coverage (ratchet approach).

**Step 3: Commit**

```bash
git add apps/web/vitest.config.ts
git commit -m "fix: raise test coverage thresholds (22% → 40%+ statements)"
```

---

### Task 19: E2E Secrets Configuration

**Fixes:** INFRA-P1-5

**Files:**
- Modify: `.github/workflows/test.yml:157-210`

**Step 1: Add timeout and additional secret validation**

```yaml
e2e:
  name: E2E Tests
  runs-on: ubuntu-latest
  needs: [build]
  timeout-minutes: 15  # Add timeout (prevent stuck jobs)
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    E2E_USER_EMAIL: ${{ secrets.E2E_USER_EMAIL }}
    E2E_USER_PASSWORD: ${{ secrets.E2E_USER_PASSWORD }}
```

**Step 2: Add step to log setup instructions when secrets are missing**

```yaml
- name: Check E2E prerequisites
  run: |
    if [ "$HAS_EMAIL" != "true" ] || [ "$HAS_PASSWORD" != "true" ]; then
      echo "::warning::E2E tests skipped — secrets not configured."
      echo "::notice::To enable E2E: add E2E_USER_EMAIL and E2E_USER_PASSWORD to repo secrets."
      echo "e2e_skip=true" >> "$GITHUB_ENV"
    fi
```

**Step 3: Commit**

```bash
git add .github/workflows/test.yml
git commit -m "fix: E2E — add timeout, improve missing secrets messaging"
```

---

### Task 20: Chunk Size Warning Limit

**Fixes:** INFRA-P1-8

**Files:**
- Modify: `apps/web/vite.config.ts:79`

**Step 1: Lower threshold and add bundle analysis**

```typescript
// BEFORE:
chunkSizeWarningLimit: 600,

// AFTER:
chunkSizeWarningLimit: 500, // Vite default — keep warnings visible
```

**Step 2: Add rollup-plugin-visualizer for bundle analysis**

```bash
pnpm --filter web add -D rollup-plugin-visualizer
```

```typescript
// In vite.config.ts plugins (conditional):
...(process.env.ANALYZE ? [
  (await import('rollup-plugin-visualizer')).visualizer({
    open: true,
    filename: 'dist/stats.html',
  })
] : []),
```

**Step 3: Commit**

```bash
git add apps/web/vite.config.ts apps/web/package.json
git commit -m "fix: restore chunk size warning to 500KB, add bundle visualizer"
```

---

## Phase 5: Data Integrity

### Task 21: Draft Cleanup — Scheduled Deletion

**Fixes:** DATA-P1-3

**Files:**
- Create: `supabase/migrations/039_draft_cleanup.sql`

**Step 1: Create a SQL function for stale draft cleanup**

```sql
-- Delete drafts older than 30 days
CREATE OR REPLACE FUNCTION public.cleanup_stale_drafts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM evaluation_drafts
  WHERE updated_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;
```

**Step 2: Schedule via Supabase pg_cron (or document manual cron)**

```sql
-- If pg_cron is enabled:
SELECT cron.schedule(
  'cleanup-stale-drafts',
  '0 3 * * 0', -- Every Sunday at 3 AM
  $$SELECT cleanup_stale_drafts()$$
);
```

If pg_cron is not available, document the manual approach: call the function periodically via a scheduled edge function or external cron.

**Step 3: Commit**

```bash
git add supabase/migrations/039_draft_cleanup.sql
git commit -m "feat: add stale draft cleanup function (30-day retention)"
```

---

### Task 22: Storage Orphan Cleanup on Evaluation Deletion

**Fixes:** DATA-P1-4

**Files:**
- Modify: `apps/web/src/data/evaluations.ts:387-391`

**Step 1: Fetch photo paths before deleting evaluations**

```typescript
export async function deleteSession(sessionId: string, userId: string) {
  // 1. Fetch photo paths before deletion
  const { data: evaluations } = await supabase
    .from('evaluations')
    .select('id, photo_frontal')
    .eq('session_id', sessionId)
    .eq('user_id', userId);

  // 2. Delete evaluations (cascades to session_detected_teeth, etc.)
  await withMutation(() =>
    supabase.from('evaluations').delete().eq('session_id', sessionId).eq('user_id', userId),
  );

  // 3. Clean up storage (best-effort, don't block on failure)
  if (evaluations?.length) {
    const photoPaths = evaluations
      .map(e => e.photo_frontal)
      .filter((p): p is string => !!p);

    if (photoPaths.length > 0) {
      await supabase.storage.from('clinical-photos').remove(photoPaths).catch(() => {
        // Log but don't throw — storage cleanup is non-critical
      });
    }

    // Also clean DSD simulations
    const evalIds = evaluations.map(e => e.id);
    const dsdPaths = evalIds.map(id => `${userId}/${id}`);
    // DSD simulations are stored under userId/evaluationId prefix
    for (const prefix of dsdPaths) {
      const { data: files } = await supabase.storage.from('dsd-simulations').list(prefix).catch(() => ({ data: null }));
      if (files?.length) {
        await supabase.storage.from('dsd-simulations').remove(files.map(f => `${prefix}/${f.name}`)).catch(() => {});
      }
    }
  }
}
```

**Step 2: Commit**

```bash
git add apps/web/src/data/evaluations.ts
git commit -m "fix: clean up storage orphans (photos + DSD) on session deletion"
```

---

### Task 23: Shared Links Orphan Cleanup

**Fixes:** DATA-P1-7

**Files:**
- Create: `supabase/migrations/040_shared_links_cleanup.sql`

**Step 1: Add FK on shared_links.session_id and cleanup function**

```sql
-- Add FK if missing (with ON DELETE CASCADE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'shared_links_session_id_fkey'
  ) THEN
    ALTER TABLE public.shared_links
      ADD CONSTRAINT shared_links_session_id_fkey
      FOREIGN KEY (session_id) REFERENCES public.evaluations_raw(session_id) ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

-- Cleanup expired links
CREATE OR REPLACE FUNCTION public.cleanup_expired_shared_links()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM shared_links
  WHERE expires_at < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;
```

Note: The FK on `session_id` references `evaluations_raw.session_id`. Verify this column has a UNIQUE constraint. If `session_id` is not unique in `evaluations_raw` (multiple evaluations per session), the FK won't work — use a cleanup function instead.

**Step 2: Commit**

```bash
git add supabase/migrations/040_shared_links_cleanup.sql
git commit -m "feat: shared links — add cleanup function for expired links"
```

---

## Tracking Matrix

| Task | Findings | Phase | Files |
|------|----------|-------|-------|
| 1 | SEC-P1-4 | Security | cors.ts |
| 2 | SEC-P1-7 | Security | gemini.ts |
| 3 | SEC-P1-2 | Security | Verify only |
| 4 | ERR-P1-4 | Error | send-email/index.ts |
| 5 | ERR-P1-1 | Error | circuit-breaker.ts |
| 6 | ERR-P1-8 | Error | App.tsx |
| 7 | ERR-P1-6 | Error | Multiple edge functions |
| 8 | ERR-P0-4 | Error | useEvaluationDetail.ts |
| 9 | ERR-P1-7 | Error | useWizardFlow.ts |
| 10 | UX-P1-2 | UX | Patients.tsx |
| 11 | UX-P1-3 | UX | App.tsx |
| 12 | UX-P1-4 | UX | Landing.tsx (verify) |
| 13 | UX-P1-5 | UX | NewCase.tsx |
| 14 | UX-P1-6 | UX | Profile.tsx |
| 15 | UX-P1-8 | UX | Evaluations.tsx |
| 16 | UX-P1-13 | UX | OfflineBanner.tsx |
| 17 | INFRA-P1-1 | Infra | vite.config.ts, manifest.json |
| 18 | INFRA-P1-4 | Infra | vitest.config.ts |
| 19 | INFRA-P1-5 | Infra | test.yml |
| 20 | INFRA-P1-8 | Infra | vite.config.ts |
| 21 | DATA-P1-3 | Data | Migration 039 |
| 22 | DATA-P1-4 | Data | evaluations.ts |
| 23 | DATA-P1-7 | Data | Migration 040 |

---

*Related: [[2026-02-23-production-readiness-audit.md]], [[2026-02-23-production-readiness-fixes.md]]*
