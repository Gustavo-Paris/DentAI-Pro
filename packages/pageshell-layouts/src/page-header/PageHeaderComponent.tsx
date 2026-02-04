/**
 * PageHeader Component
 *
 * Renders a consistent page header with title, description, breadcrumbs, badges, and actions.
 * Uses theme-aware classes from PageShell context.
 *
 * @package @pageshell/layouts
 */

'use client';

import * as React from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@pageshell/core';
import { Button, resolveIcon } from '@pageshell/primitives';
import { usePageShellContext } from '@pageshell/theme';
import { PageBreadcrumbs } from '../page-breadcrumbs';
import { sizeConfig } from './constants';
import {
  HeaderSkeleton,
  MetaRow,
  renderBadges,
  renderAction,
} from './components';
import type { PageHeaderProps } from './types';

// =============================================================================
// Default Link Component
// =============================================================================

function DefaultLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

// =============================================================================
// PageHeader Component
// =============================================================================

/**
 * Uses `<div>` instead of `<header>` element intentionally.
 *
 * Rationale:
 * - HTML spec recommends only one `<header>` per page (or per sectioning element)
 * - PageHeader is a content-level component, not the page-level banner
 * - The main page header/navigation is handled by layout components
 * - Using `<header>` here could create semantic conflicts with the layout
 *
 * The `<h1>` inside provides proper heading semantics for the page content.
 */
export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  function PageHeader(
    {
      id,
      title,
      description,
      label,
      badge,
      action,
      icon,
      breadcrumbs,
      backHref,
      backLabel = 'Back',
      onBack,
      size = 'md',
      align = 'left',
      sticky = false,
      divider = false,
      meta,
      isLoading = false,
      className,
      LinkComponent = DefaultLink,
    },
    ref
  ) {
    const { config } = usePageShellContext();
    const sizeStyles = sizeConfig[size];
    const Icon = resolveIcon(icon);

    // Handle back navigation
    const hasBack = Boolean(backHref || onBack);
    const BackButton = () => {
      const buttonContent = (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{backLabel}</span>
        </Button>
      );

      if (backHref) {
        return <LinkComponent href={backHref}>{buttonContent}</LinkComponent>;
      }

      return buttonContent;
    };

    // Centered layout styles
    const isCentered = align === 'center';

    return (
      <div
        ref={ref}
        className={cn(
          config.animate,
          sticky && [
            'sticky top-0 z-40',
            'bg-background/80 backdrop-blur-md',
            '-mx-4 px-4 py-4 -mt-4',
            // PWA safe-area: add padding-top for notch/status bar in standalone mode
            'pt-[max(1rem,env(safe-area-inset-top))]',
            'border-b border-transparent',
            'transition-all duration-200',
            '[&:not(:first-child)]:border-border',
          ],
          divider && !sticky && 'pb-4 border-b border-border',
          className
        )}
      >
        {/* Loading State */}
        {isLoading ? (
          <HeaderSkeleton size={size} />
        ) : (
          <>
            {/* Back Navigation */}
            {hasBack && !breadcrumbs && (
              <div className="mb-2">
                <BackButton />
              </div>
            )}

            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <PageBreadcrumbs
                items={breadcrumbs}
                className="mb-3"
                LinkComponent={LinkComponent}
              />
            )}

            {/* Label and Badge Row */}
            {(label || badge) && (
              <div
                className={cn(
                  'flex items-center gap-3 mb-2',
                  isCentered && 'justify-center'
                )}
              >
                {label && <span className={config.label}>{label}</span>}
                {renderBadges(badge)}
              </div>
            )}

            {/* Title and Action Row */}
            <div
              className={cn(
                'flex gap-4',
                isCentered
                  ? 'flex-col items-center text-center'
                  : 'flex-col sm:flex-row sm:items-start sm:justify-between'
              )}
            >
              <div
                className={cn(
                  'flex-1 min-w-0',
                  isCentered && 'flex flex-col items-center'
                )}
              >
                {/* Title with Icon */}
                <div
                  className={cn(
                    'flex items-center',
                    sizeStyles.spacing,
                    isCentered && 'justify-center'
                  )}
                >
                  {Icon && (
                    <div
                      className="flex-shrink-0 rounded-lg p-2"
                      style={{ backgroundColor: `${config.primary}15` }}
                    >
                      <span style={{ color: config.primary }}>
                        <Icon className={sizeStyles.iconSize} />
                      </span>
                    </div>
                  )}
                  <h1
                    id={id}
                    className={cn(
                      config.heading,
                      sizeStyles.titleClass,
                      'font-bold',
                      !isCentered && 'truncate'
                    )}
                  >
                    {title}
                  </h1>
                </div>

                {/* Description */}
                {description && (
                  <p
                    className={cn(
                      'mt-2',
                      sizeStyles.descriptionClass,
                      isCentered ? 'max-w-lg' : 'max-w-xl'
                    )}
                    style={{ color: config.textMuted }}
                  >
                    {description}
                  </p>
                )}

                {/* Meta Information */}
                {meta && meta.length > 0 && (
                  <MetaRow
                    items={meta}
                    className={cn('mt-3', sizeStyles.metaSize)}
                  />
                )}
              </div>

              {/* Actions */}
              {action && !isCentered && (
                <div className="flex-shrink-0 flex items-center gap-2">
                  {renderAction(action, LinkComponent)}
                </div>
              )}
            </div>

            {/* Centered Actions (below content) */}
            {action && isCentered && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {renderAction(action, LinkComponent)}
              </div>
            )}
          </>
        )}
      </div>
    );
  }
);

PageHeader.displayName = 'PageHeader';
