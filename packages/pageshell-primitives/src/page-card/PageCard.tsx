/**
 * PageCard Primitive
 *
 * Declarative card component with header, content, and footer sections.
 * Works with or without PageShell context.
 *
 * @module page-card
 */

'use client';

import type { ReactNode } from 'react';
import { cn } from '@pageshell/core';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../card';
import { resolveIcon, type IconProp } from '../icons';

/**
 * Icon color options for portal-styled backgrounds
 */
export type PageCardIconColor = 'violet' | 'emerald' | 'amber' | 'blue' | 'rose' | 'cyan' | 'primary' | 'secondary' | 'accent';

// =============================================================================
// Types
// =============================================================================

/**
 * Card padding variant
 */
export type PageCardPadding = 'none' | 'sm' | 'md' | 'lg';

/**
 * Card semantic variant for visual styling
 */
export type PageCardVariant = 'default' | 'muted' | 'warning' | 'success' | 'error' | 'info';

/**
 * PageCard component props
 */
export interface PageCardProps {
  /** Card title */
  title?: string;
  /** Card description (below title) */
  description?: string;
  /** Card icon (in header) - string name or component */
  icon?: IconProp;
  /** Icon background color (portal-section-icon style). When set, icon gets colored background. */
  iconColor?: PageCardIconColor;
  /** Card content */
  children?: ReactNode;
  /** Footer content */
  footer?: ReactNode;
  /** Content padding (default: 'md') */
  padding?: PageCardPadding;
  /** Visual variant for semantic styling */
  variant?: PageCardVariant;
  /** Animation class (e.g., 'portal-animate-in') */
  animateClass?: string;
  /** Animation delay class (e.g., 'portal-animate-in-delay-1') */
  animateDelayClass?: string;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for automated testing */
  testId?: string;
}

// =============================================================================
// Styling Maps
// =============================================================================

const paddingClasses: Record<PageCardPadding, string> = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const variantClasses: Record<PageCardVariant, string> = {
  default: '',
  muted: 'bg-muted',
  warning: 'border-warning/50 bg-warning/10',
  success: 'border-success/50 bg-success/10',
  error: 'border-destructive/50 bg-destructive/10',
  info: 'border-info/50 bg-info/10',
};

// =============================================================================
// Component
// =============================================================================

/**
 * PageCard - Declarative card primitive
 *
 * Encapsulates Card + CardHeader + CardContent pattern with declarative API.
 * Used for settings sections, info panels, and grouped content.
 *
 * @example Basic usage
 * ```tsx
 * <PageCard title="Configurações">
 *   <SettingsForm />
 * </PageCard>
 * ```
 *
 * @example With description
 * ```tsx
 * <PageCard
 *   title="Garantia de 30 Dias"
 *   description="Não está satisfeito? Solicite reembolso total."
 * >
 *   <RefundButton />
 * </PageCard>
 * ```
 *
 * @example With icon and footer
 * ```tsx
 * <PageCard
 *   title="Plano Premium"
 *   description="Acesso ilimitado a todos os cursos"
 *   icon="crown"
 *   footer={<UpgradeButton />}
 * >
 *   <PlanDetails />
 * </PageCard>
 * ```
 *
 * @example With colored icon background (portal style)
 * ```tsx
 * <PageCard
 *   title="Configurações de PIX"
 *   description="Configure sua chave PIX para receber pagamentos"
 *   icon="wallet"
 *   iconColor="violet"
 * >
 *   <PixForm />
 * </PageCard>
 * ```
 */
export function PageCard({
  title,
  description,
  icon,
  iconColor,
  children,
  footer,
  padding = 'md',
  variant = 'default',
  animateClass,
  animateDelayClass,
  className,
  testId,
}: PageCardProps) {
  const Icon = icon ? resolveIcon(icon) : null;
  const hasHeader = title || description || Icon;

  return (
    <Card
      className={cn(variantClasses[variant], animateClass, animateDelayClass, className)}
      data-testid={testId}
    >
      {hasHeader && (
        <CardHeader>
          <div className="flex items-start gap-3">
            {Icon && (
              iconColor ? (
                // Portal-styled icon with colored background
                <div
                  className={cn('portal-section-icon', iconColor)}
                  aria-hidden="true"
                >
                  <Icon />
                </div>
              ) : (
                // Plain icon without background
                <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              )
            )}
            <div className="flex-1 min-w-0">
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
          </div>
        </CardHeader>
      )}
      {children && (
        <CardContent className={!hasHeader ? paddingClasses[padding] : undefined}>
          {children}
        </CardContent>
      )}
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}
