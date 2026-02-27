# Dashboard Performance: RPC + Progressive Rendering

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce dashboard load time from ~10s to <2s perceived, with progressive rendering showing data as it arrives.

**Architecture:** Create a Supabase RPC (`get_dashboard_metrics`) to replace the client-side 5000-row fetch with a server-side `COUNT + GROUP BY`. Split the monolithic `loading` flag into 3 independent layers (L0 instant, L1 profile+metrics ~1s, L2 insights ~2-3s). Unify the duplicate profile cache key between AppLayout and useDashboard.

**Tech Stack:** PostgreSQL (RPC function), React Query, Supabase JS client

---

## Task 1: Create Supabase RPC migration

**Files:**
- Create: `supabase/migrations/045_dashboard_metrics_rpc.sql`

**Step 1: Write the migration file**

```sql
-- ===========================================
-- Migration 045: Dashboard Metrics RPC
-- ===========================================
-- Replaces client-side session grouping (5000 row fetch + JS aggregation)
-- with a single server-side query returning 1 JSON row.
-- Queries evaluations_raw directly to avoid phi_decrypt() overhead from the view.

CREATE OR REPLACE FUNCTION public.get_dashboard_metrics(p_user_id uuid)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH session_stats AS (
    SELECT
      session_id,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'completed') AS completed
    FROM evaluations_raw
    WHERE user_id = p_user_id
    GROUP BY session_id
  ),
  weekly AS (
    SELECT COUNT(DISTINCT session_id) AS cnt
    FROM evaluations_raw
    WHERE user_id = p_user_id
      AND created_at >= date_trunc('week', now())
  ),
  pending_teeth AS (
    SELECT COUNT(*) AS cnt
    FROM evaluations_raw
    WHERE user_id = p_user_id
      AND status != 'completed'
  )
  SELECT json_build_object(
    'pending_sessions', (SELECT COUNT(*) FROM session_stats WHERE completed < total),
    'weekly_sessions', (SELECT cnt FROM weekly),
    'completion_rate', (
      SELECT CASE
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(COUNT(*) FILTER (WHERE completed = total) * 100.0 / COUNT(*))
      END
      FROM session_stats
    ),
    'pending_teeth', (SELECT cnt FROM pending_teeth)
  );
$$;

-- Grant execute to authenticated users (RLS on evaluations_raw enforces row-level security,
-- but SECURITY DEFINER bypasses RLS so we filter by p_user_id explicitly).
GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_dashboard_metrics IS
  'Server-side dashboard metrics: pending sessions, weekly sessions, completion rate, pending teeth. Replaces 5000-row client fetch.';
```

**Step 2: Apply migration locally**

Run: `npx supabase db reset` or `npx supabase migration up` (if using local dev)

Expected: Migration applies without error.

**Step 3: Commit**

```bash
git add supabase/migrations/045_dashboard_metrics_rpc.sql
git commit -m "feat(db): add get_dashboard_metrics RPC for server-side aggregation"
```

---

## Task 2: Replace `getDashboardMetrics` with RPC call

**Files:**
- Modify: `apps/web/src/data/evaluations.ts:181-239` (replace `getDashboardMetrics` function body)

**Step 1: Replace the function**

Replace the entire `getDashboardMetrics` function (lines 181-239) with:

```ts
export async function getDashboardMetrics({ userId }: DashboardMetricsParams) {
  const { data, error } = await supabase.rpc('get_dashboard_metrics', {
    p_user_id: userId,
  });
  if (error) throw error;

  // RPC returns a JSON object; fallback to safe defaults
  const result = data as {
    pending_sessions: number;
    weekly_sessions: number;
    completion_rate: number;
    pending_teeth: number;
  } | null;

  return {
    pendingSessionCount: result?.pending_sessions ?? 0,
    weeklySessionCount: result?.weekly_sessions ?? 0,
    completionRate: result?.completion_rate ?? 0,
    pendingTeethCount: result?.pending_teeth ?? 0,
  };
}
```

Also remove the now-unused `startOfWeek` import from `date-fns` at the top of the file (line 1) IF it's only used by this function. Check — `getDashboardInsights` also uses `subDays` so keep that. `startOfWeek` is only used in the old `getDashboardMetrics`, so remove it from the import.

**Step 2: Remove unused import**

Line 1: change `import { subDays, startOfWeek } from 'date-fns';` to `import { subDays } from 'date-fns';`

Also remove the `EVALUATION_STATUS` import if it's only used in `getDashboardMetrics`. Check: `updateStatus` also uses it (line 168). Keep it.

**Step 3: Run type-check**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No new errors

**Step 4: Commit**

```bash
git add apps/web/src/data/evaluations.ts
git commit -m "perf(dashboard): replace 5000-row client fetch with RPC call"
```

---

## Task 3: Unify profile cache key

