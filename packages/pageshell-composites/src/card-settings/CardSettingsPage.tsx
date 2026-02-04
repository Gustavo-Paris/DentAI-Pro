'use client';

/**
 * CardSettingsPage - Declarative Card-based Settings Page Composite
 *
 * Vertical stacked cards layout for settings/configuration pages.
 * Framework-agnostic implementation.
 *
 * @module card-settings/CardSettingsPage
 */

import * as React from 'react';
import { useMemo } from 'react';
import { cn } from '@pageshell/core';
import { PageCard, resolveIcon } from '@pageshell/primitives';
import { ChevronLeft } from 'lucide-react';

import type { CardSettingsPageProps, CardSettingsItem } from './types';

// =============================================================================
// KeyValueList Component (inline to avoid external dependency)
// =============================================================================

interface KeyValueListProps {
  items: CardSettingsItem[];
}

function KeyValueList({ items }: KeyValueListProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start justify-between gap-4 py-2 border-b border-border/50 last:border-0"
        >
          <span className="text-sm text-muted-foreground">{item.label}</span>
          <span className="text-sm font-medium text-foreground text-right">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Defaults
// =============================================================================

export const cardSettingsPageDefaults = {
  theme: 'default' as const,
  containerVariant: 'shell' as const,
  backLabel: 'Back',
  maxWidth: 'max-w-4xl',
} as const;

// =============================================================================
// Component
// =============================================================================

export function CardSettingsPage({
  // Base
  theme,
  containerVariant = cardSettingsPageDefaults.containerVariant,
  className,

  // Header
  title,
  description,

  // Navigation
  backHref,
  backLabel = cardSettingsPageDefaults.backLabel,
  breadcrumbs,
  LinkComponent,

  // Content
  sections,
  slots,
  beforeSections,
  afterSections,
}: CardSettingsPageProps) {
  // Container classes based on variant
  const containerClasses = containerVariant === 'shell' ? '' : `${cardSettingsPageDefaults.maxWidth} mx-auto`;
  // Filter visible sections
  const visibleSections = useMemo(
    () => sections.filter((section) => section.showWhen !== false),
    [sections]
  );

  // Resolve before/after content (slots take precedence)
  const resolvedBeforeSections = slots?.beforeSections ?? beforeSections;
  const resolvedAfterSections = slots?.afterSections ?? afterSections;

  // Link wrapper - uses LinkComponent if provided, otherwise plain anchor
  const LinkWrapper = LinkComponent || (({ href, className: linkClassName, children }: { href: string; className?: string; children: React.ReactNode }) => (
    <a href={href} className={linkClassName}>{children}</a>
  ));

  return (
    <div className={cn('min-h-screen bg-background', className)} data-theme={theme}>
      {/* Container */}
      <div className={cn(containerClasses, 'px-4 py-8 sm:px-6 lg:px-8')}>
        {/* Back Link */}
        {backHref && (
          <LinkWrapper
            href={backHref}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ChevronLeft className="h-4 w-4" />
            {backLabel}
          </LinkWrapper>
        )}

        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.label} className="flex items-center gap-2">
                  {index > 0 && <span>/</span>}
                  {crumb.href ? (
                    <LinkWrapper
                      href={crumb.href}
                      className="hover:text-foreground transition-colors"
                    >
                      {crumb.label}
                    </LinkWrapper>
                  ) : (
                    <span className="text-foreground">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          {description && (
            <p className="mt-2 text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Before sections slot */}
          {resolvedBeforeSections}

          {/* Sections as stacked cards */}
          {visibleSections.map((section) => {
            const Icon = section.icon
              ? typeof section.icon === 'string'
                ? resolveIcon(section.icon)
                : section.icon
              : undefined;

            return (
              <PageCard
                key={section.id}
                title={section.title}
                description={section.description}
                icon={Icon ?? undefined}
              >
                {/* Key-value list (if items provided) */}
                {section.items && section.items.length > 0 && (
                  <KeyValueList items={section.items} />
                )}

                {/* Custom content */}
                {section.content}
              </PageCard>
            );
          })}

          {/* After sections slot */}
          {resolvedAfterSections}

          {/* Footer slot */}
          {slots?.footer}
        </div>
      </div>
    </div>
  );
}

CardSettingsPage.displayName = 'CardSettingsPage';
