'use client';

/**
 * PageSessionCard - Session Card Primitive
 *
 * Displays session information with mentor info, status, and actions.
 * Composes PageNextSessionCard internally for the info display.
 *
 * @example
 * ```tsx
 * <PageSessionCard
 *   mentorName="João Silva"
 *   mentorImage="https://example.com/avatar.jpg"
 *   serviceTitle="Mentoria de Carreira"
 *   scheduledAt={new Date('2025-01-15T14:00:00')}
 *   durationMinutes={60}
 *   status="scheduled"
 *   statusConfig={{
 *     scheduled: { label: 'Agendada', variant: 'warning' },
 *     confirmed: { label: 'Confirmada', variant: 'success' },
 *   }}
 *   actions={[
 *     { id: 'join', label: 'Entrar', icon: 'video', variant: 'default' },
 *     { id: 'cancel', label: 'Cancelar', icon: 'x', variant: 'destructive' },
 *   ]}
 *   onAction={(actionId) => console.log(actionId)}
 * />
 * ```
 */

import { cn, useHandlerMap } from '@pageshell/core';
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  PageIcon,
  StatusBadge,
  type StatusBadgeProps,
} from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

export type PageSessionCardStatus = string;

export type PageSessionCardActionId = string;

export interface PageSessionCardStatusConfig {
  label: string;
  variant: StatusBadgeProps['variant'];
}

export interface PageSessionCardAction {
  /** Unique action identifier */
  id: PageSessionCardActionId;
  /** Button label */
  label: string;
  /** Icon name */
  icon?: 'video' | 'x' | 'calendar-clock' | 'star' | 'eye';
  /** Button variant */
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  /** Whether action is enabled */
  enabled?: boolean;
  /** Whether to show in primary actions (vs dropdown) */
  primary?: boolean;
}

/** Upcoming session highlight configuration */
export type PageSessionCardUpcomingVariant = 'very-close' | 'soon';

export interface PageSessionCardUpcomingConfig {
  /** Highlight variant: 'very-close' (< 1h, pulsing) or 'soon' (< 24h) */
  variant: PageSessionCardUpcomingVariant;
  /** Countdown label to display (e.g., "Em 2h 30min", "Começa em breve!") */
  countdownLabel: string;
}

/** Card display variant */
export type PageSessionCardVariant = 'full' | 'summary';

export interface PageSessionCardProps {
  /** Card variant: 'full' (with status/actions) or 'summary' (minimal info) */
  variant?: PageSessionCardVariant;
  /** Mentor/person name */
  mentorName: string;
  /** Mentor avatar image URL */
  mentorImage?: string | null;
  /** Service/session title */
  serviceTitle: string;
  /** Scheduled date and time */
  scheduledAt: Date;
  /** Session duration in minutes */
  durationMinutes?: number;
  /** Session status (required for 'full' variant) */
  status?: PageSessionCardStatus;
  /** Status configuration (labels and variants per status) */
  statusConfig?: Record<string, PageSessionCardStatusConfig>;
  /** Available actions */
  actions?: PageSessionCardAction[];
  /** Action callback */
  onAction?: (actionId: PageSessionCardActionId) => void;
  /** Optional notes to display */
  notes?: string | null;
  /**
   * Upcoming highlight configuration (declarative).
   * If provided, shows highlight ring and countdown badge.
   */
  upcoming?: PageSessionCardUpcomingConfig;
  /** Additional className for card */
  className?: string;
  /** Actions variant */
  actionsVariant?: 'default' | 'compact';
  /** Card emphasis style (for summary variant) */
  emphasis?: 'default' | 'subtle';
}

// =============================================================================
// Icon Map
// =============================================================================

const ICON_NAMES = {
  video: 'video',
  x: 'x',
  'calendar-clock': 'calendar-clock',
  star: 'star',
  eye: 'eye',
} as const;

// =============================================================================
// Component
// =============================================================================

