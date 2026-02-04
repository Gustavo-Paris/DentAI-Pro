'use client';

/**
 * PageBackLink - Declarative back navigation link
 *
 * Framework-agnostic back navigation component.
 * Pass a LinkComponent prop to integrate with your framework's router.
 *
 * @example With href (renders as Link when LinkComponent provided)
 * <PageBackLink
 *   href="/admin/curadoria"
 *   label="Back to queue"
 *   LinkComponent={Link}
 * />
 *
 * @example With onClick (renders as button)
 * <PageBackLink onClick={() => { clearState(); router.back(); }} />
 *
 * @example Default anchor (no LinkComponent)
 * <PageBackLink href="/back" label="Go back" />
 */

import { type ComponentType, type ReactNode } from 'react';
import { resolveIcon } from '@pageshell/primitives';

export interface PageBackLinkProps {
  /** Navigation target URL (use this OR onClick) */
  href?: string;
  /** Click handler for programmatic navigation (use this OR href) */
  onClick?: () => void;
  /** Link text (default: "Back") */
  label?: string;
  /** Custom Link component for framework-agnostic routing */
  LinkComponent?: ComponentType<{
    href: string;
    children: ReactNode;
    className?: string;
  }>;
}

export function PageBackLink({
  href,
  onClick,
  label = 'Back',
  LinkComponent,
}: PageBackLinkProps) {
  const ArrowLeftIcon = resolveIcon('arrow-left');

  const content = (
    <>
      {ArrowLeftIcon && <ArrowLeftIcon className="w-4 h-4" />}
      {label}
    </>
  );

  const className = 'inline-flex items-center gap-2 text-primary hover:brightness-125 transition';

  // Button mode when onClick is provided without href
  if (onClick && !href) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={className}
      >
        {content}
      </button>
    );
  }

  // Link mode
  if (href) {
    // Use framework Link component if provided
    if (LinkComponent) {
      return (
        <LinkComponent href={href} className={className}>
          {content}
        </LinkComponent>
      );
    }

    // Fallback to native anchor
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  // No href or onClick - render as disabled button
  return (
    <button
      type="button"
      disabled
      className={`${className} opacity-50 cursor-not-allowed`}
    >
      {content}
    </button>
  );
}

PageBackLink.displayName = 'PageBackLink';
