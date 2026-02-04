import { supabase } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DraftRow {
  id: string;
  user_id: string;
  draft_data: unknown;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function load(userId: string) {
  const { data, error } = await supabase
    .from('evaluation_drafts')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as DraftRow | null;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function save(userId: string, draftData: unknown) {
  const existing = await load(userId);

  if (existing) {
    const { error } = await supabase
      .from('evaluation_drafts')
      .update({
        draft_data: JSON.parse(JSON.stringify(draftData)),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('evaluation_drafts')
      .insert([{
        user_id: userId,
        draft_data: JSON.parse(JSON.stringify(draftData)),
      }]);

    if (error) throw error;
  }
}

export async function remove(userId: string) {
  const { error } = await supabase
    .from('evaluation_drafts')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}
