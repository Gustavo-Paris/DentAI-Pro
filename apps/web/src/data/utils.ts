import type { PostgrestError } from '@supabase/supabase-js';

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
