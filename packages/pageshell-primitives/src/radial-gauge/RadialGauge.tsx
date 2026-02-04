'use client';

/**
 * RadialGauge Component
 *
 * A glowing circular progress indicator.
 * The hero "wow" element for usage analytics pages.
 *
 * @module radial-gauge
 */

import { useEffect, useState, useId } from 'react';
import { cn, getGaugeColors } from '@pageshell/core';
import type { RadialGaugeProps } from './types';

/**
 * Default value formatter
 */
const defaultFormat = (value: number) => value.toFixed(2);

/**
 * RadialGauge - Circular progress indicator with glow effects
 *
 * Features:
 * - SVG glow filter for premium look
 * - Configurable tick marks
 * - Glowing dot at arc end
 * - Pulse animation when critical (>=90%)
 * - Smooth arc animation on mount
 *
 * @example
 * ```tsx
 * <RadialGauge
 *   value={75.50}
 *   max={100}
 *   label="Monthly Budget"
 *   sublabel="Creator Portal"
 *   formatValue={(v) => formatUsd(v)}
 *   formatMax={(v) => formatUsd(v)}
 * />
 * ```
 */
export function RadialGauge({
  value,
  max,
  label,
  sublabel,
  size = 240,
  strokeWidth = 12,
  showValue = true,
  animated = true,
  showTicks = true,
  tickCount = 12,
  animationDuration = 1500,
  formatValue = defaultFormat,
  formatMax = defaultFormat,
  className,
}: RadialGaugeProps) {
  const uniqueId = useId();
  const [animatedValue, setAnimatedValue] = useState(animated ? 0 : value);

  const percentage = max > 0 ? Math.min((animatedValue / max) * 100, 100) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colors = getGaugeColors(percentage);
  const isCritical = percentage >= 90;

  // Filter and gradient IDs (must be unique per instance)
  const filterId = `gauge-glow-${uniqueId}`;
  const gradientId = `gauge-gradient-${uniqueId}`;

  // Animate on mount
  useEffect(() => {
    if (!animated) {
      setAnimatedValue(value);
      return;
    }

    const startTime = performance.now();
    const startValue = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (value - startValue) * eased;

      setAnimatedValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, animated, animationDuration]);

  // Calculate dot position on the arc
  const dotAngle = ((percentage * 3.6) - 90) * (Math.PI / 180);
  const dotX = size / 2 + radius * Math.cos(dotAngle);
  const dotY = size / 2 + radius * Math.sin(dotAngle);

  return (
    <div
      className={cn('radial-gauge-container relative', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="radial-gauge">
        <defs>
          {/* Glow filter */}
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradient for the arc */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.main} stopOpacity="1" />
            <stop offset="100%" stopColor={colors.main} stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
          className="gauge-track"
        />

        {/* Decorative tick marks */}
        {showTicks &&
          Array.from({ length: tickCount }).map((_, i) => {
            const angle = ((i * (360 / tickCount)) - 90) * (Math.PI / 180);
            const innerRadius = radius - strokeWidth / 2 - 8;
            const outerRadius = radius - strokeWidth / 2 - 4;
            return (
              <line
                key={i}
                x1={size / 2 + innerRadius * Math.cos(angle)}
                y1={size / 2 + innerRadius * Math.sin(angle)}
                x2={size / 2 + outerRadius * Math.cos(angle)}
                y2={size / 2 + outerRadius * Math.sin(angle)}
                stroke="var(--color-border)"
                strokeWidth="1"
                opacity={0.5}
              />
            );
          })}

        {/* Progress arc with glow */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          filter={`url(#${filterId})`}
          className="gauge-progress"
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
            transition: animated ? 'none' : 'stroke-dashoffset 0.5s ease',
          }}
        />

        {/* Glowing dot at end of arc */}
        {percentage > 0 && (
          <circle
            cx={dotX}
            cy={dotY}
            r={strokeWidth / 2 + 2}
            fill={colors.main}
            filter={`url(#${filterId})`}
            className="gauge-dot"
          />
        )}
      </svg>

      {/* Center content */}
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div
            className="text-3xl font-bold"
            style={{ color: colors.main }}
          >
            {percentage.toFixed(0)}%
          </div>
          <div className="text-lg font-semibold text-foreground">
            {formatValue(animatedValue)}
          </div>
          <div className="text-sm text-muted-foreground">
            de {formatMax(max)}
          </div>
          <div className="text-sm font-medium text-foreground mt-1">
            {label}
          </div>
          {sublabel && (
            <div className="text-xs text-muted-foreground">{sublabel}</div>
          )}
        </div>
      )}

      {/* Pulse animation when critical */}
      {isCritical && (
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-20"
          style={{
            borderWidth: 2,
            borderStyle: 'solid',
            borderColor: colors.main,
          }}
        />
      )}
    </div>
  );
}

RadialGauge.displayName = 'RadialGauge';
