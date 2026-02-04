/**
 * PageText Primitive
 *
 * Declarative text component with consistent styling variants.
 * Works with or without PageShell context.
 *
 * @module page-text
 */

'use client';

import type { ReactNode, ElementType } from 'react';
import { cn } from '@pageshell/core';

// =============================================================================
// Types
// =============================================================================

/**
 * Text style variant
 */
export type PageTextVariant =
  | 'default' // Normal foreground text
  | 'muted' // Secondary/muted text
  | 'strong' // Bold/emphasized text
  | 'help' // Help text with margin (for form descriptions)
  | 'error' // Error/destructive text
  | 'success' // Success text
  | 'warning' // Warning text
  | 'code'; // Monospace code text

/**
 * Text size
 */
export type PageTextSize = 'xs' | 'sm' | 'base' | 'lg';

/**
 * Text alignment
 */
export type PageTextAlign = 'left' | 'center' | 'right';

/**
 * PageText component props
 */
export interface PageTextProps {
  /** Text content */
  children: ReactNode;
  /** Style variant (default: 'default') */
  variant?: PageTextVariant;
  /** Text size (default: 'sm') */
  size?: PageTextSize;
  /** Text alignment (default: 'left') */
  align?: PageTextAlign;
  /** HTML element to render (default: 'p') */
  as?: ElementType;
  /** Bottom margin (default: 'none', 'help' variant uses 'md') */
  marginBottom?: 'none' | 'sm' | 'md' | 'lg';
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

const variantClasses: Record<PageTextVariant, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  strong: 'font-medium text-foreground',
  help: 'text-muted-foreground',
  error: 'text-destructive',
  success: 'text-success',
  warning: 'text-warning',
  code: 'font-mono text-foreground',
};

const sizeClasses: Record<PageTextSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
};

const alignClasses: Record<PageTextAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const marginClasses: Record<'none' | 'sm' | 'md' | 'lg', string> = {
  none: '',
  sm: 'mb-2',
  md: 'mb-4',
  lg: 'mb-6',
};

// =============================================================================
// Component
// =============================================================================

/**
 * PageText - Declarative text primitive
 *
 * @example Basic usage
 * ```tsx
 * <PageText>Default text content</PageText>
 * <PageText variant="muted">Secondary description text</PageText>
 * <PageText variant="help">Help text with bottom margin</PageText>
 * ```
 *
 * @example With size variants
 * ```tsx
 * <PageText size="xs">Extra small text</PageText>
 * <PageText size="sm" variant="muted">Small muted text</PageText>
 * <PageText size="lg" variant="strong">Large bold text</PageText>
 * ```
 *
 * @example As different elements
 * ```tsx
 * <PageText as="span">Inline text</PageText>
 * <PageText as="label">Label text</PageText>
 * ```
 */
export function PageText({
  children,
  variant = 'default',
  size = 'sm',
  align = 'left',
  as: Component = 'p',
  marginBottom,
  animateClass,
  animateDelayClass,
  className,
  testId,
}: PageTextProps) {
  // Determine margin - 'help' variant defaults to 'md'
  const margin = marginBottom ?? (variant === 'help' ? 'md' : 'none');

  return (
    <Component
      className={cn(
        sizeClasses[size],
        variantClasses[variant],
        alignClasses[align],
        marginClasses[margin],
        animateClass,
        animateDelayClass,
        className
      )}
      data-testid={testId}
    >
      {children}
    </Component>
  );
}
