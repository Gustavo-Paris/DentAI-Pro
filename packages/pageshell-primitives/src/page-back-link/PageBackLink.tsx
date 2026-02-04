/**
 * PageBackLink - Declarative back navigation link
 *
 * Encapsulates back navigation styling with arrow-left icon.
 * Framework-agnostic with support for custom Link components.
 *
 * @module page-back-link
 */

'use client';

import { type ReactNode, type ComponentType } from 'react';
import { resolveIcon } from '../icons';

// =============================================================================
// Types
// =============================================================================

/** Link component type for framework-agnostic usage */
export type LinkComponentType = ComponentType<{
  href: string;
  children: ReactNode;
  className?: string;
}>;

export interface PageBackLinkProps {
  /** Navigation target URL (use this OR onClick) */
  href?: string;
  /** Click handler for programmatic navigation (use this OR href) */
  onClick?: () => void;
  /** Link text (default: "Back") */
  label?: string;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for automated testing */
  testId?: string;
  /** Custom Link component for framework-agnostic usage (e.g., Link from react-router-dom) */
  LinkComponent?: LinkComponentType;
}

// =============================================================================
// Component
// =============================================================================

/**
 * PageBackLink - Declarative back navigation link
 *
 * @example With href (renders as Link)
 * ```tsx
 * <PageBackLink href="/admin/curadoria" label="Back to queue" />
 * ```
 *
 * @example With onClick (renders as button)
 * ```tsx
 * <PageBackLink onClick={() => { clearState(); router.back(); }} />
 * ```
 *
 * @example With react-router-dom Link
 * ```tsx
 * import { Link } from 'react-router-dom';
 * <PageBackLink href="/dashboard" LinkComponent={Link} />
 * ```
 */
export function PageBackLink({
  href,
  onClick,
  label = 'Back',
  className,
  testId,
  LinkComponent,
}: PageBackLinkProps) {
  const ArrowLeftIcon = resolveIcon('arrow-left');

  const baseClasses =
    'inline-flex items-center gap-2 text-primary hover:brightness-125 transition';

  const content = (
    <>
      {ArrowLeftIcon && <ArrowLeftIcon className="w-4 h-4" aria-hidden="true" />}
      {label}
    </>
  );

  // Render as button when onClick is provided without href
  if (onClick && !href) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={className ? `${baseClasses} ${className}` : baseClasses}
        data-testid={testId}
      >
        {content}
      </button>
    );
  }

  // Render as link when href is provided
  // Use custom Link component if provided, otherwise use anchor
  const Link = LinkComponent || 'a';

  return (
    <Link
      href={href!}
      className={className ? `${baseClasses} ${className}` : baseClasses}
      data-testid={testId}
    >
      {content}
    </Link>
  );
}

PageBackLink.displayName = 'PageBackLink';
