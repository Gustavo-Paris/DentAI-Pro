'use client';

/**
 * StatusBadge - Reusable status badge with presets
 *
 * Supports two APIs:
 * 1. New API (preset-based): Uses status + preset for automatic label/variant mapping
 * 2. Legacy API: Uses variant + children for custom label (backward compatible)
 *
 * @example With preset (recommended)
 * ```tsx
 * <StatusBadge status={user.status} preset="user" />
 * <StatusBadge status={publication.status} preset="publication" />
 * ```
 *
 * @example Legacy API (backward compatible)
 * ```tsx
 * <StatusBadge variant="success">Active</StatusBadge>
 * <StatusBadge variant="warning" size="sm">Pending</StatusBadge>
 * ```
 */

import type { ReactNode } from 'react';
import { cn } from '@pageshell/core';
import { PageIcon } from '../page-icon';

// =============================================================================
// Types
// =============================================================================

export type StatusVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'
  | 'muted'
  | 'primary'
  | 'accent'
  | 'outline';

export interface StatusConfig {
  label: string;
  variant: StatusVariant;
  /** Icon name (resolved by PageIcon) */
  icon?: string;
  /** Animated pulse for in-progress states */
  pulse?: boolean;
}

export type StatusMapping = Record<string, StatusConfig>;

/**
 * Factory function to create typed status configurations
 *
 * @example
 * const courseStatus = defineStatusConfig({
 *   draft: { variant: 'secondary', icon: 'FileEdit', label: 'Draft' },
 *   published: { variant: 'success', icon: 'Check', label: 'Published' },
 *   pending: { variant: 'warning', icon: 'Clock', pulse: true, label: 'Pending' },
 * });
 */
export function defineStatusConfig<T extends string>(
  config: Record<T, StatusConfig>
): Record<T, StatusConfig> {
  return config;
}

export interface StatusBadgeProps {
  // --- New API (preset-based) ---
  /** The status value to display (new API) */
  status?: string;
  /** Use a preset mapping (user, publication, course, moderation) */
  preset?: keyof typeof statusPresets;
  /** Custom status mapping (overrides preset) */
  config?: StatusMapping;

  // --- Legacy API (variant + children) ---
  /** Color variant (legacy API) */
  variant?: StatusVariant;
  /** Label text (legacy API) */
  children?: ReactNode;
  /** Show a dot indicator before the text */
  withDot?: boolean;

  // --- Shared props ---
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Test ID for automated testing */
  testId?: string;
}

// =============================================================================
// Presets
// =============================================================================

