'use client';

/**
 * PageAppointmentReminder
 *
 * Reminder card for a patient appointment. Shows patient name,
 * date/time, procedure, delivery channel badge, and a send/resend button.
 *
 * @example
 * ```tsx
 * <PageAppointmentReminder
 *   patientName="Maria Silva"
 *   date="2026-02-20"
 *   time="14:00"
 *   procedure="Canal Treatment"
 *   channel="whatsapp"
 *   sent={false}
 *   onSend={() => sendReminder(id)}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { Button, PageIcon, StatusBadge } from '@parisgroup-ai/pageshell/primitives';
import type { AppointmentReminder } from './types';

// =============================================================================
// Helpers
// =============================================================================

const CHANNEL_ICON: Record<AppointmentReminder['channel'], string> = {
  sms: 'message-square',
  email: 'mail',
  whatsapp: 'message-circle',
};

const CHANNEL_LABEL: Record<AppointmentReminder['channel'], string> = {
  sms: 'SMS',
  email: 'Email',
  whatsapp: 'WhatsApp',
};

// =============================================================================
// Props
// =============================================================================

/** Props for {@link PageAppointmentReminder} */
export interface PageAppointmentReminderProps {
  /** Patient display name */
  patientName: string;
  /** Appointment date (YYYY-MM-DD) */
  date: string;
  /** Appointment time (HH:mm) */
  time: string;
  /** Procedure name */
  procedure: string;
  /** Delivery channel */
  channel: AppointmentReminder['channel'];
  /** Whether the reminder has already been sent */
  sent: boolean;
  /** Send or resend handler */
  onSend?: () => void;
  /** Whether the send action is in progress */
  sending?: boolean;
  /** Stagger animation delay in ms */
  animationDelay?: number;
  /** Additional CSS classes */
  className?: string;
  /** i18n override: send button label */
  i18nSendLabel?: string;
  /** i18n override: resend button label */
  i18nResendLabel?: string;
  /** i18n override: sent indicator label */
  i18nSentLabel?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Card showing a patient appointment reminder with send controls.
 */
export function PageAppointmentReminder({
  patientName,
  date,
  time,
  procedure,
  channel,
  sent,
  onSend,
  sending = false,
  animationDelay,
  className,
  i18nSendLabel,
  i18nResendLabel,
  i18nSentLabel,
}: PageAppointmentReminderProps) {
  const sendLabel =
    i18nSendLabel ??
    tPageShell('domain.odonto.appointments.reminder.send', 'Send');
  const resendLabel =
    i18nResendLabel ??
    tPageShell('domain.odonto.appointments.reminder.resend', 'Resend');
  const sentLabel =
    i18nSentLabel ??
    tPageShell('domain.odonto.appointments.reminder.sent', 'Sent');
  const sendingLabel = tPageShell(
    'domain.odonto.appointments.reminder.sending',
    'Sending...',
  );

  const channelLabel = tPageShell(
    `domain.odonto.appointments.reminder.channel.${channel}`,
    CHANNEL_LABEL[channel],
  );

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 shadow-sm',
        className,
      )}
      style={animationDelay ? { animationDelay: `${animationDelay}ms` } : undefined}
    >
      {/* Header: patient + channel badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{patientName}</p>
          <p className="text-xs text-muted-foreground">
            {date} &middot; {time}
          </p>
        </div>
        <StatusBadge
          label={channelLabel}
          variant="outline"
          icon={CHANNEL_ICON[channel]}
        />
      </div>

      {/* Procedure */}
      <p className="mt-2 text-sm text-muted-foreground">{procedure}</p>

      {/* Footer: sent status + action */}
      <div className="mt-3 flex items-center justify-between">
        {sent ? (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <PageIcon name="check-circle" className="h-3.5 w-3.5" aria-hidden />
            {sentLabel}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/70">
            {tPageShell('domain.odonto.appointments.reminder.pending', 'Not sent yet')}
          </span>
        )}

        {onSend && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSend}
            disabled={sending}
          >
            {sending ? sendingLabel : sent ? resendLabel : sendLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
