/**
 * Text and Avatar Utility Functions
 *
 * Common utilities for text manipulation and avatar handling.
 *
 * @example
 * ```tsx
 * import { getAvatarUrl, getInitials, truncate } from '@pageshell/core';
 *
 * const avatarUrl = getAvatarUrl({ photoUrl: user.photoUrl, image: user.image });
 * const initials = getInitials("João Silva"); // "JS"
 * const excerpt = truncate(description, 100);
 * ```
 */

// =============================================================================
// Avatar Utilities
// =============================================================================

export interface AvatarUrlOptions {
  /** Custom uploaded photo URL (highest priority) */
  photoUrl?: string | null;
  /** OAuth provider image (Google, GitHub) */
  image?: string | null;
  /** User name for generating initials placeholder */
  name?: string | null;
  /** Default placeholder URL */
  defaultUrl?: string;
}

/**
 * Generate a DiceBear avatar URL based on a seed
 *
 * Uses the initials style with a consistent background color.
 *
 * @param seed - Text to use as seed (usually user name or ID)
 * @returns DiceBear avatar URL
 */
function generateDiceBearAvatar(seed: string): string {
  const encodedSeed = encodeURIComponent(seed || 'user');
  // Use PNG format instead of SVG for Next.js Image Optimization compatibility
  return `https://api.dicebear.com/7.x/initials/png?seed=${encodedSeed}&backgroundColor=6366f1,8b5cf6,ec4899,f43f5e,f97316,eab308,22c55e,14b8a6,06b6d4,3b82f6`;
}

/**
 * Get avatar URL with fallback chain
 *
 * Priority:
 * 1. Custom uploaded photo (photoUrl)
 * 2. OAuth provider image (image)
 * 3. DiceBear generated avatar (if name provided)
 * 4. Default placeholder URL
 *
 * @example
 * ```tsx
 * getAvatarUrl({ photoUrl: "https://...", image: null })
 * // Returns: "https://..."
 *
 * getAvatarUrl({ photoUrl: null, image: "https://oauth..." })
 * // Returns: "https://oauth..."
 *
 * getAvatarUrl({ photoUrl: null, image: null, name: "João Silva" })
 * // Returns: "https://api.dicebear.com/7.x/initials/png?seed=Jo%C3%A3o%20Silva&..."
 *
 * getAvatarUrl({ photoUrl: null, image: null })
 * // Returns: "https://api.dicebear.com/7.x/initials/png?seed=user&..."
 * ```
 */
export function getAvatarUrl(options: AvatarUrlOptions): string {
  const { photoUrl, image, name, defaultUrl } = options;

  // 1. Custom uploaded photo (highest priority)
  if (photoUrl) {
    return photoUrl;
  }

  // 2. OAuth provider image
  if (image) {
    return image;
  }

  // 3. Custom default URL if provided
  if (defaultUrl) {
    return defaultUrl;
  }

  // 4. Generate DiceBear avatar based on name or default seed
  return generateDiceBearAvatar(name || 'user');
}

/**
 * Get initials from a name (for avatar placeholder)
 *
 * @example
 * ```tsx
 * getInitials("João Silva") // "JS"
 * getInitials("Maria") // "M"
 * getInitials("") // "?"
 * ```
 */
export function getInitials(name?: string | null): string {
  if (!name?.trim()) return '?';

  const parts = name.trim().split(/\s+/);
  const first = parts[0];
  const last = parts[parts.length - 1];

  if (!first) return '?';

  if (parts.length === 1) {
    return first.charAt(0).toUpperCase();
  }

  return (first.charAt(0) + (last?.charAt(0) ?? '')).toUpperCase();
}

// =============================================================================
// Text Utilities
// =============================================================================

/**
 * Truncate text with ellipsis
 *
 * @example
 * ```tsx
 * truncate("Long text here...", 10) // "Long te..."
 * truncate("Short", 10) // "Short"
 * ```
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

// =============================================================================
// Page Utils Namespace (for backward compatibility)
// =============================================================================

/**
 * Legacy namespace object for backward compatibility
 *
 * @deprecated Import individual functions instead:
 * `import { getAvatarUrl, getInitials, truncate, formatCurrency, formatDate } from '@pageshell/core'`
 */
export const pageUtils = {
  // Avatar
  getAvatarUrl,
  getInitials,
  // Text
  truncate,
};
