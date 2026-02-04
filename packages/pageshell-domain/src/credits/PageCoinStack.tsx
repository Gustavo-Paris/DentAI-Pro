'use client';

/**
 * PageCoinStack - Stacked coins visualization for credits
 *
 * Displays a stack of coins with animation for credit visualization.
 * Shows up to 5 coins with overflow indicator.
 *
 * @example Basic usage
 * ```tsx
 * <PageCoinStack count={10} />
 * ```
 *
 * @example Small size
 * ```tsx
 * <PageCoinStack count={5} size="sm" />
 * ```
 */

import { PageIcon } from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

export interface PageCoinStackProps {
  /** Number of coins/credits to display */
  count: number;
  /** Size variant */
  size?: 'sm' | 'lg';
}

// =============================================================================
// Component
// =============================================================================

export function PageCoinStack({ count, size = 'lg' }: PageCoinStackProps) {
  const displayCount = Math.min(count, 5);
  const sizeClasses = size === 'lg' ? 'w-16 h-16' : 'w-10 h-10';
  const offset = size === 'lg' ? 6 : 4;

  return (
    <div className={`portal-coin-stack portal-coin-stack-${size}`}>
      {Array.from({ length: displayCount }).map((_, i) => (
        <div
          key={i}
          className="portal-coin"
          style={{
            animationDelay: `${i * 100}ms`,
            transform: `translateY(${-i * offset}px)`,
            zIndex: displayCount - i,
          }}
        >
          <PageIcon name="coins" className={sizeClasses} />
        </div>
      ))}
      {count > 5 && (
        <div className="portal-coin-overflow">+{count - 5}</div>
      )}
    </div>
  );
}