export function PageSessionCard({
  variant = 'full',
  mentorName,
  mentorImage,
  serviceTitle,
  scheduledAt,
  durationMinutes,
  status,
  statusConfig,
  actions = [],
  onAction,
  notes,
  upcoming,
  className,
  actionsVariant = 'default',
  emphasis = 'default',
}: PageSessionCardProps) {
  const mentorInitial = mentorName.charAt(0).toUpperCase();
  const statusInfo = status && statusConfig ? statusConfig[status] : undefined;
  const isVeryClose = upcoming?.variant === 'very-close';
  const isSummary = variant === 'summary';

  // Format date and time
  const formattedDate = scheduledAt.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const formattedTime = scheduledAt.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Split actions into primary and secondary
  const primaryActions = actions.filter((a) => a.primary !== false && (a.id === 'join' || a.id === 'cancel' || a.primary));
  const secondaryActions = actions.filter((a) => !primaryActions.includes(a));

  const handleAction = (actionId: string) => {
    onAction?.(actionId);
  };

  // Determine ring style based on upcoming variant
  const ringClassName = upcoming
    ? isVeryClose
      ? 'ring-2 ring-primary ring-offset-2'
      : 'ring-2 ring-warning ring-offset-2'
    : undefined;

  const cardContent = (
    <div className={cn('relative', upcoming && 'pt-3')}>
      {/* Upcoming Badge */}
      {upcoming && (
        <div className="absolute -top-3 left-4 z-10">
          <StatusBadge
            variant={isVeryClose ? 'primary' : 'warning'}
            className={cn('gap-1', isVeryClose && 'animate-pulse')}
          >
            {isVeryClose ? <PageIcon name="zap" className="h-3 w-3" /> : <PageIcon name="clock" className="h-3 w-3" />}
            {upcoming.countdownLabel}
          </StatusBadge>
        </div>
      )}

      <div
        className={cn(
          'rounded-lg border bg-card p-4 sm:p-6 transition-shadow hover:shadow-md',
          ringClassName,
          className
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Session Info */}
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="h-12 w-12 shrink-0 rounded-full bg-muted flex items-center justify-center overflow-hidden">
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

            <div className="min-w-0 flex-1">
              {/* Title + Status */}
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-foreground">
                  {serviceTitle}
                </h3>
                {!isSummary && statusInfo && (
                  <StatusBadge variant={statusInfo.variant}>
                    {statusInfo.label}
                  </StatusBadge>
                )}
              </div>

              {/* Mentor Name */}
              <p className="mt-1 text-sm text-muted-foreground">
                com <span className="font-medium text-foreground">{mentorName}</span>
              </p>

              {/* Date and Time */}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <PageIcon name="calendar" className="h-4 w-4" />
                  <span className="capitalize">{formattedDate}</span>
                </span>
                <span className="flex items-center gap-1">
                  <PageIcon name="clock" className="h-4 w-4" />
                  {formattedTime}{durationMinutes ? ` (${durationMinutes}min)` : ''}
                </span>
              </div>

              {/* Notes */}
              {!isSummary && notes && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  <span className="font-medium">Suas notas:</span> {notes}
                </p>
              )}
            </div>
          </div>

          {/* Actions - Desktop */}
          {!isSummary && actions.length > 0 && actionsVariant === 'default' && (
            <div className="hidden sm:flex flex-wrap items-center gap-2">
              <ActionButtons
                actions={primaryActions}
                secondaryActions={secondaryActions}
                onAction={handleAction}
                variant="default"
              />
            </div>
          )}
        </div>

        {/* Actions - Mobile */}
        {!isSummary && actions.length > 0 && (
          <div className={cn('mt-4', actionsVariant === 'default' && 'sm:hidden')}>
            <ActionButtons
              actions={actionsVariant === 'compact' ? actions.filter((a) => a.id === 'join') : primaryActions}
              secondaryActions={actionsVariant === 'compact' ? actions.filter((a) => a.id !== 'join') : secondaryActions}
              onAction={handleAction}
              variant="compact"
            />
          </div>
        )}
      </div>
    </div>
  );

  return cardContent;
}

// =============================================================================
// Action Buttons
// =============================================================================

interface ActionButtonsProps {
  actions: PageSessionCardAction[];
  secondaryActions: PageSessionCardAction[];
  onAction: (actionId: string) => void;
  variant: 'default' | 'compact';
}

function ActionButtons({ actions, secondaryActions, onAction, variant }: ActionButtonsProps) {
  // Memoized handler for action button clicks - stable reference per action id
  const { getHandler: getActionHandler } = useHandlerMap((actionId: string) => {
    onAction(actionId);
  });

  return (
    <div className="flex items-center gap-2">
      {actions.map((action) => {
        const iconName = action.icon ? ICON_NAMES[action.icon] : null;
        return (
          <Button
            key={action.id}
            variant={action.variant || 'default'}
            size="sm"
            onClick={getActionHandler(action.id)}
            disabled={action.enabled === false}
            className="gap-1"
          >
            {iconName && <PageIcon name={iconName} className="h-4 w-4" />}
            {action.label}
          </Button>
        );
      })}

      {secondaryActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <PageIcon name="more-horizontal" className="h-4 w-4" />
              <span className="sr-only">Mais ações</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {secondaryActions.map((action) => {
              const iconName = action.icon ? ICON_NAMES[action.icon] : null;
              return (
                <DropdownMenuItem
                  key={action.id}
                  onClick={getActionHandler(action.id)}
                  disabled={action.enabled === false}
                  className={action.variant === 'destructive' ? 'text-destructive' : ''}
                >
                  {iconName && <PageIcon name={iconName} className="mr-2 h-4 w-4" />}
                  {action.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
