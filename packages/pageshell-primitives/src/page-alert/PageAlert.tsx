/**
 * PageAlert Primitive
 *
 * Feedback component for displaying important messages to users.
 * Supports multiple variants, dismissible state, and optional actions.
 *
 * @module page-alert
 */

'use client';

import { useState, useEffect, forwardRef, type ReactNode } from 'react';
import { cn } from '@pageshell/core';
import { Button } from '../button';
import { resolveIcon, type IconProp } from '../icons';

// =============================================================================
// Types
// =============================================================================

/** Alert variants */
export type PageAlertVariant = 'info' | 'success' | 'warning' | 'error';

/** Alert action configuration */
export interface PageAlertAction {
  /** Action label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Disable action */
  disabled?: boolean;
}

/**
 * PageAlert component props
 */
export interface PageAlertProps {
  /** Alert variant (default: 'info') */
  variant?: PageAlertVariant;
  /** Alert title */
  title: string;
  /** Alert description */
  description?: string;
  /** Custom icon (overrides default) */
  icon?: IconProp;

  // Action
  /** Optional action button */
  action?: PageAlertAction;

  // Dismiss
  /** Show dismiss button */
  dismissible?: boolean;
  /** Dismiss handler */
  onDismiss?: () => void;
  /** LocalStorage key to persist dismissed state */
  persistKey?: string;

  // Animation
  /** Animation class (e.g., 'portal-animate-in') */
  animateClass?: string;

  // Layout
  /** Full width (no border radius) */
  fullWidth?: boolean;

  // Accessibility
  /** Accessible label */
  ariaLabel?: string;
  /** Test ID */
  testId?: string;
  /** Additional CSS classes */
  className?: string;
  /** Additional content */
  children?: ReactNode;
}

// =============================================================================
// Constants
// =============================================================================

const defaultIcons: Record<PageAlertVariant, IconProp> = {
  info: 'info',
  success: 'check-circle',
  warning: 'alert-triangle',
  error: 'x-circle',
};

const variantStyles: Record<
  PageAlertVariant,
  {
    container: string;
    icon: string;
    title: string;
    description: string;
    action: string;
    dismiss: string;
  }
> = {
  info: {
    container: 'bg-info/10 border-info/20',
    icon: 'text-info',
    title: 'text-info',
    description: 'text-info/80',
    action: 'text-info hover:text-info/80',
    dismiss: 'text-info/60 hover:text-info hover:bg-info/10',
  },
  success: {
    container: 'bg-success/10 border-success/20',
    icon: 'text-success',
    title: 'text-success',
    description: 'text-success/80',
    action: 'text-success hover:text-success/80',
    dismiss: 'text-success/60 hover:text-success hover:bg-success/10',
  },
  warning: {
    container: 'bg-warning/10 border-warning/20',
    icon: 'text-warning',
    title: 'text-warning',
    description: 'text-warning/80',
    action: 'text-warning hover:text-warning/80',
    dismiss: 'text-warning/60 hover:text-warning hover:bg-warning/10',
  },
  error: {
    container: 'bg-destructive/10 border-destructive/20',
    icon: 'text-destructive',
    title: 'text-destructive',
    description: 'text-destructive/80',
    action: 'text-destructive hover:text-destructive/80',
    dismiss: 'text-destructive/60 hover:text-destructive hover:bg-destructive/10',
  },
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if alert was dismissed (from localStorage)
 */
function isDismissedPersisted(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(`page-alert-dismissed:${key}`) === 'true';
  } catch {
    return false;
  }
}

/**
 * Persist dismissed state to localStorage
 */
function persistDismissed(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`page-alert-dismissed:${key}`, 'true');
  } catch {
    // Ignore localStorage errors
  }
}

// =============================================================================
// PageAlert Component
// =============================================================================

