import { supabase } from './client';
import { withQuery, withMutation, countByUser } from './utils';

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
      .in('patient_id', patientIds)
      .limit(1000),
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
    .select('id, session_id, tooth, status, created_at', { count: 'exact' })
    .eq('patient_id', patientId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) throw error;
  return { rows: data || [], count: count || 0 };
}

export async function create(
  userId: string,
  data: { name: string; phone?: string; email?: string; notes?: string },
) {
  return withQuery(() =>
    supabase
      .from('patients')
      .insert({
        user_id: userId,
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
      })
      .select()
      .single(),
  ) as Promise<PatientRow>;
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
      .order('name')
      .limit(500),
  );
  return data || [];
}

export async function listForAutocomplete(userId: string) {
  const data = await withQuery(() =>
    supabase
      .from('patients')
      .select('id, name, phone, email, birth_date')
      .eq('user_id', userId)
      .order('name')
      .limit(200),
  );
  return (data || []) as Array<{
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    birth_date: string | null;
  }>;
}

export async function deletePatient(patientId: string, userId: string): Promise<void> {
  await withMutation(() =>
    supabase
      .from('patients')
      .delete()
      .eq('id', patientId)
      .eq('user_id', userId),
  );
}

export async function countByUserId(userId: string) {
  return countByUser('patients', userId);
}

export async function countByUserIdSince(userId: string, since: Date): Promise<number> {
  const { count, error } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', since.toISOString());
  if (error) throw error;
  return count ?? 0;
}