**Files:**
- Modify: `apps/web/src/hooks/domain/useDashboard.ts:273-286` (profile query)

**Step 1: Change profile query key in useDashboard**

In `useDashboard.ts`, change the profile query (lines 273-286) to use the same cache key as AppLayout:

```ts
const { data: profileData, isLoading: loadingProfile, isError: profileError } = useQuery({
  queryKey: ['profile', user?.id],  // ← unified with AppLayout
  queryFn: async () => {
    if (!user) throw new Error('User not authenticated');
    const profile = await profiles.getByUserId(user.id);
    let avatarUrl: string | null = null;
    if (profile?.avatar_url) {
      avatarUrl = profiles.getAvatarPublicUrl(profile.avatar_url);
    }
    return { profile, avatarUrl };
  },
  enabled: !!user,
  staleTime: QUERY_STALE_TIMES.LONG,
});
```

The only change is `queryKey: ['profile', user?.id]` instead of `dashboardQueryKeys.profile(user?.id)`.

**Caveat:** AppLayout's queryFn returns the raw profile object, while useDashboard's returns `{ profile, avatarUrl }`. Different queryFn shapes with the same key can cause issues. To handle this properly:

Option A (simpler): Keep separate keys but with shared prefix — actually this reintroduces the duplicate.

Option B (correct): Make useDashboard consume AppLayout's profile data via `select` transform. But AppLayout uses a different queryFn.

**Revised approach:** Change AppLayout to use the same `queryFn` shape as useDashboard, returning `{ profile, avatarUrl }`. OR better — just align the cache key in useDashboard to match AppLayout AND change useDashboard to use `initialData` from the existing cache.

**Simplest correct fix:** Keep useDashboard's queryFn but use the same base data. Actually the simplest fix is to have useDashboard reuse AppLayout's profile data by reading from the shared query:

Change useDashboard profile query to:

```ts
const { data: rawProfile, isLoading: loadingProfile, isError: profileError } = useQuery({
  queryKey: ['profile', user?.id],
  queryFn: () => {
    if (!user) throw new Error('User not authenticated');
    return profiles.getByUserId(user.id);
  },
  enabled: !!user,
  staleTime: QUERY_STALE_TIMES.LONG,
});

const profileData = useMemo(() => {
  if (!rawProfile) return undefined;
  const avatarUrl = rawProfile.avatar_url
    ? profiles.getAvatarPublicUrl(rawProfile.avatar_url)
    : null;
  return { profile: rawProfile, avatarUrl };
}, [rawProfile]);
```

This way:
- Cache key `['profile', user?.id]` matches AppLayout exactly
- queryFn returns the same shape (raw profile object)
- React Query deduplicates → 1 HTTP request instead of 2
- `avatarUrl` is derived in a `useMemo` (pure computation, no network)

**Step 2: Add useMemo import if not already imported**

Line 1 already imports `useMemo` — no change needed.

**Step 3: Update references to profileData**

`profileData` is used at lines 400-402:
```ts
const profile = profileData?.profile;
const avatarUrl = profileData?.avatarUrl ?? null;
```

These still work because our `useMemo` returns the same `{ profile, avatarUrl }` shape.

**Step 4: Clean up unused dashboardQueryKeys.profile**

The `dashboardQueryKeys.profile` factory is no longer used. Remove it from the `dashboardQueryKeys` object (line 259).

**Step 5: Run type-check**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No new errors

**Step 6: Commit**

```bash
git add apps/web/src/hooks/domain/useDashboard.ts
git commit -m "perf(dashboard): unify profile cache key with AppLayout (dedup HTTP request)"
```

---

## Task 4: Progressive rendering — split loading into 3 layers

**Files:**
- Modify: `apps/web/src/hooks/domain/useDashboard.ts` (export granular loading flags)
- Modify: `apps/web/src/pages/Dashboard.tsx` (use granular flags)
- Modify: `apps/web/src/pages/dashboard/PrincipalTab.tsx` (accept `loadingSessions` separately)

### Step 1: Update DashboardState type

In `useDashboard.ts`, replace the `loading` field in the `DashboardState` interface (line 67) with granular flags:

```ts
// Loading & error states
loading: boolean;          // KEEP for backwards compat (any query still loading)
loadingProfile: boolean;   // ADD — greeting/name skeleton
loadingMetrics: boolean;   // ADD — StatsGrid skeleton
loadingSessions: boolean;  // ADD — RecentSessions skeleton
loadingInsights: boolean;  // ADD — InsightsTab skeleton
```

### Step 2: Update the return object

In `useDashboard.ts`, update the `loading` line (398) and add granular flags:

```ts
const loading = loadingProfile || loadingDashboard || loadingInsights;
```

Change to:

```ts
const loading = loadingProfile || loadingDashboard || loadingInsights;
```

Keep `loading` as-is for backwards compat. Add new return values at the return statement (line 489+):

