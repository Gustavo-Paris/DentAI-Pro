import { supabase } from './client';
import { withQuery, withMutation } from './utils';

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
  return withQuery(() =>
    supabase
      .from('evaluation_drafts')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(),
  ) as Promise<DraftRow | null>;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function save(userId: string, draftData: unknown) {
  const existing = await load(userId);

  if (existing) {
    await withMutation(() =>
      supabase
        .from('evaluation_drafts')
        .update({
          draft_data: JSON.parse(JSON.stringify(draftData)),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId),
    );
  } else {
    await withMutation(() =>
      supabase
        .from('evaluation_drafts')
        .insert([{
          user_id: userId,
          draft_data: JSON.parse(JSON.stringify(draftData)),
        }]),
    );
  }
}

export async function remove(userId: string) {
  await withMutation(() =>
    supabase
      .from('evaluation_drafts')
      .delete()
      .eq('user_id', userId),
  );
}
