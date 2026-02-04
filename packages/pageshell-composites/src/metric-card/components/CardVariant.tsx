/**
 * CardVariant Component
 *
 * Default card-style metric display.
 *
 * @module metric-card/components/CardVariant
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { Card, PageIcon } from '@pageshell/primitives';
import type { PageMetricCardProps } from '../types';
import { colorClasses, statusClasses, sizeClasses } from '../constants';
import { TrendIndicator } from './TrendIndicator';

export function CardVariant({
  icon,
  label,
  value,
  sublabel,
  color = 'primary',
  status = 'default',
  trend,
  href,
  onClick,
  linkLabel,
  size = 'md',
  className,
  animationDelay,
  children,
  testId,
}: PageMetricCardProps) {
  const colors = colorClasses[color];
  const sizes = sizeClasses[size];
  const statusClass = statusClasses[status];

  const style: React.CSSProperties = {};
  if (typeof animationDelay === 'number') {
    style.animationDelay = `${animationDelay}s`;
  } else if (animationDelay) {
    style.animationDelay = animationDelay;
  }

  const cardContent = (
    <Card
      className={cn(
        sizes.container,
        'group relative overflow-hidden transition-all duration-300',
        statusClass,
        (href || onClick) && 'cursor-pointer hover:shadow-md hover:border-border/80',
        className
      )}
      style={style}
      data-testid={testId}
    >
      {/* Glow effect on hover */}
      {(href || onClick) && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 0%, oklch(from ${colors.glow} l c h / 0.15), transparent 70%)`,
          }}
        />
      )}

      <div className="relative z-10">
        {/* Icon + Label row */}
        <div className="flex items-center gap-2 mb-2">
          {icon && (
            <div
              className={cn(
                'rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300',
                sizes.icon,
                colors.icon,
                (href || onClick) && 'group-hover:scale-110'
              )}
            >
              <PageIcon name={icon} className={sizes.iconInner} />
            </div>
          )}
          <span
            className={cn(
              'font-medium uppercase tracking-wider text-muted-foreground',
              sizes.label
            )}
          >
            {label}
          </span>
        </div>

        {/* Value */}
        <div
          className={cn(
            'font-mono font-bold tracking-tight mb-1',
            sizes.value,
            colors.value
          )}
        >
          {value}
        </div>

        {/* Sublabel + Trend */}
        <div className="flex items-center justify-between">
          {sublabel && (
            <span className={cn('text-muted-foreground', sizes.sublabel)}>
              {sublabel}
            </span>
          )}
          {trend && <TrendIndicator trend={trend} size={size} />}
        </div>

        {/* Custom children */}
        {children}

        {/* Link label */}
        {href && linkLabel && (
          <div className="mt-3 pt-2 border-t border-border">
            <span className="text-sm text-primary group-hover:opacity-80 transition-colors">
              {linkLabel} →
            </span>
          </div>
        )}
      </div>

      {/* Bottom border glow on hover */}
      {(href || onClick) && (
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `linear-gradient(90deg, transparent, ${colors.glow}, transparent)`,
          }}
        />
      )}
    </Card>
  );

  if (href) {
    return (
      <a href={href} className="block" onClick={onClick}>
        {cardContent}
      </a>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full text-left">
        {cardContent}
      </button>
    );
  }

  return cardContent;
}

CardVariant.displayName = 'CardVariant';
