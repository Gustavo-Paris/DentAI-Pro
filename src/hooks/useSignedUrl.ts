import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
 * Hook to generate signed URLs for Supabase Storage files
 * Supports thumbnail generation via Supabase image transformations
 */
export function useSignedUrl({
  bucket,
  path,
  expiresIn = 3600,
  thumbnail,
}: UseSignedUrlOptions): UseSignedUrlResult {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const fetchUrl = async () => {
      try {
        // Build transform options if thumbnail is requested
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
          .createSignedUrl(path, expiresIn, transformOptions);

        if (!isMounted) return;

        if (signError) {
          throw signError;
        }

        setUrl(data?.signedUrl || null);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err : new Error('Failed to generate URL'));
        setUrl(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUrl();

    return () => {
      isMounted = false;
    };
  }, [bucket, path, expiresIn, thumbnail?.width, thumbnail?.height, thumbnail?.quality, thumbnail?.resize]);

  return { url, isLoading, error };
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
  const { expiresIn = 3600, thumbnail } = options || {};

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
    console.error('Error generating signed URL:', error);
    return null;
  }

  return data?.signedUrl || null;
}
