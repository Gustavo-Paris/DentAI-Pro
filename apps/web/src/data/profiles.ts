import { supabase } from './client';

export interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

export interface ProfileFull extends Profile {
  cro: string | null;
  clinic_name: string | null;
  phone: string | null;
  clinic_logo_url: string | null;
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

export async function getFullByUserId(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, cro, clinic_name, phone, avatar_url, clinic_logo_url')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data as ProfileFull;
}

export async function updateProfile(userId: string, updates: Partial<ProfileFull>) {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId);

  if (error) throw error;
}

export function getAvatarPublicUrl(avatarPath: string): string {
  const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
  return data.publicUrl;
}
