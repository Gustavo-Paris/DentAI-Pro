import { subDays } from 'date-fns';
import { supabase } from './client';
import type { EvaluationInsert } from './client';
import { withQuery, withMutation, countByUser } from './utils';
import { withRetry } from '@/lib/retry';
import { EVALUATION_STATUS } from '@/lib/evaluation-status';
import type { EvaluationStatus } from '@/lib/evaluation-status';
import type { StratificationProtocol, CementationProtocol } from '@/types/protocol';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EvaluationListRow {
  id: string;
  created_at: string;
  patient_name: string | null;
  tooth: string;
  cavity_class: string;
  status: string | null;
  session_id: string | null;
  treatment_type: string | null;
}

/** Row shape returned by `listBySession` with JSON fields narrowed to their runtime types. */
export interface SessionEvaluationRow {
  id: string;
  created_at: string;
  patient_name: string | null;
  patient_id: string | null;
  patient_age: number;
  tooth: string;
  cavity_class: string;
  restoration_size: string;
  status: string | null;
  photo_frontal: string | null;
  checklist_progress: number[] | null;
  stratification_protocol: StratificationProtocol | null;
  treatment_type: string | null;
  ai_treatment_indication: string | null;
  ai_indication_reason: string | null;
  cementation_protocol: CementationProtocol | null;
  generic_protocol: { checklist?: string[] } | null;
  tooth_color: string;
  bruxism: boolean;
  aesthetic_level: string;
  budget: string;
  longevity_expectation: string;
  patient_aesthetic_goals: string | null;
  region: string | null;
  substrate: string | null;
  stratification_needed: boolean;
  recommendation_text: string | null;
  alternatives: Record<string, unknown> | null;
  protocol_layers: Record<string, unknown> | null;
  alerts: string[] | null;
  warnings: string[] | null;
  session_id: string | null;
  dsd_analysis: Record<string, unknown> | null;
  dsd_simulation_url: string | null;
  dsd_simulation_layers: Array<{
    type: string;
    simulation_url: string | null;
    includes_gengivoplasty?: boolean;
  }> | null;
  resins: { name: string; manufacturer: string } | null;
  ideal_resin: { name: string; manufacturer: string } | null;
}

/** Row shape returned by `listPendingTeeth` with JSON fields narrowed. */
export interface PendingToothRow {
  id: string;
  session_id: string;
  user_id: string;
  tooth: string;
  priority: string | null;
  treatment_indication: string | null;
  indication_reason: string | null;
  cavity_class: string | null;
  restoration_size: string | null;
  substrate: string | null;
  substrate_condition: string | null;
  enamel_condition: string | null;
  depth: string | null;
  tooth_region: string | null;
  tooth_bounds: unknown;
  created_at: string;
}

export interface EvaluationListParams {
  userId: string;
  page?: number;
  pageSize?: number;
}

export interface DashboardMetricsParams {
  userId: string;
}

export interface DashboardRecentParams {
  userId: string;
  limit?: number;
}

export interface DashboardInsightsParams {
  userId: string;
  weeksBack?: number;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function list({ userId, page = 0, pageSize = 20 }: EvaluationListParams) {
  const { data, error, count } = await supabase
    .from('evaluations')
    .select(
      'id, created_at, patient_name, tooth, cavity_class, status, session_id, treatment_type',
      { count: 'exact' },
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) throw error;
  return { rows: data || [], count: count || 0 };
}

export async function getById(evaluationId: string) {
  return withQuery(() =>
    supabase
      .from('evaluations')
      .select(`
        *,
        resins:resins!recommended_resin_id(*),
        ideal_resin:resins!ideal_resin_id(*)
      `)
      .eq('id', evaluationId)
      .maybeSingle(),
  );
}

export async function listBySession(sessionId: string, userId: string): Promise<SessionEvaluationRow[]> {
  const data = await withQuery(() =>
    supabase
      .from('evaluations')
      .select(`
        id, created_at, patient_name, patient_id, patient_age, tooth,
        cavity_class, restoration_size, status, photo_frontal,
        checklist_progress, stratification_protocol, treatment_type,
        ai_treatment_indication, ai_indication_reason, cementation_protocol, generic_protocol,
        tooth_color, bruxism, aesthetic_level, budget, longevity_expectation, patient_aesthetic_goals,
        region, substrate, stratification_needed, recommendation_text, alternatives,
        protocol_layers, alerts, warnings, session_id,
        dsd_analysis, dsd_simulation_url, dsd_simulation_layers,
        resins:resins!recommended_resin_id (*),
        ideal_resin:resins!ideal_resin_id (*)
      `)
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .order('tooth', { ascending: true }),
  );
  // Supabase types use `Json` for JSONB columns; the runtime values match
  // SessionEvaluationRow which narrows those fields to their actual shapes.
  return (data as SessionEvaluationRow[]) || [];
}

export async function updateStatus(id: string, status: EvaluationStatus) {
  await withMutation(() =>
    supabase
      .from('evaluations')
      .update({ status })
      .eq('id', id),
  );
}

// ---------------------------------------------------------------------------
// Dashboard-specific queries (parallel COUNT queries)
// ---------------------------------------------------------------------------

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

export async function getRecent({ userId, limit = 50 }: DashboardRecentParams) {
  const data = await withQuery(() =>
    supabase
      .from('evaluations')
      .select('id, created_at, tooth, patient_name, session_id, status, treatment_type, is_from_inventory, patient_age, dsd_simulation_url')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit),
  );
  return data || [];
}

