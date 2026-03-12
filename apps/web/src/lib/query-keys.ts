/**
 * Centralized query key factory for React Query.
 *
 * All query keys in the application should be defined here to ensure
 * consistency and enable reliable cache invalidation.
 *
 * Pattern: use hierarchical arrays so parent-level invalidation cascades
 * to all children (e.g. invalidating `evaluationKeys.all` clears all
 * evaluation-related cache entries).
 *
 * Usage:
 *   import { queryKeys } from '@/lib/query-keys';
 *   useQuery({ queryKey: queryKeys.profile.detail(userId), ... })
 */

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export const profileKeys = {
  all: ['profile'] as const,
  detail: (userId: string) => [...profileKeys.all, userId] as const,
  payments: (userId: string) => ['payment-history', userId] as const,
};

// ---------------------------------------------------------------------------
// Subscription & credits
// ---------------------------------------------------------------------------

export const subscriptionKeys = {
  all: ['subscription'] as const,
  detail: (userId?: string) => [...subscriptionKeys.all, userId] as const,
  plans: () => ['subscription-plans'] as const,
  creditCosts: () => ['credit-costs'] as const,
  creditPacks: () => ['credit-packs'] as const,
  creditUsage: (userId?: string) => ['credit-usage', userId] as const,
};

// ---------------------------------------------------------------------------
// Evaluations
// ---------------------------------------------------------------------------

export const evaluationKeys = {
  all: ['evaluations'] as const,
  lists: () => [...evaluationKeys.all, 'list'] as const,
  sessions: () => [...evaluationKeys.all, 'sessions'] as const,
  session: (id: string) => [...evaluationKeys.sessions(), id] as const,
  details: () => [...evaluationKeys.all, 'detail'] as const,
  detail: (id: string) => [...evaluationKeys.details(), id] as const,
};

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------

export const patientKeys = {
  all: ['patients'] as const,
  lists: () => [...patientKeys.all, 'list'] as const,
  allWithStats: (userId?: string) => [...patientKeys.all, 'all-with-stats', userId] as const,
  autocomplete: (userId?: string) => [...patientKeys.all, 'autocomplete', userId] as const,
  details: () => [...patientKeys.all, 'detail'] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
  sessions: (id: string, page?: number) => [...patientKeys.detail(id), 'sessions', page] as const,
};

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export const inventoryKeys = {
  all: ['inventory'] as const,
  list: (page: number) => [...inventoryKeys.all, 'list', page] as const,
  allItems: (userId?: string) => [...inventoryKeys.all, 'all', userId] as const,
  catalog: () => [...inventoryKeys.all, 'catalog'] as const,
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export const dashboardKeys = {
  all: (userId?: string) => ['dashboard', userId] as const,
  metrics: (userId?: string) => [...dashboardKeys.all(userId), 'metrics'] as const,
  counts: (userId?: string) => [...dashboardKeys.all(userId), 'counts'] as const,
  insights: (userId?: string) => [...dashboardKeys.all(userId), 'insights'] as const,
};

// ---------------------------------------------------------------------------
// Result (single evaluation result page)
// ---------------------------------------------------------------------------

export const resultKeys = {
  detail: (id: string) => ['result', id] as const,
  photos: (id: string) => ['result-photos', id] as const,
  dsdUrl: (id: string) => ['result-dsd-url', id] as const,
  dsdLayers: (id: string) => ['result-dsd-layers', id] as const,
};

// ---------------------------------------------------------------------------
// Group result (multi-tooth session result)
// ---------------------------------------------------------------------------

export const groupResultKeys = {
  detail: (sessionId: string) => ['group-result', sessionId] as const,
  photo: (path: string | undefined) => ['group-photo', path] as const,
  dsdUrl: (evalId: string | undefined) => ['group-dsd-url', evalId] as const,
  dsdLayers: (evalId: string | undefined) => ['group-dsd-layers', evalId] as const,
};

// ---------------------------------------------------------------------------
// Referral
// ---------------------------------------------------------------------------

export const referralKeys = {
  code: (userId: string) => ['referral-code', userId] as const,
  stats: (userId: string) => ['referral-stats', userId] as const,
};

// ---------------------------------------------------------------------------
// Signed URLs (Supabase Storage)
// ---------------------------------------------------------------------------

interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  resize?: 'cover' | 'contain' | 'fill';
}

export const signedUrlKey = (
  bucket: string,
  path: string,
  thumbnail?: ThumbnailOptions,
): readonly ['signed-url', string, string, number, number, number, string] =>
  [
    'signed-url',
    bucket,
    path,
    thumbnail?.width ?? 0,
    thumbnail?.height ?? 0,
    thumbnail?.quality ?? 0,
    thumbnail?.resize ?? '',
  ] as const;

// ---------------------------------------------------------------------------
// Pending teeth
// ---------------------------------------------------------------------------

export const pendingTeethKeys = {
  session: (sessionId: string) => ['pendingTeeth', sessionId] as const,
};

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

export const onboardingKeys = {
  progress: (userId?: string) => ['onboarding-progress', userId] as const,
};
