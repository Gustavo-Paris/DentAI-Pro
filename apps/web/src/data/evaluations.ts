import { subDays, startOfWeek } from 'date-fns';
import { supabase } from './client';

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
  const { data, error } = await supabase
    .from('evaluations')
    .select(`
      *,
      resins:resins!recommended_resin_id(*),
      ideal_resin:resins!ideal_resin_id(*)
    `)
    .eq('id', evaluationId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listBySession(sessionId: string, userId: string) {
  const { data, error } = await supabase
    .from('evaluations')
    .select(`
      id, created_at, patient_name, patient_id, patient_age, tooth,
      cavity_class, restoration_size, status, photo_frontal,
      checklist_progress, stratification_protocol, treatment_type,
      ai_treatment_indication, cementation_protocol, generic_protocol,
      tooth_color, bruxism, aesthetic_level, budget, longevity_expectation,
      resins!recommended_resin_id (name, manufacturer)
    `)
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .order('tooth', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function updateStatus(id: string, status: string) {
  const { error } = await supabase
    .from('evaluations')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
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
      .eq('user_id', userId),
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
    const sid = row.session_id || row.status; // fallback for legacy rows without session_id
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
  const { data, error } = await supabase
    .from('evaluations')
    .select('id, created_at, tooth, patient_name, session_id, status, treatment_type, is_from_inventory, patient_age')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getDashboardInsights({ userId, weeksBack = 8 }: DashboardInsightsParams) {
  const since = subDays(new Date(), weeksBack * 7).toISOString();
  const { data, error } = await supabase
    .from('evaluations')
    .select('id, created_at, treatment_type, is_from_inventory, resins:resins!recommended_resin_id(name)')
    .eq('user_id', userId)
    .gte('created_at', since)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

// ---------------------------------------------------------------------------
// Total count (for dashboard stats)
// ---------------------------------------------------------------------------

export async function countByUserId(userId: string) {
  const { count, error } = await supabase
    .from('evaluations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) throw error;
  return count || 0;
}

// ---------------------------------------------------------------------------
// Search (used by GlobalSearch)
// ---------------------------------------------------------------------------

export async function searchRecent(userId: string, limit = 100) {
  const { data, error } = await supabase
    .from('evaluations')
    .select('id, patient_name, tooth, session_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ---------------------------------------------------------------------------
// Bulk status update
// ---------------------------------------------------------------------------

export async function updateStatusBulk(ids: string[], status: string) {
  const { error } = await supabase
    .from('evaluations')
    .update({ status })
    .in('id', ids);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Session pending teeth
// ---------------------------------------------------------------------------

export async function listPendingTeeth(sessionId: string, userId: string) {
  const { data, error } = await supabase
    .from('session_detected_teeth')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .order('tooth', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ---------------------------------------------------------------------------
// Shared links
// ---------------------------------------------------------------------------

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

  // Create new link
  const { data: created, error } = await supabase
    .from('shared_links')
    .insert({ user_id: userId, session_id: sessionId })
    .select('token')
    .single();

  if (error) throw error;
  return created.token as string;
}

// ---------------------------------------------------------------------------
// Full evaluation with relations (for Result page)
// ---------------------------------------------------------------------------

export async function getByIdWithRelations(id: string, userId: string) {
  const { data, error } = await supabase
    .from('evaluations')
    .select(`
      *,
      resins:resins!recommended_resin_id (*),
      ideal_resin:resins!ideal_resin_id (*)
    `)
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
