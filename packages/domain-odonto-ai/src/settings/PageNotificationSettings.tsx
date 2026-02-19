'use client';

/**
 * PageNotificationSettings - Notification preferences panel
 *
 * Displays a list of notification settings, each with a label, description,
 * enable toggle, and channel badges (email, sms, whatsapp, push).
 *
 * @example
 * ```tsx
 * <PageNotificationSettings
 *   settings={[
 *     {
 *       id: '1',
 *       label: 'Appointment Reminders',
 *       description: 'Receive reminders before appointments',
 *       enabled: true,
 *       channels: ['email', 'sms'],
 *     },
 *   ]}
 *   onToggle={(id, enabled) => console.log(id, enabled)}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon, StatusBadge } from '@parisgroup-ai/pageshell/primitives';

import type { NotificationSetting } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PageNotificationSettingsProps {
  /** List of notification settings */
  settings: NotificationSetting[];
  /** Callback when a notification is toggled */
  onToggle?: (id: string, enabled: boolean) => void;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const CHANNEL_LABEL: Record<NotificationSetting['channels'][number], string> = {
  email: tPageShell('domain.odonto.settings.notifications.channelEmail', 'Email'),
  sms: tPageShell('domain.odonto.settings.notifications.channelSms', 'SMS'),
  whatsapp: tPageShell('domain.odonto.settings.notifications.channelWhatsapp', 'WhatsApp'),
  push: tPageShell('domain.odonto.settings.notifications.channelPush', 'Push'),
};

const CHANNEL_ICON: Record<NotificationSetting['channels'][number], string> = {
  email: 'mail',
  sms: 'message-square',
  whatsapp: 'message-circle',
  push: 'bell',
};

// =============================================================================
// Component
// =============================================================================

export function PageNotificationSettings({
  settings,
  onToggle,
  className,
}: PageNotificationSettingsProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <PageIcon name="bell" className="w-4 h-4 text-muted-foreground" />
        {tPageShell('domain.odonto.settings.notifications.title', 'Notification Preferences')}
      </h3>

      <div className="space-y-3">
        {settings.map((setting) => (
          <div
            key={setting.id}
            className={cn(
              'rounded-lg border border-border p-4',
              !setting.enabled && 'opacity-60',
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">{setting.label}</h4>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{setting.description}</p>

                {/* Channel badges */}
                <div className="flex items-center gap-2 mt-2">
                  {setting.channels.map((channel) => (
                    <span
                      key={channel}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      <PageIcon name={CHANNEL_ICON[channel]} className="w-3 h-3" />
                      {CHANNEL_LABEL[channel]}
                    </span>
                  ))}
                </div>
              </div>

              {/* Toggle */}
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  defaultChecked={setting.enabled}
                  onChange={(e) => onToggle?.(setting.id, e.target.checked)}
                  className="sr-only peer"
                  aria-label={setting.label}
                />
                <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
              </label>
            </div>
          </div>
        ))}

        {settings.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            {tPageShell('domain.odonto.settings.notifications.empty', 'No notification settings configured')}
          </p>
        )}
      </div>
    </div>
  );
}