export const statusPresets = {
  // User account states
  user: {
    active: { label: 'Ativo', variant: 'success' },
    suspended: { label: 'Suspenso', variant: 'warning' },
    banned: { label: 'Banido', variant: 'destructive' },
    pending: { label: 'Pendente', variant: 'muted' },
    inactive: { label: 'Inativo', variant: 'muted' },
  },
  // Publication workflow
  publication: {
    ai_approved: { label: 'Aprovado pela IA', variant: 'success' },
    admin_reviewing: { label: 'Em Revisao', variant: 'warning' },
    admin_approved: { label: 'Publicado', variant: 'success' },
    admin_rejected: { label: 'Rejeitado', variant: 'destructive' },
    pending: { label: 'Pendente', variant: 'muted' },
  },
  // Course states
  course: {
    draft: { label: 'Rascunho', variant: 'default' },
    published: { label: 'Publicado', variant: 'success' },
    archived: { label: 'Arquivado', variant: 'muted' },
    under_review: { label: 'Em Revisao', variant: 'warning' },
    pending_review: { label: 'Aguardando Revisao', variant: 'warning' },
  },
  // Moderation workflow
  moderation: {
    pending: { label: 'Pendente', variant: 'warning' },
    approved: { label: 'Aprovado', variant: 'success' },
    rejected: { label: 'Rejeitado', variant: 'destructive' },
    suspended: { label: 'Suspenso', variant: 'warning' },
    banned: { label: 'Banido', variant: 'destructive' },
    reinstated: { label: 'Reabilitado', variant: 'success' },
  },
  // Financial transactions
  transaction: {
    completed: { label: 'Concluído', variant: 'success' },
    paid: { label: 'Pago', variant: 'success' },
    pending: { label: 'Pendente', variant: 'warning' },
    processing: { label: 'Processando', variant: 'info' },
    failed: { label: 'Falhou', variant: 'destructive' },
    refunded: { label: 'Reembolsado', variant: 'warning' },
    cancelled: { label: 'Cancelado', variant: 'destructive' },
  },
  // Binary availability
  availability: {
    active: { label: 'Ativo', variant: 'success' },
    inactive: { label: 'Inativo', variant: 'muted' },
    available: { label: 'Disponível', variant: 'success' },
    unavailable: { label: 'Indisponível', variant: 'muted' },
    online: { label: 'Online', variant: 'success' },
    offline: { label: 'Offline', variant: 'muted' },
  },
  // Proposal workflow
  proposal: {
    draft: { label: 'Rascunho', variant: 'info' },
    pending_validation: { label: 'Validando', variant: 'warning' },
    needs_revision: { label: 'Requer Revisão', variant: 'warning' },
    approved: { label: 'Aprovado', variant: 'success' },
    resources_selected: { label: 'Recursos Selecionados', variant: 'accent' },
    generating: { label: 'Gerando', variant: 'primary' },
    generated: { label: 'Gerado', variant: 'success' },
    validating: { label: 'Validando', variant: 'warning' },
    published: { label: 'Publicado', variant: 'accent' },
    rejected: { label: 'Rejeitado', variant: 'destructive' },
  },
  // Mentorship sessions
  session: {
    scheduled: { label: 'Agendada', variant: 'warning' },
    confirmed: { label: 'Confirmada', variant: 'success' },
    in_progress: { label: 'Em Andamento', variant: 'info' },
    completed: { label: 'Concluída', variant: 'success' },
    cancelled: { label: 'Cancelada', variant: 'destructive' },
    no_show: { label: 'Não Compareceu', variant: 'destructive' },
  },
  // Generic semantic statuses
  semantic: {
    success: { label: 'Sucesso', variant: 'success' },
    warning: { label: 'Atenção', variant: 'warning' },
    error: { label: 'Erro', variant: 'destructive' },
    info: { label: 'Info', variant: 'info' },
    new: { label: 'Novo', variant: 'info' },
    featured: { label: 'Destaque', variant: 'primary' },
    premium: { label: 'Premium', variant: 'accent' },
    verified: { label: 'Verificado', variant: 'success' },
    unverified: { label: 'Não Verificado', variant: 'muted' },
  },
  // Time-based labels
  time: {
    this_week: { label: 'Esta Semana', variant: 'primary' },
    this_month: { label: 'Este Mês', variant: 'primary' },
    today: { label: 'Hoje', variant: 'info' },
    overdue: { label: 'Atrasado', variant: 'destructive' },
    upcoming: { label: 'Em Breve', variant: 'warning' },
  },
} as const satisfies Record<string, StatusMapping>;

// =============================================================================
// Component
// =============================================================================

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
  lg: 'px-3 py-1 text-sm',
};

const dotSizeClasses = {
  sm: 'h-1.5 w-1.5 mr-1',
  md: 'h-2 w-2 mr-1.5',
  lg: 'h-2.5 w-2.5 mr-2',
};

const iconSizeClasses = {
  sm: 'w-3 h-3 mr-0.5',
  md: 'w-3.5 h-3.5 mr-1',
  lg: 'w-4 h-4 mr-1.5',
};

