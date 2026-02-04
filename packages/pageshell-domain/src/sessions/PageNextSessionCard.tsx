'use client';

/**
 * PageNextSessionCard - Session Info Card
 *
 * Displays session information with mentor info, service title, and formatted date/time.
 * Supports two variants:
 * - `highlight`: For dashboard display with "Próxima Sessão" label
 * - `summary`: For modal display with compact layout
 *
 * @example Highlight variant (dashboard)
 * ```tsx
 * <PageNextSessionCard
 *   variant="highlight"
 *   mentorName="João Silva"
 *   serviceTitle="Mentoria de Carreira"
 *   scheduledAt={new Date('2025-01-15T14:00:00')}
 * />
 * ```
 *
 * @example Summary variant (modals)
 * ```tsx
 * <PageNextSessionCard
 *   variant="summary"
 *   mentorName="João Silva"
 *   mentorImage="https://example.com/avatar.jpg"
 *   serviceTitle="Mentoria de Carreira"
 *   scheduledAt={new Date('2025-01-15T14:00:00')}
 *   durationMinutes={60}
 * />
 * ```
 */

import { cn } from '@pageshell/core';
import { PageIcon } from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

export type PageNextSessionCardVariant = 'highlight' | 'summary';

export type PageNextSessionCardEmphasis = 'service' | 'mentor';

export interface PageNextSessionCardProps {
  /** Visual variant */
  variant?: PageNextSessionCardVariant;
  /** Mentor/person name */
  mentorName: string;
  /** Mentor avatar image URL */
  mentorImage?: string | null;
  /** Service/session title */
  serviceTitle: string;
  /** Scheduled date and time */
  scheduledAt: Date;
  /** Session duration in minutes (shown in summary variant) */
  durationMinutes?: number;
  /** Animation delay index (highlight variant only) */
  animationDelay?: number;
  /** Label prefix for summary variant (e.g., "com" for student view, "Aluno:" for mentor view) */
  labelPrefix?: string;
  /** What to emphasize first in summary variant (default: 'service') */
  emphasis?: PageNextSessionCardEmphasis;
  /** Additional className */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function PageNextSessionCard({
  variant = 'highlight',
  mentorName,
  mentorImage,
  serviceTitle,
  scheduledAt,
  durationMinutes,
  animationDelay = 2,
  labelPrefix = 'com',
  emphasis = 'service',
  className,
}: PageNextSessionCardProps) {
  const mentorInitial = mentorName.charAt(0).toUpperCase();

  if (variant === 'summary') {
    return <SummaryVariant {...{ mentorName, mentorImage, mentorInitial, serviceTitle, scheduledAt, durationMinutes, labelPrefix, emphasis, className }} />;
  }

  return <HighlightVariant {...{ mentorName, mentorImage, mentorInitial, serviceTitle, scheduledAt, animationDelay, className }} />;
}

// =============================================================================
// Highlight Variant (Dashboard)
// =============================================================================

interface HighlightVariantProps {
  mentorName: string;
  mentorImage?: string | null;
  mentorInitial: string;
  serviceTitle: string;
  scheduledAt: Date;
  animationDelay: number;
  className?: string;
}

function HighlightVariant({
  mentorName,
  mentorImage,
  mentorInitial,
  serviceTitle,
  scheduledAt,
  animationDelay,
  className,
}: HighlightVariantProps) {
  const formattedTime = scheduledAt.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedDate = scheduledAt.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div
      className={cn(
        'portal-next-session',
        'portal-animate-in',
        `portal-animate-in-delay-${animationDelay}`,
        className
      )}
    >
      <div className="portal-next-session-label">
        <PageIcon name="sparkles" className="w-3 h-3" />
        Próxima Sessão
      </div>
      <div className="portal-next-session-content">
        <div className="portal-next-session-info">
          <div className="portal-next-session-avatar">
            {mentorImage ? (
              <img src={mentorImage} alt={mentorName} />
            ) : (
              mentorInitial
            )}
          </div>
          <div className="portal-next-session-details">
            <h3>{mentorName}</h3>
            <p>{serviceTitle}</p>
          </div>
        </div>
        <div className="portal-next-session-time">
          <span className="portal-next-session-countdown">{formattedTime}</span>
          <span className="portal-next-session-date">{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Summary Variant (Modals)
// =============================================================================

interface SummaryVariantProps {
  mentorName: string;
  mentorImage?: string | null;
  mentorInitial: string;
  serviceTitle: string;
  scheduledAt: Date;
  durationMinutes?: number;
  labelPrefix: string;
  emphasis: PageNextSessionCardEmphasis;
  className?: string;
}

function SummaryVariant({
  mentorName,
  mentorImage,
  mentorInitial,
  serviceTitle,
  scheduledAt,
  durationMinutes,
  labelPrefix,
  emphasis,
  className,
}: SummaryVariantProps) {
  // Format date: "segunda-feira, 15 de janeiro"
  const formattedDate = scheduledAt.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // Format time: "14:00"
  const formattedTime = scheduledAt.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Determine content order based on emphasis
  const primaryText = emphasis === 'mentor' ? mentorName : serviceTitle;
  const secondaryText = emphasis === 'mentor' ? serviceTitle : `${labelPrefix} ${mentorName}`;

  return (
    <div className={cn('rounded-lg border bg-muted/50 p-4', className)}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center overflow-hidden">
          {mentorImage ? (
            <img
              src={mentorImage}
              alt={mentorName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-muted-foreground">
              {mentorInitial}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground truncate">
            {primaryText}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {secondaryText}
          </p>

          {/* Date and Time */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <PageIcon name="calendar" className="h-3.5 w-3.5" />
              <span className="capitalize">{formattedDate}</span>
            </span>
            <span className="flex items-center gap-1">
              <PageIcon name="clock" className="h-3.5 w-3.5" />
              {formattedTime}
              {durationMinutes && ` (${durationMinutes}min)`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
