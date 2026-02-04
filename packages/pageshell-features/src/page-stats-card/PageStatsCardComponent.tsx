'use client';

/**
 * PageStatsCard Component
 *
 * @deprecated Use PageStats with variant prop instead.
 * Migration: <PageStatsCard {...props} /> -> <PageStats variant="card" stats={[props]} />
 *
 * @module page-stats-card/PageStatsCardComponent
 */

import { forwardRef, useMemo } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@pageshell/core';
import {
  Card,
  StatusBadge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  resolveIcon,
} from '@pageshell/primitives';
import { usePageShellContext } from '@pageshell/theme';
import { TrendIndicator } from '../_internal';
import { sizeConfig, subtitleColorClasses } from './constants';
import { StatsCardSkeleton } from './StatsCardSkeleton';
import type { PageStatsCardProps, PageBadge } from './types';

// =============================================================================
// Component
// =============================================================================

export const PageStatsCard = forwardRef<HTMLDivElement, PageStatsCardProps>(
  function PageStatsCard(
    {
      label,
      value,
      subtitle,
      subtitleColor = 'default',
      icon,
      iconBackground = false,
      prefix,
      suffix,
      trend,
      comparison,
      tooltip,
      size = 'md',
      variant = 'default',
      portalVariant = 'primary',
      isLoading = false,
      onClick,
      href,
      className,
      children,
      badge,
      testId,
      LinkComponent,
    },
    ref
  ) {
    // Use provided Link component or fallback to anchor tag
    const Link = LinkComponent || 'a';
    const { config: themeConfig } = usePageShellContext();
    const Icon = resolveIcon(icon);

    // Memoize iconBackground style to avoid recreation on each render
    const iconBgStyle = useMemo(
      () => (iconBackground ? { backgroundColor: `${themeConfig.primary}15` } : undefined),
      [iconBackground, themeConfig.primary]
    );

    const sizeStyles = sizeConfig[size];
    const isPortalVariant = variant === 'portal';

    const subtitleColorClass = subtitleColorClasses[subtitleColor];

    const portalSubtitleClass =
      subtitleColor === 'default' ? 'text-muted-foreground' : subtitleColorClass;

    // Format the value with prefix/suffix
    const formattedValue = (
      <>
        {prefix && <span className="text-muted-foreground mr-0.5">{prefix}</span>}
        {value}
        {suffix && <span className="text-muted-foreground ml-0.5">{suffix}</span>}
      </>
    );

    // Determine if card is interactive
    const isInteractive = Boolean(onClick || href);

    // Map PageBadge variant to StatusVariant
    const mapBadgeVariant = (v?: string): 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'primary' | 'accent' | undefined => {
      if (!v) return 'default';
      if (v === 'error') return 'destructive';
      return v as 'default' | 'success' | 'warning' | 'info' | 'primary' | 'accent';
    };

    const badgeNode =
      badge && typeof badge === 'object' && 'label' in badge
        ? (
            <StatusBadge
              variant={mapBadgeVariant((badge as PageBadge).variant)}
              size="sm"
              className="portal-stat-badge"
            >
              {(badge as PageBadge).label}
            </StatusBadge>
          )
        : badge ?? null;

    const defaultContent = (
      <>
        {isLoading ? (
          <StatsCardSkeleton size={size} />
        ) : (
          <div className="flex items-start justify-between gap-4">
            {/* Left side: Label and Value */}
            <div className="flex-1 min-w-0">
              {/* Label with optional tooltip */}
              <div className="flex items-center gap-1.5">
                <p
                  className={cn(
                    sizeStyles.labelSize,
                    'font-medium text-muted-foreground'
                  )}
                >
                  {label}
                </p>
                {tooltip && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">{tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {/* Value */}
              <p
                className={cn(
                  sizeStyles.valueSize,
                  'font-bold text-foreground mt-1 tabular-nums'
                )}
              >
                {formattedValue}
              </p>

              {/* Trend indicator */}
              {trend && (
                <div className="mt-2">
                  <TrendIndicator trend={trend} sizeClass={sizeStyles.trendSize} />
                </div>
              )}

              {/* Comparison */}
              {comparison && !trend && (
                <p className={cn('mt-2', sizeStyles.subtitleSize, 'text-muted-foreground')}>
                  <span className="font-medium">{comparison.value}</span>{' '}
                  <span>{comparison.label}</span>
                </p>
              )}

              {/* Subtitle */}
              {subtitle && (
                <p className={cn('mt-2', sizeStyles.subtitleSize, subtitleColorClass)}>
                  {subtitle}
                </p>
              )}

              {/* Custom children */}
              {children && <div className="mt-3">{children}</div>}
            </div>

            {/* Right side: Icon */}
            {Icon && (
              <div
                className={cn(
                  'flex-shrink-0 transition-transform',
                  isInteractive && 'group-hover:scale-110',
                  iconBackground && [
                    'rounded-xl',
                    sizeStyles.iconBgSize,
                    `bg-[${themeConfig.primary}]/10`,
                  ]
                )}
                style={{ ...iconBgStyle, color: themeConfig.primary }}
              >
                <Icon className={sizeStyles.iconSize} />
              </div>
            )}
          </div>
        )}
      </>
    );

    const portalTrendClass =
      trend?.direction === 'up'
        ? 'positive'
        : trend?.direction === 'down'
          ? 'negative'
          : undefined;

    const portalTrendLabel =
      trend &&
      `${trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}${Math.abs(trend.value).toFixed(1)}%${trend.label ? ` ${trend.label}` : ''}`;

    const portalContent = (
      <>
        {isLoading ? (
          <StatsCardSkeleton size={size} />
        ) : (
          <>
            <div className="flex items-start justify-between mb-4">
              {Icon && (
                <div className={cn('portal-stat-icon', portalVariant)}>
                  <Icon />
                </div>
              )}
              {badgeNode}
            </div>
            <div className="portal-stat">
              <span className="portal-stat-value">{formattedValue}</span>
              <span className="portal-stat-label">{label}</span>
              {portalTrendLabel && (
                <span className={cn('portal-stat-trend', portalTrendClass)}>
                  {portalTrendLabel}
                </span>
              )}
              {comparison && !trend && (
                <span className="text-xs text-muted-foreground">
                  <span className="font-medium">{comparison.value}</span>{' '}
                  <span>{comparison.label}</span>
                </span>
              )}
              {subtitle && (
                <span className={cn('text-xs', portalSubtitleClass)}>
                  {subtitle}
                </span>
              )}
              {children && <div className="mt-3">{children}</div>}
            </div>
          </>
        )}
      </>
    );

    const cardContent = isPortalVariant ? portalContent : defaultContent;

    // Base card classes
    const cardClasses = cn(
      themeConfig.animate,
      isPortalVariant
        ? ['portal-stat-card', `portal-stat-card-${portalVariant}`]
        : sizeStyles.padding,
      isInteractive &&
        (isPortalVariant
          ? ['cursor-pointer', 'group']
          : [
              'cursor-pointer transition-all duration-200',
              'hover:shadow-md hover:border-primary/30',
              'group',
            ]),
      className
    );

    const cardVariant = isPortalVariant ? 'glow' : undefined;

    // Render as link if href provided
    if (href) {
      return (
        <Link href={href} className="block">
          <Card ref={ref} variant={cardVariant} className={cardClasses} data-testid={testId}>
            {cardContent}
          </Card>
        </Link>
      );
    }

    // Render as button if onClick provided
    if (onClick) {
      return (
        <Card
          ref={ref}
          variant={cardVariant}
          className={cardClasses}
          data-testid={testId}
          onClick={onClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClick();
            }
          }}
        >
          {cardContent}
        </Card>
      );
    }

    // Render as static card
    return (
      <Card ref={ref} variant={cardVariant} className={cardClasses} data-testid={testId}>
        {cardContent}
      </Card>
    );
  }
);

PageStatsCard.displayName = 'PageStatsCard';
