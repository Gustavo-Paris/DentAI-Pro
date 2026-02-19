'use client';

/**
 * PageWorkingHoursEditor - Weekly working hours editor
 *
 * Displays 7 rows (one per day of week), each with an enable toggle,
 * start time, end time, and optional break start/end time inputs.
 *
 * @example
 * ```tsx
 * <PageWorkingHoursEditor
 *   hours={[
 *     { dayOfWeek: 1, enabled: true, startTime: '08:00', endTime: '18:00' },
 *     { dayOfWeek: 2, enabled: true, startTime: '08:00', endTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
 *   ]}
 *   onChange={(hours) => console.log(hours)}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon } from '@parisgroup-ai/pageshell/primitives';

import type { WorkingHours } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PageWorkingHoursEditorProps {
  /** Working hours configuration for each day */
  hours: WorkingHours[];
  /** Callback when hours change */
  onChange?: (hours: WorkingHours[]) => void;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const DAY_LABELS: Record<number, string> = {
  0: tPageShell('domain.odonto.settings.workingHours.sunday', 'Sunday'),
  1: tPageShell('domain.odonto.settings.workingHours.monday', 'Monday'),
  2: tPageShell('domain.odonto.settings.workingHours.tuesday', 'Tuesday'),
  3: tPageShell('domain.odonto.settings.workingHours.wednesday', 'Wednesday'),
  4: tPageShell('domain.odonto.settings.workingHours.thursday', 'Thursday'),
  5: tPageShell('domain.odonto.settings.workingHours.friday', 'Friday'),
  6: tPageShell('domain.odonto.settings.workingHours.saturday', 'Saturday'),
};

const ALL_DAYS: WorkingHours['dayOfWeek'][] = [0, 1, 2, 3, 4, 5, 6];

function getHoursForDay(hours: WorkingHours[], day: number): WorkingHours {
  return (
    hours.find((h) => h.dayOfWeek === day) ?? {
      dayOfWeek: day as WorkingHours['dayOfWeek'],
      enabled: false,
      startTime: '08:00',
      endTime: '18:00',
    }
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function TimeInput({ value, label }: { value: string; label: string }) {
  return (
    <input
      type="time"
      defaultValue={value}
      aria-label={label}
      className="rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
  );
}

function DayRow({ day, hours }: { day: WorkingHours['dayOfWeek']; hours: WorkingHours }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-lg border border-border p-3',
        !hours.enabled && 'opacity-50',
      )}
    >
      {/* Toggle + Day Label */}
      <div className="flex items-center gap-2 min-w-[140px]">
        <input
          type="checkbox"
          defaultChecked={hours.enabled}
          aria-label={DAY_LABELS[day]}
          className="h-4 w-4 rounded border-input"
        />
        <span className="text-sm font-medium">{DAY_LABELS[day]}</span>
      </div>

      {/* Work hours */}
      <div className="flex items-center gap-2">
        <TimeInput
          value={hours.startTime}
          label={tPageShell('domain.odonto.settings.workingHours.startTime', 'Start time')}
        />
        <span className="text-muted-foreground text-xs">
          {tPageShell('domain.odonto.settings.workingHours.to', 'to')}
        </span>
        <TimeInput
          value={hours.endTime}
          label={tPageShell('domain.odonto.settings.workingHours.endTime', 'End time')}
        />
      </div>

      {/* Break */}
      <div className="flex items-center gap-2">
        <PageIcon name="coffee" className="w-3.5 h-3.5 text-muted-foreground" />
        <TimeInput
          value={hours.breakStart ?? ''}
          label={tPageShell('domain.odonto.settings.workingHours.breakStart', 'Break start')}
        />
        <span className="text-muted-foreground text-xs">
          {tPageShell('domain.odonto.settings.workingHours.to', 'to')}
        </span>
        <TimeInput
          value={hours.breakEnd ?? ''}
          label={tPageShell('domain.odonto.settings.workingHours.breakEnd', 'Break end')}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function PageWorkingHoursEditor({
  hours,
  className,
}: PageWorkingHoursEditorProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <PageIcon name="clock" className="w-4 h-4 text-muted-foreground" />
        {tPageShell('domain.odonto.settings.workingHours.title', 'Working Hours')}
      </h3>
      <div className="space-y-2">
        {ALL_DAYS.map((day) => (
          <DayRow key={day} day={day} hours={getHoursForDay(hours, day)} />
        ))}
      </div>
    </div>
  );
}
