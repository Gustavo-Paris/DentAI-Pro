import { supabase } from './client';
import type { Database } from './client';
import { withQuery, withMutation } from './utils';
import { logger } from '@/lib/logger';

type EvaluationInsert = Database['public']['Tables']['evaluations']['Insert'];

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadPhoto(userId: string, blob: Blob): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(blob.type)) {
    throw new Error('Tipo de arquivo inválido. Apenas imagens são permitidas.');
  }
  if (blob.size > MAX_FILE_SIZE) {
    throw new Error('Arquivo muito grande. Máximo: 10MB.');
  }

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
  const { error } = await supabase
    .from('patients')
    .update({ birth_date: birthDate })
    .eq('id', patientId);
  if (error) {
    logger.warn('Failed to update patient birth date:', error);
  }
}

// ---------------------------------------------------------------------------
// Evaluations
// ---------------------------------------------------------------------------

export async function createEvaluation(data: EvaluationInsert) {
  return withQuery(() =>
    supabase
      .from('evaluations')
      .insert(data)
      .select()
      .single(),
  );
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
  const { error } = await supabase
    .from('evaluations')
    .update({
      generic_protocol: protocol,
      recommendation_text: protocol.summary,
    })
    .eq('id', evalId);
  if (error) {
    logger.warn('Failed to update evaluation protocol:', error);
  }
}

export async function updateEvaluationStatus(
  evalId: string,
  status: string,
) {
  const { error } = await supabase
    .from('evaluations')
    .update({ status })
    .eq('id', evalId);
  if (error) {
    logger.error(`Failed to update evaluation ${evalId} status to ${status}:`, error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Edge Functions (cementation & resin)
// ---------------------------------------------------------------------------

export async function invokeRecommendCementation(body: Record<string, unknown>) {
  await withMutation(() =>
    supabase.functions.invoke('recommend-cementation', {
      body,
    }),
  );
}

export async function invokeRecommendResin(body: Record<string, unknown>) {
  await withMutation(() =>
    supabase.functions.invoke('recommend-resin', {
      body,
    }),
  );
}

// ---------------------------------------------------------------------------
// Session Detected Teeth
// ---------------------------------------------------------------------------

export async function savePendingTeeth(
  rows: Array<Record<string, unknown>>,
) {
  await withMutation(() =>
    supabase
      .from('session_detected_teeth')
      .insert(rows),
  );
}

// ---------------------------------------------------------------------------
// Contralateral Tooth Lookup (cross-session)
// ---------------------------------------------------------------------------

/**
 * Contralateral mapping: swap first digit (1↔2, 3↔4), keep second digit.
 * e.g. "11" → "21", "13" → "23", "34" → "44"
 */
export function getContralateralTooth(tooth: string): string | null {
  if (tooth.length !== 2) return null;
  const quadrant = parseInt(tooth[0]);
  const number = tooth[1];
  const SWAP: Record<number, number> = { 1: 2, 2: 1, 3: 4, 4: 3, 5: 6, 6: 5, 7: 8, 8: 7 };
  const mapped = SWAP[quadrant];
  if (!mapped) return null;
  return `${mapped}${number}`;
}

/**
 * Query previous evaluations for the same patient to find a contralateral
 * tooth that already has a protocol (generic_protocol IS NOT NULL).
 *
 * Returns the protocol data if found, null otherwise.
 */
export async function findContralateralProtocol(
  patientId: string,
  tooth: string,
): Promise<{
  evaluationId: string;
  tooth: string;
  treatmentType: string;
  protocol: Record<string, unknown>;
} | null> {
  const contralateral = getContralateralTooth(tooth);
  if (!contralateral) return null;

  const { data, error } = await supabase
    .from('evaluations')
    .select('id, tooth, treatment_type, generic_protocol')
    .eq('patient_id', patientId)
    .eq('tooth', contralateral)
    .not('generic_protocol', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    evaluationId: data.id as string,
    tooth: data.tooth as string,
    treatmentType: data.treatment_type as string,
    protocol: data.generic_protocol as Record<string, unknown>,
  };
}

// ---------------------------------------------------------------------------
// Protocol Sync (unify protocols within same treatment group)
// ---------------------------------------------------------------------------

const RESIN_SYNC_FIELDS = [
  'recommended_resin_id',
  'recommendation_text',
  'alternatives',
  'is_from_inventory',
  'ideal_resin_id',
  'ideal_reason',
  'has_inventory_at_creation',
  'stratification_protocol',
  'protocol_layers',
  'alerts',
  'warnings',
] as const;

const CEMENTATION_SYNC_FIELDS = [
  'cementation_protocol',
] as const;

/**
 * After parallel protocol generation, sync protocols within each treatment group
 * so all teeth of the same type share the same brand/protocol.
 */
export async function syncGroupProtocols(
  sessionId: string,
  evaluationIds: string[],
) {
  if (evaluationIds.length < 2) return;

  const { data: evaluations, error } = await supabase
    .from('evaluations')
    .select(
      'id, treatment_type, stratification_protocol, cementation_protocol, ' +
      'recommended_resin_id, recommendation_text, alternatives, ' +
      'is_from_inventory, ideal_resin_id, ideal_reason, ' +
      'has_inventory_at_creation, protocol_layers, alerts, warnings',
    )
    .eq('session_id', sessionId)
    .in('id', evaluationIds);

  if (error || !evaluations || evaluations.length < 2) return;

  // Group by treatment_type
  const groups: Record<string, typeof evaluations> = {};
  for (const ev of evaluations) {
    const tt = ev.treatment_type as string;
    if (!groups[tt]) groups[tt] = [];
    groups[tt].push(ev);
  }

  const updates: Promise<unknown>[] = [];

  for (const [treatmentType, group] of Object.entries(groups)) {
    if (group.length < 2) continue;

    if (treatmentType === 'resina') {
      const source = group.find((ev) => ev.stratification_protocol != null);
      if (!source) continue;

      const syncData: Record<string, unknown> = {};
      for (const field of RESIN_SYNC_FIELDS) {
        syncData[field] = (source as Record<string, unknown>)[field];
      }

      const targetIds = group.filter((ev) => ev.id !== source.id).map((ev) => ev.id);
      if (targetIds.length > 0) {
        updates.push(
          supabase.from('evaluations').update(syncData).in('id', targetIds),
        );
      }
    } else if (treatmentType === 'porcelana') {
      const source = group.find((ev) => ev.cementation_protocol != null);
      if (!source) continue;

      const syncData: Record<string, unknown> = {};
      for (const field of CEMENTATION_SYNC_FIELDS) {
        syncData[field] = (source as Record<string, unknown>)[field];
      }

      const targetIds = group.filter((ev) => ev.id !== source.id).map((ev) => ev.id);
      if (targetIds.length > 0) {
        updates.push(
          supabase.from('evaluations').update(syncData).in('id', targetIds),
        );
      }
    }
    // Generic treatments (implante, coroa, etc.) — no sync needed
  }

  const results = await Promise.allSettled(updates);
  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length > 0) {
    logger.warn(`syncGroupProtocols: ${failures.length}/${results.length} updates failed`);
  }
}
