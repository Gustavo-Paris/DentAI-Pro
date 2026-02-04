/**
 * PreferencesPage Composite
 *
 * Toggle-based preferences page with grouped sections.
 * Designed for settings pages where users enable/disable features.
 * Framework-agnostic implementation.
 *
 * @module preferences/PreferencesPage
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { Card } from '@pageshell/primitives';

import type { PreferencesPageProps } from './types';
import { getContainerClasses } from '../shared/styles';
import { usePreferencesLogic } from './hooks';
import { PreferencesSkeleton, SectionComponent } from './components';
import { preferencesPageDefaults } from './defaults';

// =============================================================================
// PreferencesPage Component
// =============================================================================

/**
 * PreferencesPage Composite
 *
 * Toggle-based preferences page with grouped sections.
 * Designed for settings pages where users enable/disable features.
 *
 * @template TData - The query data type containing boolean preference values
 *
 * @example Basic usage
 * ```tsx
 * import { PreferencesPage } from '@pageshell/composites';
 *
 * <PreferencesPage<NotificationPrefs>
 *   theme="creator"
 *   title="Notification Preferences"
 *   description="Choose which notifications you want to receive"
 *   query={preferencesQuery}
 *   sections={[
 *     {
 *       id: 'general',
 *       title: 'General Notifications',
 *       icon: 'bell',
 *       iconColor: 'violet',
 *       preferences: [
 *         {
 *           key: 'emailNotifications',
 *           label: 'Email Notifications',
 *           description: 'Receive emails about important updates',
 *         },
 *       ],
 *     },
 *   ]}
 *   onToggle={(key, value) => updateMutation.mutateAsync({ [key]: value })}
 * />
 * ```
 *
 * @see PreferencesPageProps for all available props
 * @see PreferenceSection for section configuration
 * @see PreferenceItem for preference item configuration
 */
export function PreferencesPage<TData extends object = Record<string, boolean>>(
  props: PreferencesPageProps<TData>
) {
  const {
    // Base
    theme = preferencesPageDefaults.theme,
    containerVariant = preferencesPageDefaults.containerVariant,
    title,
    label,
    description,
    className,
    // Data
    query,
    // Sections
    sections,
    // Toggle handling
    onToggle,
    optimistic = preferencesPageDefaults.optimistic,
    // Layout
    singleCard = preferencesPageDefaults.singleCard,
    // Slots
    slots,
    // Skeleton
    skeleton,
  } = props;

  // ---------------------------------------------------------------------------
  // Logic Hook
  // ---------------------------------------------------------------------------

  const {
    values: localValues,
    loadingKeys,
    handleToggle,
  } = usePreferencesLogic<TData>({
    queryData: query.data,
    sections,
    onToggle,
    optimistic,
  });

  // ---------------------------------------------------------------------------
  // Container Classes (defined early for skeleton)
  // ---------------------------------------------------------------------------

  const classes = getContainerClasses(containerVariant);
  const containerClasses = containerVariant === 'shell' ? '' : 'max-w-3xl mx-auto';

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (query.isLoading) {
    return (
      <div className={cn(containerClasses, className)} data-theme={theme}>
        {skeleton ?? <PreferencesSkeleton />}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const data = query.data ?? ({} as TData);

  return (
    <div className={cn(containerClasses, className)} data-theme={theme}>
      {/* Header */}
      <div className="mb-6">
        {label && (
          <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
        )}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      {/* Header slot */}
      {slots?.header &&
        (typeof slots.header === 'function' ? slots.header(data) : slots.header)}

      {/* Before sections slot */}
      {slots?.beforeSections}

      {/* Sections */}
      {singleCard ? (
        <Card className="p-4 sm:p-6">
          <div className="space-y-8">
            {sections.map((section, index) => (
              <div key={section.id}>
                <SectionComponent
                  section={section}
                  values={localValues}
                  onToggle={handleToggle}
                  loadingKeys={loadingKeys}
                />
                {index < sections.length - 1 && slots?.betweenSections}
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <Card key={section.id} className="p-4 sm:p-6">
              <SectionComponent
                section={section}
                values={localValues}
                onToggle={handleToggle}
                loadingKeys={loadingKeys}
              />
            </Card>
          ))}
        </div>
      )}

      {/* After sections slot */}
      {slots?.afterSections}

      {/* Footer slot */}
      {slots?.footer &&
        (typeof slots.footer === 'function' ? slots.footer(data) : slots.footer)}
    </div>
  );
}

PreferencesPage.displayName = 'PreferencesPage';
