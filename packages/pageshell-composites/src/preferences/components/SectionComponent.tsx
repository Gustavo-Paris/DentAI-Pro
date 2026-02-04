/**
 * SectionComponent
 *
 * Preference section with header and toggle rows.
 *
 * @module preferences/components/SectionComponent
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { resolveIcon } from '@pageshell/primitives';
import type { PreferenceSection } from '../types';
import { iconColorClasses } from '../constants';
import { ToggleRow } from './ToggleRow';

export interface SectionComponentProps {
  section: PreferenceSection;
  values: Record<string, boolean>;
  onToggle: (key: string) => void;
  loadingKeys: Set<string>;
}

export function SectionComponent({
  section,
  values,
  onToggle,
  loadingKeys,
}: SectionComponentProps) {
  const Icon = resolveIcon(section.icon);
  const sectionTitleId = `section-${section.id}-title`;

  return (
    <section aria-labelledby={sectionTitleId} className="space-y-4">
      {/* Section Header */}
      <header className="flex items-center gap-3">
        {Icon && (
          <div
            className={cn(
              'h-10 w-10 rounded-lg flex items-center justify-center',
              'bg-primary/10',
              section.iconColor
                ? iconColorClasses[section.iconColor]
                : 'text-primary'
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h3 id={sectionTitleId} className="text-base font-semibold text-foreground">
            {section.title}
          </h3>
          {section.description && (
            <p className="text-sm text-muted-foreground">{section.description}</p>
          )}
        </div>
      </header>

      {/* Preferences Group */}
      <div role="group" aria-label={section.title} className="divide-y divide-border">
        {section.preferences.map((pref) => (
          <ToggleRow
            key={pref.key}
            preference={pref}
            checked={values[pref.key] ?? pref.defaultValue ?? false}
            onToggle={() => onToggle(pref.key)}
            isLoading={loadingKeys.has(pref.key)}
          />
        ))}
      </div>
    </section>
  );
}

SectionComponent.displayName = 'SectionComponent';
