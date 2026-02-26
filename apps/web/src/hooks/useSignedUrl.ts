import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/data';
import { logger } from '@/lib/logger';
import { SIGNED_URL_EXPIRY_SECONDS } from '@/lib/constants';

interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  resize?: 'cover' | 'contain' | 'fill';
}

interface UseSignedUrlOptions {
  bucket: string;
  path: string | null | undefined;
  expiresIn?: number;
  thumbnail?: ThumbnailOptions;
}

interface UseSignedUrlResult {
  url: string | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Build a stable query key for signed URL caching.
 * Includes thumbnail dimensions so different sizes get separate cache entries.
 */
function signedUrlKey(
  bucket: string,
  path: string,
  thumbnail?: ThumbnailOptions,
): readonly unknown[] {
  return [
    'signed-url',
    bucket,
    path,
    thumbnail?.width ?? 0,
    thumbnail?.height ?? 0,
    thumbnail?.quality ?? 0,
    thumbnail?.resize ?? '',
  ] as const;
}

/**
 * Hook to generate signed URLs for Supabase Storage files.
 * Uses React Query to cache and deduplicate requests — multiple components
 * requesting the same bucket+path+thumbnail combo share a single fetch.
 */
export function useSignedUrl({
  bucket,
  path,
  expiresIn = SIGNED_URL_EXPIRY_SECONDS,
  thumbnail,
}: UseSignedUrlOptions): UseSignedUrlResult {
  const query = useQuery({
    queryKey: signedUrlKey(bucket, path ?? '', thumbnail),
    queryFn: async () => {
      const transformOptions = thumbnail
        ? {
            transform: {
              width: thumbnail.width || 200,
              height: thumbnail.height || 200,
              resize: thumbnail.resize || 'cover',
              quality: thumbnail.quality || 70,
            },
          }
        : undefined;

      const { data, error: signError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path!, expiresIn, transformOptions);

      if (signError) {
        throw signError;
      }

      return data?.signedUrl || null;
    },
    enabled: !!path,
    // Keep URL considered fresh for most of the signed URL lifetime (minus 60s safety margin)
    staleTime: Math.max(0, (expiresIn - 60)) * 1000,
    // Don't refetch on window focus — signed URLs don't change
    refetchOnWindowFocus: false,
  });

  return {
    url: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
  };
}

/**
 * Preset thumbnail sizes for common use cases
 */
export const THUMBNAIL_PRESETS = {
  // For list items and cards
  list: { width: 120, height: 120, quality: 60, resize: 'cover' as const },
  // For grid displays
  grid: { width: 200, height: 200, quality: 70, resize: 'cover' as const },
  // For small avatars/badges
  small: { width: 64, height: 64, quality: 50, resize: 'cover' as const },
  // For medium previews
  medium: { width: 400, height: 400, quality: 75, resize: 'contain' as const },
} as const;

/**
 * Helper to generate signed URL synchronously (returns promise)
 * Useful when you need URLs outside of React components
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  options?: {
    expiresIn?: number;
    thumbnail?: ThumbnailOptions;
  }
): Promise<string | null> {
  const { expiresIn = SIGNED_URL_EXPIRY_SECONDS, thumbnail } = options || {};

  const transformOptions = thumbnail
    ? {
        transform: {
          width: thumbnail.width || 200,
          height: thumbnail.height || 200,
          resize: thumbnail.resize || 'cover',
          quality: thumbnail.quality || 70,
        },
      }
    : undefined;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn, transformOptions);

  if (error) {
    logger.error('Error generating signed URL:', error);
    return null;
  }

  return data?.signedUrl || null;
}
