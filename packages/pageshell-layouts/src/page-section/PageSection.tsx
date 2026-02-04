'use client';

/**
 * PageSection Component
 *
 * Renders a themed section with title, icon, badge, and content.
 * Automatically applies animation delays based on render order.
 *
 * @example Basic usage
 * ```tsx
 * <PageSection title="Estatísticas" icon="bar-chart">
 *   <StatsGrid stats={data.stats} />
 * </PageSection>
 * ```
 *
 * @example With icon color
 * ```tsx
 * <PageSection title="Conquistas" icon="trophy" iconColor="amber">
 *   <AchievementsList achievements={achievements} />
 * </PageSection>
 * ```
 *
 * @example With count badge
 * ```tsx
 * <PageSection title="Badges" icon="award" badge={5}>
 *   <BadgesGrid badges={data.badges} />
 * </PageSection>
 * ```
 *
 * @example With badge variant
 * ```tsx
 * <PageSection
 *   title="Pendentes"
 *   icon="clock"
 *   badge={{ value: 3, variant: 'warning' }}
 * >
 *   <PendingList items={pending} />
 * </PageSection>
 * ```
 *
 * @example With content gap
 * ```tsx
 * <PageSection title="Configurações" contentGap="md">
 *   <SettingCard title="Notificações" />
 *   <SettingCard title="Privacidade" />
 * </PageSection>
 * ```
 *
 * @example With custom animation delay
 * ```tsx
 * <PageSection title="Primeiro" animationDelay={1}>
 *   <Content1 />
 * </PageSection>
 * <PageSection title="Segundo" animationDelay={2}>
 *   <Content2 />
 * </PageSection>
 * ```
 *
 * @module page-section
 */

import * as React from 'react';
import { cn } from '@pageshell/core';
import { StatusBadge, resolveIcon } from '@pageshell/primitives';
import { usePageShellContext, iconColorClasses } from '@pageshell/theme';
import type { PageSectionProps, PageSectionBadge, BadgeVariant } from './types';

/**
 * Normalizes badge prop to value and variant
 */
function normalizeBadge(badge: PageSectionBadge | undefined): { value: string; variant: string } | null {
  if (badge === undefined || badge === null) return null;

  if (typeof badge === 'number' || typeof badge === 'string') {
    return { value: String(badge), variant: 'accent' };
  }

  return { value: String(badge.value), variant: badge.variant ?? 'accent' };
}

const gapClasses = {
  none: '',
  xs: 'space-y-1',
  sm: 'space-y-2',
  md: 'space-y-3',
  lg: 'space-y-4',
} as const;

export const PageSection = React.forwardRef<HTMLElement, PageSectionProps>(
  function PageSection({
    title,
    description,
    icon,
    iconColor = 'violet',
    badge,
    trailing,
    children,
    contentGap,
    animationDelay,
    className,
    testId,
    ariaLabel,
  }, ref) {
  const { theme, config } = usePageShellContext();
  const Icon = resolveIcon(icon);
  const normalizedBadge = normalizeBadge(badge);

  // Use provided delay or fixed default (avoids hydration mismatch from getNextDelay counter)
  const delay = animationDelay ?? 2;
  const delayClass = delay > 0 ? config.animateDelay(delay) : '';
  const colorClass = iconColorClasses[theme][iconColor] ?? iconColor;

  // Generate stable ID for aria-labelledby (always available when title exists)
  const generatedId = React.useId();
  const titleId = title ? (testId ? `${testId}-title` : `section-title${generatedId}`) : undefined;

  return (
    <section
      ref={ref}
      role="region"
      aria-labelledby={titleId}
      aria-label={!title ? ariaLabel : undefined}
      data-testid={testId}
      className={cn(config.animate, delayClass, className)}
    >
      {/* Section Header */}
      {(title || Icon) && (
        <div className={cn('flex items-center gap-3', description ? 'mb-2' : 'mb-4')}>
          {Icon && (
            <div className={cn(config.sectionIcon, colorClass)} aria-hidden="true">
              <Icon />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {title && (
              <h2 id={titleId} className={cn(config.heading, config.headingLg)}>
                {title}
              </h2>
            )}
          </div>
          {normalizedBadge && (
            <StatusBadge
              variant={normalizedBadge.variant as BadgeVariant}
              size="sm"
            >
              {normalizedBadge.value}
            </StatusBadge>
          )}
          {trailing}
        </div>
      )}

      {/* Section Description */}
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}

      {/* Section Content */}
      {contentGap ? (
        <div className={gapClasses[contentGap]}>{children}</div>
      ) : (
        children
      )}
    </section>
  );
});

PageSection.displayName = 'PageSection';
