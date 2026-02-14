import { supabase } from './client';

// ---------------------------------------------------------------------------
// Password recovery
// ---------------------------------------------------------------------------

export async function resetPasswordForEmail(
  email: string,
  redirectTo: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  return { error };
}

export async function updateUserPassword(
  password: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.updateUser({ password });
  return { error };
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export async function getSession() {
  return supabase.auth.getSession();
}

export function onAuthStateChange(
  callback: Parameters<typeof supabase.auth.onAuthStateChange>[0],
) {
  return supabase.auth.onAuthStateChange(callback);
}