export function StatusBadge({
  // New API
  status,
  preset,
  config,
  // Legacy API
  variant: legacyVariant,
  children,
  withDot = false,
  // Shared
  className,
  size = 'md',
  testId,
}: StatusBadgeProps) {
  // Determine which API is being used
  const isLegacyApi = children !== undefined || (legacyVariant !== undefined && status === undefined);

  let label: ReactNode;
  let variant: StatusVariant;
  let icon: string | undefined;
  let pulse: boolean | undefined;

  if (isLegacyApi) {
    // Legacy API: variant + children
    label = children;
    variant = legacyVariant ?? 'default';
  } else {
    // New API: status + preset/config
    const mapping: StatusMapping | undefined = config ?? (preset ? statusPresets[preset] : undefined);
    const statusConfig = (mapping as StatusMapping | undefined)?.[status ?? ''] ?? {
      label: status ?? '',
      variant: 'default' as StatusVariant,
    };
    label = statusConfig.label;
    variant = statusConfig.variant;
    icon = statusConfig.icon;
    pulse = statusConfig.pulse;
  }

  return (
    <span
      role="status"
      aria-label={typeof label === 'string' ? `Status: ${label}` : undefined}
      data-testid={testId}
      className={cn(
        'portal-badge',
        `portal-badge-${variant}`,
        sizeClasses[size],
        pulse && 'animate-pulse',
        className
      )}
    >
      {withDot && (
        <span
          className={cn(
            'rounded-full',
            dotSizeClasses[size],
            variant === 'success' && 'bg-success',
            variant === 'warning' && 'bg-warning',
            variant === 'destructive' && 'bg-destructive',
            variant === 'info' && 'bg-info',
            variant === 'primary' && 'bg-primary',
            variant === 'accent' && 'bg-accent',
            variant === 'muted' && 'bg-muted-foreground',
            variant === 'default' && 'bg-muted-foreground',
            variant === 'outline' && 'bg-foreground',
          )}
        />
      )}
      {icon && (
        <PageIcon
          name={icon}
          className={iconSizeClasses[size]}
        />
      )}
      {label}
    </span>
  );
}

StatusBadge.displayName = 'StatusBadge';

// =============================================================================
// Utilities
// =============================================================================

/**
 * Get status config for a given status value
 */
export function getStatusConfig(
  status: string,
  preset: keyof typeof statusPresets
): StatusConfig {
  const mapping = statusPresets[preset] as StatusMapping;
  return (
    mapping[status] ?? {
      label: status,
      variant: 'default',
    }
  );
}

/**
 * Check if a status is considered "active" or positive
 */
export function isPositiveStatus(
  status: string,
  preset: keyof typeof statusPresets
): boolean {
  const config = getStatusConfig(status, preset);
  return config.variant === 'success';
}

/**
 * Check if a status is considered "negative" or problematic
 */
export function isNegativeStatus(
  status: string,
  preset: keyof typeof statusPresets
): boolean {
  const config = getStatusConfig(status, preset);
  return config.variant === 'destructive' || config.variant === 'warning';
}

/**
 * Utility function to map common status strings to variants
 * @deprecated Use presets instead. This is kept for backward compatibility.
 */
export function getStatusVariant(
  status: string
): StatusVariant {
  const statusMap: Record<string, StatusVariant> = {
    // Success states
    active: 'success',
    approved: 'success',
    completed: 'success',
    published: 'success',
    resolved: 'success',
    confirmed: 'success',
    paid: 'success',
    online: 'success',

    // Warning states
    pending: 'warning',
    pending_review: 'warning',
    under_review: 'warning',
    in_progress: 'warning',
    in_review: 'warning',
    awaiting: 'warning',
    processing: 'warning',

    // Error states
    rejected: 'destructive',
    suspended: 'destructive',
    banned: 'destructive',
    failed: 'destructive',
    cancelled: 'destructive',
    expired: 'destructive',
    needs_revision: 'destructive',
    offline: 'destructive',

    // Info states
    draft: 'info',
    open: 'info',
    new: 'info',
    scheduled: 'info',

    // Primary states
    featured: 'primary',
    premium: 'primary',
  };

  return statusMap[status.toLowerCase().replace(/\s+/g, '_')] || 'default';
}
