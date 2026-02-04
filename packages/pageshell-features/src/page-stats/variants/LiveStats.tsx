'use client';

/**
 * LiveStats Variant
 *
 * @module page-stats/variants/LiveStats
 */

import { cn } from '@pageshell/core';
import { resolveIcon } from '@pageshell/primitives';
import type { VariantProps, LiveStatVariant } from '../types';
import { liveVariantClasses } from '../constants';

// =============================================================================
// Component
// =============================================================================

export function LiveStats({
  stats,
  label,
  timestamp,
  animationDelay = 1,
  className,
  testId,
}: VariantProps) {
  const LabelIcon = label ? resolveIcon(label.icon) : undefined;
  const TimestampIcon = timestamp ? resolveIcon(timestamp.icon ?? 'clock') : undefined;

  return (
    <div
      className={cn(
        'portal-live-stats-bar portal-animate-in',
        `portal-animate-in-delay-${animationDelay}`,
        className
      )}
      data-testid={testId}
    >
      {/* Label section */}
      {label && (
        <div className="portal-live-stats-label">
          {LabelIcon && <LabelIcon className="w-4 h-4 text-primary" />}
          <span className="text-sm text-muted-foreground">{label.text}</span>
        </div>
      )}

      {/* Stats items */}
      <div className="portal-live-stats-items">
        {stats.map((stat, index) => {
          const Icon = resolveIcon(stat.icon);

          // Custom render takes precedence
          if (stat.render) {
            return (
              <div key={`${stat.label}-${index}`} className="contents">
                {index > 0 && <div className="portal-live-stat-divider" />}
                <div className="portal-live-stats-item">
                  {stat.render()}
                  <span className="portal-live-stats-item-label">{stat.label}</span>
                </div>
              </div>
            );
          }

          // With indicator (status dot)
          if (stat.indicator) {
            return (
              <div key={`${stat.label}-${index}`} className="contents">
                {index > 0 && <div className="portal-live-stat-divider" />}
                <div className="portal-live-stats-item">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', stat.indicator)} />
                    <span
                      className={cn(
                        'portal-live-stats-item-value text-sm',
                        stat.textColor
                      )}
                    >
                      {stat.value}
                    </span>
                  </div>
                  <span className="portal-live-stats-item-label">{stat.label}</span>
                </div>
              </div>
            );
          }

          // With icon
          if (Icon) {
            return (
              <div key={`${stat.label}-${index}`} className="contents">
                {index > 0 && <div className="portal-live-stat-divider" />}
                <div className="portal-live-stats-item">
                  <div className="flex items-center gap-1">
                    <Icon className="w-3 h-3 text-muted-foreground/70" />
                    <span
                      className={cn(
                        'portal-live-stats-item-value text-sm',
                        stat.textColor ?? 'text-muted-foreground'
                      )}
                    >
                      {stat.value}
                    </span>
                  </div>
                  <span className="portal-live-stats-item-label">{stat.label}</span>
                </div>
              </div>
            );
          }

          // Default: value + label (with variant styling)
          const variantClass = stat.itemVariant
            ? liveVariantClasses[stat.itemVariant as LiveStatVariant] ?? ''
            : '';

          return (
            <div key={`${stat.label}-${index}`} className="contents">
              {index > 0 && <div className="portal-live-stat-divider" />}
              <div className="portal-live-stats-item">
                <span
                  className={cn(
                    'portal-live-stats-item-value',
                    stat.textColor ?? variantClass ?? 'text-foreground'
                  )}
                >
                  {stat.value}
                </span>
                <span className="portal-live-stats-item-label">{stat.label}</span>
              </div>
            </div>
          );
        })}

        {/* Timestamp (optional, always last) */}
        {timestamp && TimestampIcon && (
          <>
            <div className="portal-live-stat-divider" />
            <div className="portal-live-stats-item">
              <div className="flex items-center gap-1">
                <TimestampIcon className="w-3 h-3 text-muted-foreground/70" />
                <span className="portal-live-stats-item-value text-sm text-muted-foreground">
                  {timestamp.value ?? 'agora'}
                </span>
              </div>
              <span className="portal-live-stats-item-label">{timestamp.label}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