/**
 * PageAlert - Feedback component for important messages
 *
 * @example Basic info alert
 * <PageAlert
 *   variant="info"
 *   title="Dica"
 *   description="Você pode arrastar e soltar para reordenar os módulos."
 * />
 *
 * @example Success alert with action
 * <PageAlert
 *   variant="success"
 *   title="Curso publicado!"
 *   description="Seu curso está disponível para os alunos."
 *   action={{
 *     label: "Ver curso",
 *     onClick: () => router.push(`/courses/${courseId}`),
 *   }}
 * />
 *
 * @example Dismissible warning
 * <PageAlert
 *   variant="warning"
 *   title="Atenção"
 *   description="Algumas aulas ainda não foram publicadas."
 *   dismissible
 *   onDismiss={() => setShowWarning(false)}
 * />
 *
 * @example Persistent alert (remembers dismiss)
 * <PageAlert
 *   variant="info"
 *   title="Novidade!"
 *   description="Confira as novas funcionalidades do editor."
 *   dismissible
 *   persistKey="editor-new-features-v2"
 * />
 */
const PageAlertBase = forwardRef<HTMLDivElement, PageAlertProps>(
  function PageAlert(
    {
      variant = 'info',
      title,
      description,
      icon,
      action,
      dismissible = false,
      onDismiss,
      persistKey,
      animateClass,
      fullWidth = false,
      ariaLabel,
      testId,
      className,
      children,
    },
    ref
  ) {
    const [isDismissed, setIsDismissed] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    // Check persisted dismissed state on mount
    useEffect(() => {
      if (persistKey && isDismissedPersisted(persistKey)) {
        setIsDismissed(true);
        setIsVisible(false);
      }
    }, [persistKey]);

    // Handle dismiss
    const handleDismiss = () => {
      if (animateClass) {
        setIsExiting(true);
        // Wait for exit animation
        setTimeout(() => {
          setIsVisible(false);
          setIsDismissed(true);
          if (persistKey) {
            persistDismissed(persistKey);
          }
          onDismiss?.();
        }, 200);
      } else {
        setIsVisible(false);
        setIsDismissed(true);
        if (persistKey) {
          persistDismissed(persistKey);
        }
        onDismiss?.();
      }
    };

    // Don't render if dismissed
    if (isDismissed || !isVisible) {
      return null;
    }

    // Get styles
    const styles = variantStyles[variant];
    const IconComponent = resolveIcon(icon) ?? resolveIcon(defaultIcons[variant]);
    const CloseIcon = resolveIcon('x');

    return (
      <div
        ref={ref}
        role="alert"
        aria-label={ariaLabel ?? title}
        data-testid={testId}
        className={cn(
          'relative flex gap-3 border p-4',
          !fullWidth && 'rounded-lg',
          styles.container,
          !isExiting && animateClass,
          isExiting && 'animate-out fade-out-0 slide-out-to-top-2 duration-200',
          className
        )}
      >
        {/* Icon */}
        {IconComponent && (
          <div className="flex-shrink-0 mt-0.5">
            <IconComponent className={cn('h-5 w-5', styles.icon)} aria-hidden="true" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={cn('text-sm font-medium', styles.title)}>{title}</h4>
          {description && (
            <p className={cn('mt-1 text-sm', styles.description)}>{description}</p>
          )}
          {children && <div className="mt-2">{children}</div>}
          {action && (
            <div className="mt-3">
              <Button
                variant="link"
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn('h-auto p-0 font-medium', styles.action)}
              >
                {action.label}
              </Button>
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {dismissible && CloseIcon && (
          <button
            type="button"
            onClick={handleDismiss}
            className={cn(
              'flex-shrink-0 p-1 rounded-sm transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              styles.dismiss
            )}
            aria-label="Close alert"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

PageAlertBase.displayName = 'PageAlert';

// =============================================================================
// PageAlertGroup Component
// =============================================================================

export interface PageAlertGroupProps {
  /** Alerts to display */
  children: ReactNode;
  /** Gap between alerts */
  gap?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

/**
 * PageAlertGroup - Container for multiple alerts
 *
 * @example
 * <PageAlertGroup>
 *   <PageAlert variant="warning" title="Aviso 1" />
 *   <PageAlert variant="info" title="Dica" />
 * </PageAlertGroup>
 */
export function PageAlertGroup({ children, gap = 'md', className }: PageAlertGroupProps) {
  const gapClasses: Record<string, string> = {
    sm: 'space-y-2',
    md: 'space-y-3',
    lg: 'space-y-4',
  };

  return (
    <div className={cn(gapClasses[gap], className)} role="region" aria-label="Alerts">
      {children}
    </div>
  );
}

// Attach compound component and export
export const PageAlert = Object.assign(PageAlertBase, {
  Group: PageAlertGroup,
});
