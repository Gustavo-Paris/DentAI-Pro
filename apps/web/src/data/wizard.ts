import { supabase } from './client';

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export async function uploadPhoto(userId: string, blob: Blob): Promise<string> {
  const fileName = `${userId}/intraoral_${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from('clinical-photos')
    .upload(fileName, blob, { upsert: true });
  if (error) throw error;
  return fileName;
}

export async function downloadPhoto(path: string): Promise<Blob | null> {
  const { data } = await supabase.storage
    .from('clinical-photos')
    .download(path);
  return data;
}

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------

export async function createPatient(
  userId: string,
  name: string,
  birthDate: string | null,
) {
  const { data, error } = await supabase
    .from('patients')
    .insert({
      user_id: userId,
      name: name.trim(),
      birth_date: birthDate || null,
    })
    .select('id')
    .single();
  return { data, error };
}

export async function findPatientByName(userId: string, name: string) {
  const { data } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', userId)
    .eq('name', name.trim())
    .maybeSingle();
  return data;
}

export async function updatePatientBirthDate(
  patientId: string,
  birthDate: string,
) {
  await supabase
    .from('patients')
    .update({ birth_date: birthDate })
    .eq('id', patientId);
}

// ---------------------------------------------------------------------------
// Evaluations
// ---------------------------------------------------------------------------

export async function createEvaluation(data: Record<string, unknown>) {
  const { data: evaluation, error } = await supabase
    .from('evaluations')
    .insert(data as never)
    .select()
    .single();
  if (error) throw error;
  return evaluation;
}

export async function updateEvaluationProtocol(
  evalId: string,
  protocol: {
    summary: string;
    checklist: string[];
    alerts: string[];
    recommendations: string[];
    treatment_type: string;
    tooth: string;
    ai_reason: string | null;
  },
) {
  await supabase
    .from('evaluations')
    .update({
      generic_protocol: protocol,
      recommendation_text: protocol.summary,
    })
    .eq('id', evalId);
}

export async function updateEvaluationStatus(
  evalId: string,
  status: string,
) {
  await supabase
    .from('evaluations')
    .update({ status })
    .eq('id', evalId);
}

// ---------------------------------------------------------------------------
// Edge Functions (cementation & resin)
// ---------------------------------------------------------------------------

export async function invokeRecommendCementation(body: Record<string, unknown>) {
  const { error } = await supabase.functions.invoke('recommend-cementation', {
    body,
  });
  if (error) throw error;
}

export async function invokeRecommendResin(body: Record<string, unknown>) {
  const { error } = await supabase.functions.invoke('recommend-resin', {
    body,
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Session Detected Teeth
// ---------------------------------------------------------------------------

export async function savePendingTeeth(
  rows: Array<Record<string, unknown>>,
) {
  const { error } = await supabase
    .from('session_detected_teeth')
    .insert(rows);
  if (error) throw error;
}
