import { subDays, startOfWeek } from 'date-fns';
import { supabase } from './client';
import type { Database } from './client';
import { withQuery, withMutation, countByUser } from './utils';

type EvaluationInsert = Database['public']['Tables']['evaluations']['Insert'];

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

export async function listBySession(sessionId: string, userId: string) {
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
  return data || [];
}

export async function updateStatus(id: string, status: string) {
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
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();

  const [allEvalsResult, weeklyEvalsResult, pendingTeethResult] = await Promise.all([
    // All evaluations: session_id + status (for session-level metrics)
    supabase
      .from('evaluations')
      .select('session_id, status')
      .eq('user_id', userId)
      .limit(1000),
    // This week's evaluations: session_id (for weekly session count)
    supabase
      .from('evaluations')
      .select('session_id')
      .eq('user_id', userId)
      .gte('created_at', weekStart),
    // Count individual pending teeth
    supabase
      .from('evaluations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .neq('status', 'completed'),
  ]);

  // Group by session to compute session-level stats
  const sessionMap = new Map<string, { total: number; completed: number }>();
  for (const row of allEvalsResult.data || []) {
    const sid = row.session_id || row.id; // fallback: each legacy row becomes its own session
    if (!sessionMap.has(sid)) sessionMap.set(sid, { total: 0, completed: 0 });
    const entry = sessionMap.get(sid)!;
    entry.total++;
    if (row.status === 'completed') entry.completed++;
  }

  let completedSessions = 0;
  let pendingSessions = 0;
  for (const entry of sessionMap.values()) {
    if (entry.completed === entry.total) completedSessions++;
    else pendingSessions++;
  }

  const totalSessions = sessionMap.size;
  const weeklySessions = new Set(
    (weeklyEvalsResult.data || []).map(e => e.session_id)
  ).size;

  return {
    pendingSessionCount: pendingSessions,
    weeklySessionCount: weeklySessions,
    completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
    pendingTeethCount: pendingTeethResult.count || 0,
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

export async function updateStatusBulk(ids: string[], status: string) {
  await withMutation(() =>
    supabase
      .from('evaluations')
      .update({ status })
      .in('id', ids),
  );
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

export async function listPendingTeeth(sessionId: string, userId: string) {
  const data = await withQuery(() =>
    supabase
      .from('session_detected_teeth')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .order('tooth', { ascending: true }),
  );
  return data || [];
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

  // Create new link with single retry for transient errors
  try {
    const created = await withQuery(() =>
      supabase
        .from('shared_links')
        .insert({ user_id: userId, session_id: sessionId })
        .select('token')
        .single(),
    );
    return created.token as string;
  } catch {
    await new Promise(r => setTimeout(r, 2000));
    // Re-check for existing token before retrying insert (avoid double-insert)
    const { data: recheck } = await supabase
      .from('shared_links')
      .select('token')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    if (recheck?.token) return recheck.token;

    const created = await withQuery(() =>
      supabase
        .from('shared_links')
        .insert({ user_id: userId, session_id: sessionId })
        .select('token')
        .single(),
    );
    return created.token as string;
  }
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

export async function updateEvaluation(id: string, updates: Record<string, unknown>) {
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
  await withMutation(() =>
    supabase.from('evaluations').delete().eq('session_id', sessionId).eq('user_id', userId),
  );
}

export async function invokeEdgeFunction(name: string, body: Record<string, unknown>) {
  const { error } = await supabase.functions.invoke(name, { body });
  if (error) throw error;
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
