import { supabase } from './client';

export interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

export async function getByUserId(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

export function getAvatarPublicUrl(avatarPath: string): string {
  const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
  return data.publicUrl;
}
