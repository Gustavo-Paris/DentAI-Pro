import { supabase } from './client';
import { withQuery, withMutation } from './utils';
import { getAvatarPublicUrl as _getAvatarPublicUrl } from './storage';

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
  return withQuery(() =>
    supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('user_id', userId)
      .maybeSingle(),
  ) as Promise<Profile | null>;
}

export async function getFullByUserId(userId: string) {
  return withQuery(() =>
    supabase
      .from('profiles')
      .select('full_name, cro, clinic_name, phone, avatar_url, clinic_logo_url')
      .eq('user_id', userId)
      .single(),
  ) as Promise<ProfileFull>;
}

export async function updateProfile(userId: string, updates: Partial<ProfileFull>) {
  await withMutation(() =>
    supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId),
  );
}

export function getAvatarPublicUrl(avatarPath: string): string {
  return _getAvatarPublicUrl(avatarPath);
}