```ts
return {
  // ... existing fields
  loading,              // keep for any component that needs "everything loaded"
  loadingProfile,       // new
  loadingMetrics: loadingDashboard,  // new — maps to the metrics+sessions query
  loadingSessions: loadingDashboard, // new — same query, but semantically clear
  loadingInsights,      // new
  // ... rest of existing fields
};
```

### Step 3: Update Dashboard.tsx — greeting uses loadingProfile

In `Dashboard.tsx` (line 156), the greeting skeleton currently uses `dashboard.loading`. Change to `dashboard.loadingProfile`:

```tsx
{dashboard.loadingProfile ? (
  <Skeleton className="inline-block h-7 w-32 align-middle rounded-lg" />
) : (
  <span className="text-primary">{dashboard.firstName}</span>
)}
```

### Step 4: Update Dashboard.tsx — StatsGrid uses loadingMetrics

In `Dashboard.tsx` (lines 184-190), change `dashboard.loading` to `dashboard.loadingMetrics`:

```tsx
<StatsGrid
  metrics={dashboard.metrics}
  loading={dashboard.loadingMetrics}
  weekRange={dashboard.weekRange}
  weeklyTrends={dashboard.weeklyTrends}
/>
```

Apply this to BOTH StatsGrid instances (lines 184 and 199).

### Step 5: Update Dashboard.tsx — PrincipalTab uses loadingSessions

In `Dashboard.tsx` (line 115), change the `loading` prop:

```tsx
<PrincipalTab
  modules={modules}
  sessions={dashboard.sessions}
  loading={dashboard.loadingSessions}
  pendingDraft={dashboard.pendingDraft}
  pendingSessions={dashboard.metrics.pendingSessions}
  onDiscardDraft={dashboard.requestDiscardDraft}
/>
```

### Step 6: Update Dashboard.tsx — InsightsTab uses loadingInsights

In `Dashboard.tsx` (line 131), change the `loading` prop:

```tsx
<InsightsTab
  clinicalInsights={dashboard.clinicalInsights}
  weeklyTrends={dashboard.weeklyTrends}
  loading={dashboard.loadingInsights}
  patientsThisMonth={dashboard.patientsThisMonth}
  patientGrowth={dashboard.patientGrowth}
/>
```

### Step 7: Update the `isNewUser` check

In `useDashboard.ts` line 427, `isNewUser` uses `loading`. This should use the specific flag that provides sessions data:

```ts
const isNewUser = !loadingDashboard && sessions.length === 0 && metrics.pendingSessions === 0;
```

(Change `!loading` to `!loadingDashboard` since sessions come from the dashboard query)

### Step 8: Run type-check

Run: `cd apps/web && npx tsc --noEmit`
Expected: No new errors

### Step 9: Commit

```bash
git add apps/web/src/hooks/domain/useDashboard.ts apps/web/src/pages/Dashboard.tsx
git commit -m "perf(dashboard): progressive rendering with granular loading flags"
```

---

## Task 5: Deploy RPC and verify

**Step 1: Deploy the RPC to Supabase**

Run the migration on the remote Supabase instance. Either:
- Via Supabase Dashboard: SQL Editor → paste the migration SQL
- Via CLI: `npx supabase db push`

**Step 2: Verify the RPC works**

Test in Supabase SQL Editor:
```sql
SELECT get_dashboard_metrics('YOUR_USER_UUID_HERE');
```

Expected: JSON object with `pending_sessions`, `weekly_sessions`, `completion_rate`, `pending_teeth`.

**Step 3: Deploy frontend to Vercel**

Push to trigger Vercel deployment (or `npx vercel --prod`).

**Step 4: Verify in browser**

1. Open DevTools → Network tab
2. Navigate to dashboard
3. Verify: no more `evaluations?select=session_id,status&limit=5000` request
4. Verify: new `rpc/get_dashboard_metrics` request returning small JSON
5. Verify: greeting/name appears before stats grid (progressive)
6. Verify: stats grid appears before insights tab

---

## Summary of changes

| File | Change |
|------|--------|
| `supabase/migrations/045_dashboard_metrics_rpc.sql` | New RPC function |
| `apps/web/src/data/evaluations.ts` | `getDashboardMetrics` → `supabase.rpc()` |
| `apps/web/src/hooks/domain/useDashboard.ts` | Granular loading flags + unified profile key |
| `apps/web/src/pages/Dashboard.tsx` | Use granular loading per section |

## Expected results

| Metric | Before | After |
|--------|--------|-------|
| Payload (metrics) | ~200KB (5000 rows) | ~100 bytes (1 JSON) |
| Greeting visible | ~10s | ~500ms |
| StatsGrid visible | ~10s | ~1s |
| Recent sessions visible | ~10s | ~1s |
| Insights tab visible | ~10s | ~2-3s (but doesn't block anything) |
| Total HTTP requests | ~14 | ~12 (deduplicated profile) |
