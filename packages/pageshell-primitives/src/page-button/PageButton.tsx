/**
 * PageButton - Declarative Button with Icon Names
 *
 * Wrapper around Button that uses PageIcon for icons,
 * eliminating the need to import from lucide-react.
 *
 * Supports `href` for declarative navigation without needing
 * to wrap with Link or use asChild pattern.
 *
 * @module page-button
 */

'use client';

import * as React from 'react';
import { Button, type ButtonProps } from '../button';
import { PageIcon } from '../page-icon';
import { type IconProp } from '../icons';

// =============================================================================
// Types
// =============================================================================

export interface PageButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon'> {
  /**
   * Icon to show before the label (using icon name from registry)
   */
  icon?: IconProp;

  /**
   * Icon to show after the label (using icon name from registry)
   */
  iconRight?: IconProp;

  /**
   * Icon size class (default: "h-4 w-4")
   */
  iconSize?: string;

  /**
   * URL for navigation. When provided, renders as a link instead of button.
   */
  href?: string;

  /**
   * Target for the link (e.g., "_blank" for new tab)
   */
  target?: React.HTMLAttributeAnchorTarget;

  /**
   * Rel attribute for the link (auto-set to "noopener noreferrer" when target="_blank")
   */
  rel?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * PageButton - Button with declarative icon names
 *
 * Uses the iconRegistry to resolve icon names, providing:
 * - Zero lucide-react imports in consuming code
 * - Consistent icon usage across the codebase
 * - Type-safe icon names with autocomplete
 *
 * @example Basic with icon
 * ```tsx
 * <PageButton icon="download">Download</PageButton>
 * <PageButton icon="plus" variant="primary">Add Item</PageButton>
 * ```
 *
 * @example Icon position
 * ```tsx
 * <PageButton icon="arrow-left">Back</PageButton>
 * <PageButton iconRight="arrow-right">Next</PageButton>
 * ```
 *
 * @example Loading state
 * ```tsx
 * <PageButton icon="save" loading>Saving...</PageButton>
 * ```
 *
 * @example Destructive action
 * ```tsx
 * <PageButton icon="trash" variant="destructive">Delete</PageButton>
 * ```
 *
 * @example Icon-only button
 * ```tsx
 * <PageButton icon="settings" size="icon" aria-label="Settings" />
 * ```
 *
 * @example Navigation with href
 * ```tsx
 * <PageButton icon="eye" href="/preview">Preview</PageButton>
 * <PageButton icon="external-link" href="https://example.com" target="_blank">External</PageButton>
 * ```
 */
/**
 * Helper to render an icon from IconProp (string name or ComponentType)
 */
function renderIcon(
  icon: IconProp | undefined,
  className: string
): React.ReactNode {
  if (!icon) return undefined;

  // If it's a string, use PageIcon
  if (typeof icon === 'string') {
    return <PageIcon name={icon} className={className} />;
  }

  // If it's a component, render it directly
  const IconComponent = icon;
  return <IconComponent className={className} />;
}

export const PageButton = React.forwardRef<HTMLButtonElement, PageButtonProps>(
  (
    {
      icon,
      iconRight,
      iconSize = 'h-4 w-4',
      loading,
      children,
      href,
      target,
      rel,
      ...props
    },
    ref
  ) => {
    // Render icons using helper that handles both string and component types
    const leftIcon = renderIcon(icon, iconSize);
    const rightIcon = renderIcon(iconRight, iconSize);

    // When href is provided, render as a link using asChild pattern
    if (href) {
      // Auto-set rel for external links (target="_blank")
      const linkRel = rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined);

      return (
        <Button
          asChild
          leftIcon={leftIcon}
          rightIcon={rightIcon}
          loading={loading}
          {...props}
        >
          <a href={href} target={target} rel={linkRel}>
            {children}
          </a>
        </Button>
      );
    }

    return (
      <Button
        ref={ref}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        loading={loading}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

PageButton.displayName = 'PageButton';
