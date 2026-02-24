import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SharedDetailPageProps {
  brandName: string;
  badgeText?: string;
  state: 'loading' | 'expired' | 'data';
  expiredConfig?: {
    title: string;
    description: string;
    cta?: { label: string; href: string };
  };
  footer?: {
    clinicName?: string | null;
    attribution: string;
  };
  maxWidth?: string;
  loadingSkeleton?: ReactNode;
  className?: string;
  children?: ReactNode;
}

function SharedHeader({ brandName, badgeText }: { brandName: string; badgeText?: string }) {
  return (
    <header className="border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <span className="text-lg font-semibold tracking-[0.2em] font-display text-primary">
          {brandName}
        </span>
        {badgeText && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            <svg
              className="w-3 h-3"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {badgeText}
          </span>
        )}
      </div>
    </header>
  );
}

function DefaultSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="h-8 w-48 mb-8 rounded-lg bg-muted animate-pulse" />
      <div className="h-32 w-full mb-4 rounded-xl bg-muted animate-pulse" />
      <div className="h-32 w-full rounded-xl bg-muted animate-pulse" />
    </div>
  );
}

function ExpiredState({ config }: { config?: SharedDetailPageProps['expiredConfig'] }) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <svg
          className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <h1 className="text-xl font-semibold font-display mb-2">{config?.title || 'Link expired'}</h1>
        <p className="text-sm text-muted-foreground mb-6">{config?.description || 'This shared link is no longer available.'}</p>
        {config?.cta && (
          <a
            href={config.cta.href}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            {config.cta.label}
          </a>
        )}
      </div>
    </main>
  );
}

function SharedFooter({ footer }: { footer: NonNullable<SharedDetailPageProps['footer']> }) {
  return (
    <p className="text-center text-xs text-muted-foreground mt-8">
      {footer.clinicName && (
        <>
          {footer.clinicName}
          {' '}&middot;{' '}
        </>
      )}
      {footer.attribution}
    </p>
  );
}

export function SharedDetailPage({
  brandName,
  badgeText,
  state,
  expiredConfig,
  footer,
  maxWidth = 'max-w-2xl',
  loadingSkeleton,
  className,
  children,
}: SharedDetailPageProps) {
  if (state === 'loading') {
    return (
      <div className={cn('min-h-screen bg-background', className)}>
        {loadingSkeleton || <DefaultSkeleton />}
      </div>
    );
  }

  if (state === 'expired') {
    return <ExpiredState config={expiredConfig} />;
  }

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      <SharedHeader brandName={brandName} badgeText={badgeText} />
      <main className={cn('container mx-auto px-4 py-8', maxWidth)}>
        {children}
        {footer && <SharedFooter footer={footer} />}
      </main>
    </div>
  );
}
