import { supabase } from './client';
import { SIGNED_URL_EXPIRY_SECONDS } from '../lib/constants';

// ---------------------------------------------------------------------------
// Bucket: avatars
// ---------------------------------------------------------------------------

/**
 * Upload an avatar or clinic logo to the avatars bucket.
 * Optionally removes the previous file before uploading.
 */
export async function uploadAvatar(
  userId: string,
  file: File,
  fileName: string,
  oldPath?: string,
): Promise<string> {
  if (oldPath) {
    await supabase.storage.from('avatars').remove([oldPath]);
  }

  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/${fileName}.${fileExt}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });
  if (error) throw error;

  return filePath;
}

export async function removeAvatar(path: string): Promise<void> {
  await supabase.storage.from('avatars').remove([path]);
}

export function getAvatarPublicUrl(path: string): string {
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

// ---------------------------------------------------------------------------
// Bucket: clinical-photos
// ---------------------------------------------------------------------------

export async function getSignedPhotoUrl(
  path: string,
  expiresIn = SIGNED_URL_EXPIRY_SECONDS,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('clinical-photos')
    .createSignedUrl(path, expiresIn);
  if (error) {
    console.warn(`[storage] Failed to get signed URL for ${path}:`, error.message);
    return null;
  }
  return data?.signedUrl || null;
}

// ---------------------------------------------------------------------------
// Bucket: dsd-simulations
// ---------------------------------------------------------------------------

export async function getSignedDSDUrl(
  path: string,
  expiresIn = SIGNED_URL_EXPIRY_SECONDS,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('dsd-simulations')
    .createSignedUrl(path, expiresIn);
  if (error) {
    console.warn(`[storage] Failed to get signed URL for ${path}:`, error.message);
    return null;
  }
  return data?.signedUrl || null;
}

export async function getSignedDSDLayerUrls(
  paths: string[],
  expiresIn = SIGNED_URL_EXPIRY_SECONDS,
): Promise<Record<string, string>> {
  const urls: Record<string, string> = {};
  await Promise.all(
    paths.map(async (path) => {
      const { data, error } = await supabase.storage
        .from('dsd-simulations')
        .createSignedUrl(path, expiresIn);
      if (error) {
        console.warn(`[storage] Failed to get signed URL for ${path}:`, error.message);
        return;
      }
      if (data?.signedUrl) {
        urls[path] = data.signedUrl;
      }
    }),
  );
  return urls;
}
