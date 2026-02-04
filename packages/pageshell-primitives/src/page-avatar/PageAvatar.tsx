'use client';

/**
 * PageAvatar - Declarative Avatar Component
 *
 * Avatar with automatic fallback chain and initials placeholder.
 * Framework-agnostic with support for custom Link and Image components.
 *
 * @module page-avatar
 *
 * @example Basic usage
 * ```tsx
 * <PageAvatar
 *   src={user.photoUrl}
 *   fallback={user.image}
 *   name={user.name}
 *   size="lg"
 * />
 * ```
 *
 * @example With status indicator
 * ```tsx
 * <PageAvatar
 *   src={user.photoUrl}
 *   name={user.name}
 *   size="md"
 *   status="online"
 * />
 * ```
 *
 * @example As link with Next.js
 * ```tsx
 * import Link from 'next/link';
 * import Image from 'next/image';
 *
 * <PageAvatar
 *   src={user.photoUrl}
 *   name={user.name}
 *   href={`/u/${user.username}`}
 *   LinkComponent={Link}
 *   ImageComponent={Image}
 * />
 * ```
 */

import * as React from 'react';
import { cn, getAvatarUrl, getInitials } from '@pageshell/core';

// =============================================================================
// Types
// =============================================================================

export type PageAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type PageAvatarStatus = 'online' | 'offline' | 'away' | 'busy';

/** Link component type for framework-agnostic usage */
export type AvatarLinkComponent = React.ComponentType<{
  href: string;
  children: React.ReactNode;
  className?: string;
}>;

/** Image component type for framework-agnostic usage (e.g., Next.js Image) */
export type AvatarImageComponent = React.ComponentType<{
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  onError?: () => void;
}>;

export interface PageAvatarProps {
  /** Primary image source (custom upload) */
  src?: string | null;
  /** Fallback image source (OAuth provider) */
  fallback?: string | null;
  /** User name for initials placeholder */
  name?: string | null;
  /** Alt text for accessibility */
  alt?: string;
  /** Avatar size */
  size?: PageAvatarSize;
  /** Make avatar a link */
  href?: string;
  /** Status indicator */
  status?: PageAvatarStatus;
  /** Show ring/border */
  ring?: boolean;
  /** Ring color (when ring=true) */
  ringColor?: 'primary' | 'success' | 'warning' | 'error' | 'muted';
  /** Additional className */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Custom Link component for framework-agnostic usage (e.g., Next.js Link) */
  LinkComponent?: AvatarLinkComponent;
  /** Custom Image component for optimized images (e.g., Next.js Image) */
  ImageComponent?: AvatarImageComponent;
}

// =============================================================================
// Size & Style Mappings
// =============================================================================

const sizeClasses: Record<PageAvatarSize, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
  '2xl': 'h-24 w-24 text-2xl',
};

const sizePx: Record<PageAvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
  '2xl': 96,
};

const statusClasses: Record<PageAvatarStatus, string> = {
  online: 'bg-emerald-500',
  offline: 'bg-muted-foreground',
  away: 'bg-amber-500',
  busy: 'bg-red-500',
};

const statusSizeClasses: Record<PageAvatarSize, string> = {
  xs: 'h-1.5 w-1.5',
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-4 w-4',
  '2xl': 'h-5 w-5',
};

const ringColorClasses: Record<string, string> = {
  primary: 'ring-primary',
  success: 'ring-emerald-500',
  warning: 'ring-amber-500',
  error: 'ring-red-500',
  muted: 'ring-muted-foreground',
};

// =============================================================================
// Component
// =============================================================================

export const PageAvatar = React.forwardRef<HTMLDivElement, PageAvatarProps>(
  (
    {
      src,
      fallback,
      name,
      alt,
      size = 'md',
      href,
      status,
      ring = false,
      ringColor = 'primary',
      className,
      onClick,
      LinkComponent,
      ImageComponent,
    },
    ref
  ) => {
    const [imageError, setImageError] = React.useState(false);

    // Reset error state when src changes
    React.useEffect(() => {
      setImageError(false);
    }, [src, fallback]);

    // Get the best available image URL
    const imageUrl = getAvatarUrl({ photoUrl: src, image: fallback });
    const initials = getInitials(name);
    const showInitials = imageError || imageUrl === '/default-avatar.png';

    // Base avatar content
    const avatarContent = (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full bg-muted overflow-hidden',
          sizeClasses[size],
          ring && `ring-2 ring-offset-2 ring-offset-background ${ringColorClasses[ringColor]}`,
          onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
          className
        )}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {showInitials ? (
          // Initials placeholder
          <span className="font-medium text-muted-foreground select-none">
            {initials}
          </span>
        ) : ImageComponent ? (
          // Custom Image component (e.g., Next.js Image)
          <ImageComponent
            src={imageUrl}
            alt={alt ?? name ?? 'Avatar'}
            width={sizePx[size]}
            height={sizePx[size]}
            className="object-cover w-full h-full"
            onError={() => setImageError(true)}
          />
        ) : (
          // Regular img element
          <img
            src={imageUrl}
            alt={alt ?? name ?? 'Avatar'}
            width={sizePx[size]}
            height={sizePx[size]}
            className="object-cover w-full h-full"
            onError={() => setImageError(true)}
          />
        )}

        {/* Status indicator */}
        {status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 rounded-full border-2 border-background',
              statusClasses[status],
              statusSizeClasses[size]
            )}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    );

    // Wrap in link if href provided
    if (href) {
      const Link = LinkComponent || 'a';
      return (
        <Link href={href} className="inline-block">
          {avatarContent}
        </Link>
      );
    }

    return avatarContent;
  }
);

PageAvatar.displayName = 'PageAvatar';

// =============================================================================
// Avatar Group (for stacked avatars)
// =============================================================================

export interface PageAvatarGroupProps {
  /** Maximum avatars to show before +N */
  max?: number;
  /** Size of avatars */
  size?: PageAvatarSize;
  /** Children (PageAvatar components) */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

export function PageAvatarGroup({
  max = 4,
  size = 'sm',
  children,
  className,
}: PageAvatarGroupProps) {
  const childArray = React.Children.toArray(children);
  const visibleChildren = childArray.slice(0, max);
  const remainingCount = childArray.length - max;

  return (
    <div className={cn('flex -space-x-2', className)}>
      {visibleChildren.map((child, index) => (
        <div key={index} className="relative" style={{ zIndex: max - index }}>
          {React.isValidElement(child)
            ? React.cloneElement(child as React.ReactElement<PageAvatarProps>, {
                size,
                ring: true,
                ringColor: 'muted',
              })
            : child}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'relative inline-flex items-center justify-center rounded-full bg-muted ring-2 ring-background',
            sizeClasses[size]
          )}
          style={{ zIndex: 0 }}
        >
          <span className="font-medium text-muted-foreground text-xs">
            +{remainingCount}
          </span>
        </div>
      )}
    </div>
  );
}

PageAvatarGroup.displayName = 'PageAvatarGroup';
