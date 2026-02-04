'use client';

/**
 * PageHero - Unified Hero Component
 *
 * Consolidates 4 hero variants into a single component:
 * - progress: Progress-based hero with value/max (achievements, modules)
 * - balance: Balance display hero (credits, tokens)
 * - welcome: Welcome/onboarding hero with CTAs
 * - tiers: Tier breakdown hero (skill badges)
 *
 * ADR-0033: Domain Primitive Consolidation
 *
 * @example Progress variant
 * ```tsx
 * <PageHero
 *   variant="progress"
 *   value={5}
 *   max={10}
 *   title={(v, m) => `${v} de ${m} badges`}
 *   inlineStats={[{ icon: 'flame', value: 7, label: 'dias' }]}
 *   progressIndicator={<PageCompletionRing ... />}
 * />
 * ```
 *
 * @example Balance variant
 * ```tsx
 * <PageHero
 *   variant="balance"
 *   balance={15}
 *   distribution="3 mentores"
 *   warning={{ value: 5, label: 'expirando em breve' }}
 * />
 * ```
 *
 * @example Welcome variant
 * ```tsx
 * <PageHero
 *   variant="welcome"
 *   title="Comece sua jornada"
 *   subtitle="Explore cursos..."
 *   primaryAction={{ label: 'Explorar', href: '/courses' }}
 * />
 * ```
 *
 * @example Tiers variant
 * ```tsx
 * <PageHero
 *   variant="tiers"
 *   earned={5}
 *   total={10}
 *   tierCounts={{ bronze: 2, silver: 2, gold: 1 }}
 * />
 * ```
 */

import * as React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@pageshell/core';
import { resolveIcon, Button } from '@pageshell/primitives';
import { usePageShellContext } from '@pageshell/theme';
import type {
  PageHeroProps,
  PageHeroInlineStat,
  HeroStatVariant,
  TierCounts,
  IconProp,
} from './types';

// =============================================================================
// Constants
// =============================================================================

const statVariantClasses: Record<HeroStatVariant, string> = {
  default: 'text-foreground',
  warning: 'text-warning',
  info: 'text-info',
  accent: 'text-accent',
  success: 'text-success',
  primary: 'text-primary',
};

const progressStyleClasses = {
  achievements: {
    hero: 'portal-achievements-hero',
    content: 'portal-achievements-hero-content',
    title: 'portal-achievements-hero-title',
    subtitle: 'portal-achievements-hero-subtitle',
  },
  progress: {
    hero: 'portal-progress-hero',
    content: 'portal-progress-hero-content',
    title: 'portal-progress-hero-title',
    subtitle: 'portal-progress-hero-subtitle',
  },
  badges: {
    hero: 'portal-badges-hero',
    content: 'portal-badges-hero-content',
    title: 'portal-badges-hero-title',
    subtitle: 'portal-badges-hero-subtitle',
  },
};

// =============================================================================
// Helper Components
// =============================================================================

