'use client';

import { useEffect, forwardRef, type ComponentType, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@pageshell/primitives';
import { cn } from '@pageshell/core/utils';

// =============================================================================
// Types
// =============================================================================

/** Link component type for framework-agnostic usage */
export type LinkComponentType = ComponentType<{
  href: string;
  children: ReactNode;
  className?: string;
}>;

/**
 * PageErrorState - Standardized error component for pages and error boundaries
 *
 * Provides consistent error UI with:
 * - Theme-aware styling (works with student, creator, admin themes)
 * - Automatic error logging
 * - Retry and navigation actions
 * - Development mode error details
 *
 * @example In error.tsx file:
 * export default function Error({ error, reset }: ErrorProps) {
 *   return <PageErrorState error={error} reset={reset} />;
 * }
 *
 * @example With custom back link:
 * <PageErrorState
 *   error={error}
 *   reset={reset}
 *   backLink="/creator-portal"
 *   backLabel="Back to Portal"
 * />
 *
 * @example Creator-themed:
 * <PageErrorState error={error} reset={reset} variant="creator" />
 *
 * @example With Next.js Link (for prefetch):
 * import Link from 'next/link';
 * <PageErrorState error={error} reset={reset} LinkComponent={Link} />
 */

type ErrorVariant = 'default' | 'student' | 'creator' | 'admin';

interface PageErrorStateProps {
  /** The error object from error boundary */
  error: Error & { digest?: string };
  /** Reset function from error boundary */
  reset: () => void;
  /** Theme variant for styling */
  variant?: ErrorVariant;
  /** Custom title */
  title?: string;
  /** Custom description */
  description?: string;
  /** Custom back link URL (default: home) */
  backLink?: string;
  /** Custom back link label */
  backLabel?: string;
  /** Hide back/home button */
  hideBackButton?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for automated testing */
  testId?: string;
  /** Custom Link component for framework-agnostic usage (e.g., Next.js Link for prefetch) */
  LinkComponent?: LinkComponentType;
}

const variantStyles: Record<ErrorVariant, {
  container: string;
  iconBg: string;
  iconColor: string;
  errorBg: string;
  errorBorder: string;
  errorText: string;
}> = {
  default: {
    container: 'bg-background',
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    errorBg: 'bg-destructive/5',
    errorBorder: 'border-destructive/20',
    errorText: 'text-destructive',
  },
  student: {
    container: 'bg-background',
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    errorBg: 'bg-destructive/5',
    errorBorder: 'border-destructive/20',
    errorText: 'text-destructive',
  },
  creator: {
    container: 'bg-background',
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    errorBg: 'bg-destructive/5',
    errorBorder: 'border-destructive/20',
    errorText: 'text-destructive',
  },
  admin: {
    container: 'bg-background',
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    errorBg: 'bg-destructive/5',
    errorBorder: 'border-destructive/20',
    errorText: 'text-destructive',
  },
};

export const PageErrorState = forwardRef<HTMLDivElement, PageErrorStateProps>(
  function PageErrorState(
    {
      error,
      reset,
      variant = 'default',
      title = 'Something went wrong',
      description = 'Sorry, we encountered an unexpected error. Our team has been notified.',
      backLink = '/',
      backLabel = 'Back to home',
      hideBackButton = false,
      className,
      testId,
      LinkComponent,
    },
    ref
  ) {
    // Use provided Link component or fallback to anchor tag
    const Link = LinkComponent || 'a';
    const styles = variantStyles[variant];

  useEffect(() => {
    // Log error with context (console.error is acceptable for error boundaries)
    console.error('Page error boundary caught error', {
      message: error.message,
      digest: error.digest,
      variant,
      stack: error.stack,
    });
  }, [error, variant]);

    return (
      <div
        ref={ref}
        role="alert"
        aria-live="assertive"
        data-testid={testId}
        className={cn(
          'min-h-screen flex items-center justify-center p-4',
          'portal-animate-in',
          styles.container,
          className
        )}
      >
      <div className="max-w-md w-full space-y-6 text-center">
        {/* Error Icon */}
        <div
          className={cn(
            'mx-auto w-16 h-16 rounded-full flex items-center justify-center',
            styles.iconBg
          )}
        >
          <AlertTriangle className={cn('w-8 h-8', styles.iconColor)} aria-hidden="true" />
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground">{description}</p>

          {/* Development Error Details */}
          <div
            className={cn(
              'mt-4 p-3 border rounded-lg text-left',
              styles.errorBg,
              styles.errorBorder
            )}
          >
            <p className={cn('text-sm font-mono break-all', styles.errorText)}>
              {error.message}
            </p>
            {error.stack && (
              <details className="mt-2">
                <summary className={cn('text-xs cursor-pointer', styles.errorText)}>
                  Stack trace
                </summary>
                <pre className={cn('text-xs mt-2 overflow-auto max-h-40', styles.errorText)}>
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="default">
            <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
            Tentar novamente
          </Button>
          {!hideBackButton && (
            <Button variant="outline" asChild>
              <Link href={backLink}>
                {backLink === '/' ? (
                  <Home className="w-4 h-4 mr-2" aria-hidden="true" />
                ) : (
                  <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                )}
                {backLabel}
              </Link>
            </Button>
          )}
        </div>

        {/* Error Digest (for support) */}
        {error.digest && (
          <p className="text-xs text-muted-foreground">
            Código do erro: {error.digest}
          </p>
        )}
        </div>
      </div>
    );
  }
);

PageErrorState.displayName = 'PageErrorState';
