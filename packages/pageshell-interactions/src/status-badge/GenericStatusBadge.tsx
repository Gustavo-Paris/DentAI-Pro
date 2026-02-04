/**
 * GenericStatusBadge Component
 *
 * A typed wrapper for StatusBadge that provides config-based variant/label mapping.
 * Use this when you need a type-safe status badge with custom status → variant mappings.
 *
 * For common domain status badges (proposal, session, user, etc.), prefer using
 * StatusBadge from @pageshell/primitives with the preset prop directly.
 *
 * @example With typed config
 * ```tsx
 * const orderStatusConfig = defineStatusBadgeConfig({
 *   pending: { variant: 'warning', label: 'Pending' },
 *   processing: { variant: 'info', label: 'Processing', animate: true },
 *   shipped: { variant: 'success', label: 'Shipped' },
 *   cancelled: { variant: 'destructive', label: 'Cancelled' },
 * });
 *
 * <GenericStatusBadge status={order.status} config={orderStatusConfig} />
 * ```
 *
 * @example With i18n labels
 * ```tsx
 * function OrderStatusBadge({ status }: { status: OrderStatus }) {
 *   const t = useTranslations('orders.status');
 *   return (
 *     <GenericStatusBadge
 *       status={status}
 *       config={orderStatusConfig}
 *       labelResolver={(key) => t(key)}
 *     />
 *   );
 * }
 * ```
 *
 * @module status-badge
 */

'use client';

import { StatusBadge, PageIcon, type StatusVariant } from '@pageshell/primitives';
import { cn } from '@pageshell/core';

// =============================================================================
// Types
// =============================================================================

/**
 * Configuration for a single status value
 */
export interface StatusBadgeConfigItem {
  /** The visual variant for this status */
  variant: StatusVariant;
  /** Default label (can be overridden by labelResolver) */
  label: string;
  /** Icon to show before the label */
  icon?: string;
  /** Show spinning animation (for in-progress states) */
  animate?: boolean;
  /** Show pulsing animation (for attention states) */
  pulse?: boolean;
  /** Show dot indicator before label */
  withDot?: boolean;
}

/**
 * Full configuration mapping status values to their display config
 */
export type StatusBadgeConfig<T extends string> = Record<T, StatusBadgeConfigItem>;

/**
 * Props for GenericStatusBadge component
 */
export interface GenericStatusBadgeProps<T extends string> {
  /** The status value to display */
  status: T;
  /** Configuration mapping status → variant/label */
  config: StatusBadgeConfig<T>;
  /** Optional label resolver (e.g., for i18n) */
  labelResolver?: (status: T) => string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
  /** Test ID for automated testing */
  testId?: string;
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Factory function to create typed status badge configurations.
 * Provides type safety and autocompletion for status values.
 *
 * @example
 * ```tsx
 * const paymentStatus = defineStatusBadgeConfig({
 *   pending: { variant: 'warning', label: 'Pending Payment' },
 *   paid: { variant: 'success', label: 'Paid' },
 *   refunded: { variant: 'info', label: 'Refunded' },
 *   failed: { variant: 'destructive', label: 'Payment Failed' },
 * });
 *
 * type PaymentStatus = keyof typeof paymentStatus;
 * ```
 */
export function defineStatusBadgeConfig<T extends string>(
  config: StatusBadgeConfig<T>
): StatusBadgeConfig<T> {
  return config;
}

// =============================================================================
// Component
// =============================================================================

/**
 * GenericStatusBadge - A typed wrapper for StatusBadge
 *
 * Provides a config-based approach for mapping status values to visual variants.
 * Supports animation, icons, and i18n through labelResolver.
 */
export function GenericStatusBadge<T extends string>({
  status,
  config,
  labelResolver,
  size = 'md',
  className,
  testId,
}: GenericStatusBadgeProps<T>) {
  const statusConfig = config[status];

  // Fallback for unknown status values
  if (!statusConfig) {
    return (
      <StatusBadge
        variant="default"
        size={size}
        className={className}
        testId={testId}
      >
        {status}
      </StatusBadge>
    );
  }

  const label = labelResolver ? labelResolver(status) : statusConfig.label;

  return (
    <StatusBadge
      variant={statusConfig.variant}
      size={size}
      withDot={statusConfig.withDot}
      className={cn(
        statusConfig.pulse && 'animate-pulse',
        statusConfig.animate && 'gap-1.5',
        className
      )}
      testId={testId}
      aria-label={`Status: ${label}`}
    >
      {statusConfig.animate && statusConfig.icon && (
        <PageIcon name={statusConfig.icon} className="h-3 w-3 animate-spin" />
      )}
      {statusConfig.animate && !statusConfig.icon && (
        <PageIcon name="loader" className="h-3 w-3 animate-spin" />
      )}
      {!statusConfig.animate && statusConfig.icon && (
        <PageIcon name={statusConfig.icon} className="h-3 w-3" />
      )}
      {label}
    </StatusBadge>
  );
}

GenericStatusBadge.displayName = 'GenericStatusBadge';