function InlineStats({ stats }: { stats: PageHeroInlineStat[] }) {
  return (
    <div className="flex items-center gap-4 mt-4">
      {stats.map((stat, index) => {
        const Icon = resolveIcon(stat.icon as IconProp);
        const colorClass = statVariantClasses[stat.variant ?? 'default'];
        if (!Icon) return null;
        return (
          <div key={index} className="flex items-center gap-2">
            <Icon className={cn('w-4 h-4', colorClass)} />
            <span className="text-sm">
              <span className={cn('font-mono font-semibold', colorClass)}>
                {stat.value}
              </span>
              <span className="text-muted-foreground"> {stat.label}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TierCard({
  tier,
  count,
  icon,
}: {
  tier: 'bronze' | 'silver' | 'gold';
  count: number;
  icon: IconProp;
}) {
  const Icon = resolveIcon(icon);
  if (!Icon) return null;

  return (
    <div className={`portal-tier-card portal-tier-card-${tier}`}>
      <div className="portal-tier-card-icon">
        <Icon className="w-6 h-6" />
      </div>
      <div className="portal-tier-card-content">
        <span className="portal-tier-card-value">{count}</span>
        <span className="portal-tier-card-label">{tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
      </div>
    </div>
  );
}

// =============================================================================
// Variant Renderers
// =============================================================================

function ProgressHero(props: Extract<PageHeroProps, { variant: 'progress' }>) {
  const { config } = usePageShellContext();
  const {
    value,
    max,
    title,
    subtitle,
    inlineStats,
    progressIndicator,
    styleVariant = 'achievements',
    animationDelay = 1,
    className,
  } = props;

  const classes = progressStyleClasses[styleVariant] ?? progressStyleClasses.achievements;
  const resolvedTitle = typeof title === 'function' ? title(value, max) : title;
  const resolvedSubtitle = typeof subtitle === 'function' ? subtitle(value, max) : subtitle;

  return (
    <div
      className={cn(
        classes.hero,
        config.animate,
        animationDelay > 0 && config.animateDelay(animationDelay),
        className
      )}
    >
      <div className={classes.content}>
        <h2 className={classes.title}>{resolvedTitle}</h2>
        {resolvedSubtitle && <p className={classes.subtitle}>{resolvedSubtitle}</p>}
        {inlineStats && inlineStats.length > 0 && <InlineStats stats={inlineStats} />}
      </div>
      {progressIndicator}
    </div>
  );
}

function BalanceHero(props: Extract<PageHeroProps, { variant: 'balance' }>) {
  const { config } = usePageShellContext();
  const {
    balance,
    distribution,
    warning,
    visual,
    title,
    subtitle,
    animationDelay = 1,
    className,
  } = props;

  const Icon = resolveIcon('timer');

  const defaultTitle = (b: number) => `Voce tem ${b} creditos disponiveis`;
  const defaultSubtitle = (b: number, d?: string) => {
    if (b === 0) return 'Compre um pacote para comecar suas sessoes de mentoria!';
    return d ? `Distribuidos entre ${d}` : '';
  };

  const resolvedTitle = typeof title === 'function' ? title(balance) : (title ?? defaultTitle(balance));
  const resolvedSubtitle =
    typeof subtitle === 'function'
      ? subtitle(balance, distribution)
      : (subtitle ?? defaultSubtitle(balance, distribution));

  return (
    <div
      className={cn(
        'portal-credits-hero',
        config.animate,
        animationDelay > 0 && config.animateDelay(animationDelay),
        className
      )}
    >
      <div className="portal-credits-hero-content">
        <div className="portal-credits-hero-main">
          <h2 className="portal-credits-hero-title">
            {resolvedTitle.split(String(balance)).map((part, i, arr) =>
              i < arr.length - 1 ? (
                <React.Fragment key={i}>
                  {part}
                  <span className="text-primary">{balance}</span>
                </React.Fragment>
              ) : (
                part
              )
            )}
          </h2>
          {resolvedSubtitle && <p className="portal-credits-hero-subtitle">{resolvedSubtitle}</p>}
        </div>
        {warning && warning.value > 0 && Icon && (
          <div className="portal-credits-hero-warning">
            <Icon className="w-4 h-4" />
            <span>
              {warning.value} {warning.label}
            </span>
          </div>
        )}
      </div>
      {visual && <div className="portal-credits-hero-visual">{visual}</div>}
    </div>
  );
}

function WelcomeHero(props: Extract<PageHeroProps, { variant: 'welcome' }>) {
  const { config } = usePageShellContext();
  const {
    icon = 'rocket',
    badge = 'Bem-vindo a sua jornada',
    title,
    subtitle,
    primaryAction,
    secondaryAction,
    animationDelay = 4,
    className,
  } = props;

  const Icon = resolveIcon(icon);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-border p-6 sm:p-8',
        config.animate,
        animationDelay > 0 && config.animateDelay(animationDelay),
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="relative">
        {/* Badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            {Icon && <Icon className="w-6 h-6 text-primary" />}
          </div>
          <span className="text-xs font-medium uppercase tracking-wider text-primary">
            {badge}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">
          {title}
        </h2>

        {/* Subtitle */}
        <p className="text-muted-foreground max-w-xl mb-6">{subtitle}</p>

        {/* Actions */}
        {(primaryAction || secondaryAction) && (
          <div className="flex flex-wrap gap-3">
            {primaryAction && (() => {
              const ActionIcon = primaryAction.icon ? resolveIcon(primaryAction.icon as IconProp) : undefined;
              return (
                <Button asChild size="lg" variant="default" leftIcon={ActionIcon && <ActionIcon className="w-4 h-4" />}>
                  <Link to={primaryAction.href}>{primaryAction.label}</Link>
                </Button>
              );
            })()}
            {secondaryAction && (() => {
              const ActionIcon = secondaryAction.icon ? resolveIcon(secondaryAction.icon as IconProp) : undefined;
              return (
                <Button asChild size="lg" variant="outline" leftIcon={ActionIcon && <ActionIcon className="w-4 h-4" />}>
                  <Link to={secondaryAction.href}>{secondaryAction.label}</Link>
                </Button>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

function TiersHero(props: Extract<PageHeroProps, { variant: 'tiers' }>) {
  const { config } = usePageShellContext();
  const {
    earned,
    total,
    tierCounts,
    title,
    subtitle,
    animationDelay = 1,
    className,
  } = props;

  const defaultTitle = (e: number, t: number) => `${e} of ${t} badges earned`;
  const defaultSubtitle = (e: number, t: number) => {
    if (e === 0) return 'Complete courses to start your badge collection!';
    if (e === t) return 'Amazing! You have earned all available badges!';
    return `Keep learning to unlock ${t - e} more badges!`;
  };

  const resolvedTitle = typeof title === 'function' ? title(earned, total) : (title ?? defaultTitle(earned, total));
  const resolvedSubtitle =
    typeof subtitle === 'function'
      ? subtitle(earned, total)
      : (subtitle ?? defaultSubtitle(earned, total));

  const percentage = total > 0 ? Math.round((earned / total) * 100) : 0;

  return (
    <div
      className={cn(
        'portal-badges-hero',
        config.animate,
        animationDelay > 0 && config.animateDelay(animationDelay),
        className
      )}
    >
      {/* Main Content */}
      <div className="portal-badges-hero-content">
        <div className="portal-badges-hero-main">
          <h2 className="portal-badges-hero-title">{resolvedTitle}</h2>
          <p className="portal-badges-hero-subtitle">{resolvedSubtitle}</p>
        </div>

        {/* Progress Bar */}
        <div className="portal-badges-hero-progress">
          <div className="portal-badges-hero-progress-bar">
            <div
              className="portal-badges-hero-progress-fill"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="portal-badges-hero-progress-text">{percentage}% completo</span>
        </div>
      </div>

      {/* Tier Breakdown */}
      <div className="portal-badges-tier-breakdown">
        <TierCard tier="bronze" count={tierCounts.bronze} icon="medal" />
        <TierCard tier="silver" count={tierCounts.silver} icon="award" />
        <TierCard tier="gold" count={tierCounts.gold} icon="trophy" />
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function PageHero(props: PageHeroProps) {
  switch (props.variant) {
    case 'progress':
      return <ProgressHero {...props} />;
    case 'balance':
      return <BalanceHero {...props} />;
    case 'welcome':
      return <WelcomeHero {...props} />;
    case 'tiers':
      return <TiersHero {...props} />;
    default:
      // TypeScript exhaustiveness check
      const _exhaustive: never = props;
      return null;
  }
}