export async function getDashboardInsights({ userId, weeksBack = 8 }: DashboardInsightsParams) {
  const since = subDays(new Date(), weeksBack * 7).toISOString();
  const data = await withQuery(() =>
    supabase
      .from('evaluations')
      .select('id, created_at, treatment_type, is_from_inventory, resins:resins!recommended_resin_id(name)')
      .eq('user_id', userId)
      .gte('created_at', since)
      .order('created_at', { ascending: true }),
  );
  return data || [];
}

// ---------------------------------------------------------------------------
// Total count (for dashboard stats)
// ---------------------------------------------------------------------------

export async function countByUserId(userId: string) {
  return countByUser('evaluations', userId);
}

// ---------------------------------------------------------------------------
// Search (used by GlobalSearch)
// ---------------------------------------------------------------------------

export async function searchRecent(userId: string, limit = 100) {
  const data = await withQuery(() =>
    supabase
      .from('evaluations')
      .select('id, patient_name, tooth, session_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit),
  );
  return data || [];
}

// ---------------------------------------------------------------------------
// Bulk status update
// ---------------------------------------------------------------------------

export async function updateStatusBulk(ids: string[], status: EvaluationStatus) {
  await withMutation(() =>
    supabase
      .from('evaluations')
      .update({ status })
      .in('id', ids),
  );
}

// ---------------------------------------------------------------------------
// Bulk field update
// ---------------------------------------------------------------------------

export async function updateEvaluationsBulk(
  ids: string[],
  updates: Partial<EvaluationInsert>,
) {
  const { error } = await supabase
    .from('evaluations')
    .update(updates)
    .in('id', ids);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Bulk checklist update
// ---------------------------------------------------------------------------

export async function updateChecklistBulk(ids: string[], userId: string, indices: number[]) {
  await withMutation(() =>
    supabase
      .from('evaluations')
      .update({ checklist_progress: indices })
      .in('id', ids)
      .eq('user_id', userId),
  );
}

// ---------------------------------------------------------------------------
// Session pending teeth
// ---------------------------------------------------------------------------

export async function listPendingTeeth(sessionId: string, userId: string): Promise<PendingToothRow[]> {
  const data = await withQuery(() =>
    supabase
      .from('session_detected_teeth')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .order('tooth', { ascending: true }),
  );
  // Supabase types use `Json` for tooth_bounds; PendingToothRow narrows it to `unknown`.
  return (data as PendingToothRow[]) || [];
}

// ---------------------------------------------------------------------------
// Shared links
// ---------------------------------------------------------------------------

export interface SharedEvaluationRow {
  tooth: string;
  treatment_type: string | null;
  cavity_class: string;
  status: string | null;
  ai_treatment_indication: string | null;
  created_at: string;
  clinic_name: string | null;
}

export async function getSharedEvaluation(token: string): Promise<SharedEvaluationRow[]> {
  const data = await withQuery(() =>
    supabase.rpc('get_shared_evaluation', { p_token: token }),
  );
  return (data as SharedEvaluationRow[]) || [];
}

export interface SharedDSDData {
  dsd_analysis: Record<string, unknown> | null;
  dsd_simulation_url: string | null;
  dsd_simulation_layers: Array<{
    type: string;
    label: string;
    simulation_url: string | null;
    whitening_level: string;
    includes_gengivoplasty: boolean;
  }> | null;
  photo_frontal: string | null;
}

export type SharedLinkStatus = 'valid' | 'expired' | 'not_found';

export async function checkSharedLinkStatus(token: string): Promise<SharedLinkStatus> {
  const { data, error } = await supabase.rpc('check_shared_link_status', { p_token: token });
  if (error) return 'not_found'; // gracefully degrade if RPC not deployed yet
  return (data as SharedLinkStatus) || 'not_found';
}

export async function getSharedDSD(token: string): Promise<SharedDSDData | null> {
  const { data, error } = await supabase.rpc('get_shared_dsd', { p_token: token });
  if (error) return null; // gracefully degrade if RPC not deployed yet
  const rows = data as SharedDSDData[] | null;
  return rows?.[0] || null;
}

export async function getOrCreateShareLink(sessionId: string, userId: string) {
  // Check if there's already a valid link
  const { data: existing } = await supabase
    .from('shared_links')
    .select('token')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (existing?.token) return existing.token;

  // Create new link with retry (re-checks for existing token on each attempt to avoid double-insert)
  return withRetry(
    async () => {
      // Re-check before insert — a concurrent request may have created it
      const { data: recheck } = await supabase
        .from('shared_links')
        .select('token')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      if (recheck?.token) return recheck.token as string;

      const created = await withQuery(() =>
        supabase
          .from('shared_links')
          .insert({ user_id: userId, session_id: sessionId })
          .select('token')
          .single(),
      );
      return created.token as string;
    },
    { maxRetries: 1, baseDelay: 2000 },
  );
}

// ---------------------------------------------------------------------------
// Insert evaluation (used by AddTeethModal flow)
// ---------------------------------------------------------------------------

export async function insertEvaluation(data: EvaluationInsert) {
  return withQuery(() =>
    supabase
      .from('evaluations')
      .insert(data)
      .select()
      .single(),
  );
}

export async function updateEvaluation(id: string, updates: Partial<EvaluationInsert>) {
  await withMutation(() =>
    supabase
      .from('evaluations')
      .update(updates)
      .eq('id', id),
  );
}

export async function deletePendingTeeth(sessionId: string, teeth: string[]) {
  await withMutation(() =>
    supabase
      .from('session_detected_teeth')
      .delete()
      .eq('session_id', sessionId)
      .in('tooth', teeth),
  );
}

export async function deleteSession(sessionId: string, userId: string) {
  // 1. Fetch photo paths before deletion
  const { data: evaluations } = await supabase
    .from('evaluations')
    .select('id, photo_frontal')
    .eq('session_id', sessionId)
    .eq('user_id', userId);

  // 2. Delete evaluations (existing logic)
  await withMutation(() =>
    supabase.from('evaluations').delete().eq('session_id', sessionId).eq('user_id', userId),
  );

  // 3. Clean up storage (best-effort, don't block on failure)
  if (evaluations?.length) {
    const photoPaths = evaluations
      .map(e => e.photo_frontal)
      .filter((p): p is string => !!p);

    if (photoPaths.length > 0) {
      await supabase.storage.from('clinical-photos').remove(photoPaths).catch(() => {});
    }

    // Also clean DSD simulations
    for (const ev of evaluations) {
      const prefix = `${userId}/${ev.id}`;
      const { data: files } = await supabase.storage
        .from('dsd-simulations')
        .list(prefix)
        .catch(() => ({ data: null }));
      if (files?.length) {
        await supabase.storage
          .from('dsd-simulations')
          .remove(files.map(f => `${prefix}/${f.name}`))
          .catch(() => {});
      }
    }
  }
}

export async function invokeEdgeFunction(name: string, body: Record<string, unknown>) {
  const { error } = await supabase.functions.invoke(name, { body });
  if (error) {
    // Extract structured error body from FunctionsHttpError (same pattern as useAuthenticatedFetch)
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === 'function') {
      try {
        const errorBody = await context.json();
        const serverMessage = errorBody?.error || errorBody?.message;
        if (serverMessage) {
          const enriched = new Error(serverMessage);
          (enriched as { code?: string }).code = errorBody?.code;
          (enriched as { status?: number }).status = context.status || 0;
          throw enriched;
        }
      } catch (parseError) {
        if (parseError instanceof Error && (parseError as { code?: string }).code) throw parseError;
      }
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Full evaluation with relations (for Result page)
// ---------------------------------------------------------------------------

export async function getByIdWithRelations(id: string, userId: string) {
  return withQuery(() =>
    supabase
      .from('evaluations')
      .select(`
        *,
        resins:resins!recommended_resin_id (*),
        ideal_resin:resins!ideal_resin_id (*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle(),
  );
}
