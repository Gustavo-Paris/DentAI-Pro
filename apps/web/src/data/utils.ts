import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from './client';

/**
 * Wraps a Supabase query that returns `{ data, error }` and throws on error.
 *
 * Usage:
 *   const rows = await withQuery(() => supabase.from('t').select('*'));
 */
export async function withQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
): Promise<T> {
  const { data, error } = await queryFn();
  if (error) throw error;
  // For .maybeSingle() callers, T already includes null so this cast is safe.
  // For .single() and list queries, data should never be null when error is also null.
  return data as T;
}

/**
 * Like `withQuery` but for mutations that don't return data.
 *
 * Usage:
 *   await withMutation(() => supabase.from('t').update({ x }).eq('id', id));
 */
export async function withMutation(
  queryFn: () => Promise<{ error: PostgrestError | null }>,
): Promise<void> {
  const { error } = await queryFn();
  if (error) throw error;
}

/**
 * Generic count-by-user query. DRYs up identical patterns across data modules.
 */
export async function countByUser(table: string, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) throw error;
  return count || 0;
}
