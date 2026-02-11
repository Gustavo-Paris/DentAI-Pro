import { supabase } from './client';
import { withQuery, withMutation } from './utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PatientRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  birth_date: string | null;
  created_at: string;
}

export interface PatientsListParams {
  userId: string;
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function list({ userId, page = 0, pageSize = 20 }: PatientsListParams) {
  const { data, error, count } = await supabase
    .from('patients')
    .select('id, name, phone, email', { count: 'exact' })
    .eq('user_id', userId)
    .order('name')
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) throw error;
  return { rows: data || [], count: count || 0 };
}

export async function getById(patientId: string, userId: string) {
  return withQuery(() =>
    supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .eq('user_id', userId)
      .maybeSingle(),
  ) as Promise<PatientRow | null>;
}

export async function getEvaluationStats(userId: string, patientIds: string[]) {
  const data = await withQuery(() =>
    supabase
      .from('evaluations')
      .select('patient_id, session_id, status, created_at')
      .eq('user_id', userId)
      .in('patient_id', patientIds),
  );
  return data || [];
}

export async function listSessions(
  patientId: string,
  userId: string,
  page = 0,
  pageSize = 20,
) {
  const { data, error, count } = await supabase
    .from('evaluations')
    .select('session_id, tooth, status, created_at', { count: 'exact' })
    .eq('patient_id', patientId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) throw error;
  return { rows: data || [], count: count || 0 };
}

export async function update(id: string, updates: Partial<PatientRow>) {
  await withMutation(() =>
    supabase
      .from('patients')
      .update(updates)
      .eq('id', id),
  );
}

export async function listAll(userId: string) {
  const data = await withQuery(() =>
    supabase
      .from('patients')
      .select('id, name')
      .eq('user_id', userId)
      .order('name'),
  );
  return data || [];
}

export async function listForAutocomplete(userId: string) {
  const data = await withQuery(() =>
    supabase
      .from('patients')
      .select('id, name, phone, email, birth_date')
      .eq('user_id', userId)
      .order('name'),
  );
  return (data || []) as Array<{
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    birth_date: string | null;
  }>;
}

export async function countByUserId(userId: string) {
  const { count, error } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw error;
  return count || 0;
}
