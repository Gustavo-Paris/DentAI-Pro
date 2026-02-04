'use client';

import { resolveIcon, type IconName } from '../icons';

/**
 * PageIcon - Declarative icon component using the icon registry
 *
 * Renders icons from the iconRegistry without requiring direct lucide-react imports.
 * This enables fully declarative pages where icon names are strings.
 *
 * @example Basic usage
 * ```tsx
 * <PageIcon name="user" className="w-5 h-5" />
 * <PageIcon name="linkedin" className="w-4 h-4" />
 * ```
 *
 * @example With custom styling
 * ```tsx
 * <PageIcon name="camera" className="w-6 h-6 text-muted-foreground" />
 * ```
 *
 * @example All available icon categories
 * - navigation: home, arrow-left, arrow-right, menu, close, external-link
 * - actions: plus, edit, delete, save, upload, download, share
 * - user: user, users, login, logout, lock, shield, eye, camera
 * - content: file, folder, image, book, link, tag
 * - status: success, error, warning, info, loading, sparkles
 * - brands: linkedin, youtube, github, twitter, instagram, facebook
 * - social: heart, star, thumbs-up, globe
 */

export interface PageIconProps {
  /** Icon name from the registry (or any string for backward compatibility) */
  name: IconName | string;
  /** CSS classes for sizing and styling */
  className?: string;
  /** Accessible label for screen readers */
  'aria-label'?: string;
  /** Whether icon is decorative (hidden from screen readers) */
  'aria-hidden'?: boolean;
}

export function PageIcon({
  name,
  className = 'w-4 h-4',
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden = true,
}: PageIconProps) {
  const IconComponent = resolveIcon(name);

  if (!IconComponent) {
    console.warn(`[PageIcon] Icon "${name}" not found in registry`);
    return null;
  }

  return (
    <IconComponent
      className={className}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
    />
  );
}
