import { useState } from 'react';
import { useSignedUrl, THUMBNAIL_PRESETS } from '@/hooks/useSignedUrl';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type PresetKey = keyof typeof THUMBNAIL_PRESETS;

interface OptimizedImageProps {
  bucket: string;
  path: string | null | undefined;
  alt: string;
  className?: string;
  /**
   * Use a preset thumbnail size or provide custom dimensions
   */
  preset?: PresetKey;
  /**
   * Custom thumbnail options (overrides preset)
   */
  thumbnail?: {
    width?: number;
    height?: number;
    quality?: number;
    resize?: 'cover' | 'contain' | 'fill';
  };
  /**
   * Fallback element when image fails to load
   */
  fallback?: React.ReactNode;
  /**
   * Additional props for the img element
   */
  imgProps?: React.ImgHTMLAttributes<HTMLImageElement>;
}

/**
 * Optimized image component that automatically generates thumbnails
 * for Supabase Storage images using server-side transformations
 */
export function OptimizedImage({
  bucket,
  path,
  alt,
  className,
  preset = 'grid',
  thumbnail,
  fallback,
  imgProps,
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);

  // Use custom thumbnail or preset
  const thumbnailOptions = thumbnail || THUMBNAIL_PRESETS[preset];

  const { url, isLoading, error } = useSignedUrl({
    bucket,
    path,
    thumbnail: thumbnailOptions,
  });

  // Show loading skeleton
  if (isLoading) {
    return (
      <Skeleton 
        className={cn('bg-muted', className)} 
      />
    );
  }

  // Show error state
  if (error || hasError || !url) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div 
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground',
          className
        )}
      >
        <ImageOff className="w-6 h-6" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
      {...imgProps}
    />
  );
}

/**
 * Specialized component for clinical photo thumbnails in lists
 */
export function ClinicalPhotoThumbnail({
  path,
  alt,
  className,
  size = 'list',
}: {
  path: string | null | undefined;
  alt: string;
  className?: string;
  size?: 'small' | 'list' | 'grid';
}) {
  return (
    <OptimizedImage
      bucket="clinical-photos"
      path={path}
      alt={alt}
      preset={size}
      className={cn('rounded-lg object-cover', className)}
    />
  );
}

/**
 * Specialized component for DSD simulation thumbnails
 */
export function DSDSimulationThumbnail({
  path,
  alt,
  className,
  size = 'grid',
}: {
  path: string | null | undefined;
  alt: string;
  className?: string;
  size?: 'small' | 'list' | 'grid' | 'medium';
}) {
  return (
    <OptimizedImage
      bucket="dsd-simulations"
      path={path}
      alt={alt}
      preset={size}
      className={cn('rounded-lg object-cover', className)}
    />
  );
}
