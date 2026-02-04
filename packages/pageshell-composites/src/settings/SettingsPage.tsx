/**
 * SettingsPage Composite
 *
 * Settings page layout with sidebar navigation and section-based content.
 * Framework-agnostic implementation.
 *
 * @module settings/SettingsPage
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';

import type { SettingsPageProps, SettingsSectionConfig } from './types';
import { resolveDescription } from '../shared/types';
import { getContainerClasses } from '../shared/styles';
import { SectionItem, SettingsFieldRenderer } from './components';
import { useSettingsLogic } from './hooks';
import { settingsPageDefaults } from './defaults';

// =============================================================================
// SettingsPage Component
// =============================================================================

/**
 * SettingsPage Composite
 *
 * Settings page layout with sidebar navigation and section-based content.
 * Supports both declarative form fields and custom content per section.
 * Framework-agnostic implementation.
 *
 * @template TValues - The form values type
 *
 * @example Basic usage with declarative fields
 * ```tsx
 * import { SettingsPage } from '@pageshell/composites';
 *
 * type ProfileSettings = {
 *   displayName: string;
 *   email: string;
 *   bio: string;
 *   notifications: boolean;
 * };
 *
 * <SettingsPage<ProfileSettings>
 *   theme="creator"
 *   title="Account Settings"
 *   description="Manage your account preferences"
 *   sections={[
 *     {
 *       id: 'profile',
 *       label: 'Profile',
 *       icon: 'user',
 *       description: 'Your public profile information',
 *       fields: [
 *         { name: 'displayName', type: 'text', label: 'Display Name', required: true },
 *         { name: 'email', type: 'email', label: 'Email', required: true },
 *         { name: 'bio', type: 'textarea', label: 'Bio', placeholder: 'Tell us about yourself...' },
 *       ],
 *     },
 *     {
 *       id: 'notifications',
 *       label: 'Notifications',
 *       icon: 'bell',
 *       description: 'Email and push notification settings',
 *       fields: [
 *         { name: 'notifications', type: 'switch', label: 'Enable notifications' },
 *       ],
 *     },
 *   ]}
 *   values={formValues}
 *   onChange={(field, value) => setFormValues(prev => ({ ...prev, [field]: value }))}
 *   errors={formErrors}
 * />
 * ```
 *
 * @example With custom section content
 * ```tsx
 * <SettingsPage
 *   title="Settings"
 *   sections={[
 *     { id: 'general', label: 'General', icon: 'settings' },
 *     { id: 'billing', label: 'Billing', icon: 'credit-card' },
 *   ]}
 * >
 *   {(activeSection) => (
 *     activeSection === 'general' ? <GeneralSettings /> : <BillingSettings />
 *   )}
 * </SettingsPage>
 * ```
 *
 * @see SettingsPageProps for all available props
 * @see SettingsSectionConfig for section configuration options
 * @see FormFieldConfig for field configuration options
 */
export function SettingsPage<TValues extends Record<string, unknown>>(
  props: SettingsPageProps<TValues>
) {
  const {
    // Base
    theme = settingsPageDefaults.theme,
    containerVariant = settingsPageDefaults.containerVariant,
    title,
    description,
    className,
    // Sections
    sections,
    activeSection: controlledActiveSection,
    onSectionChange,
    // Form
    values = {} as TValues,
    onChange,
    errors = {},
    fieldGap = 4,
    columnGap = 4,
    // Content
    children,
    // Slots
    slots,
  } = props;

  // ---------------------------------------------------------------------------
  // Logic Hook
  // ---------------------------------------------------------------------------

  const {
    activeSection,
    activeSectionInfo,
    getSectionClickHandler,
    handleKeyDown,
    sectionRefs,
    contentRef,
  } = useSettingsLogic<TValues>({
    sections,
    activeSection: controlledActiveSection,
    onSectionChange,
  });

  // ---------------------------------------------------------------------------
  // Render Fields
  // ---------------------------------------------------------------------------

  const renderFields = React.useCallback(
    (section: SettingsSectionConfig<TValues>) => {
      if (!section.fields || section.fields.length === 0) return null;

      // If layout is provided, render with layout
      if (section.layout) {
        return (
          <div className={`space-y-${fieldGap}`}>
            {section.layout.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className={`grid gap-${columnGap}`}
                style={{
                  gridTemplateColumns: `repeat(${row.length}, 1fr)`,
                }}
              >
                {row.map((fieldName) => {
                  const field = section.fields?.find(
                    (f) => f.name === fieldName
                  );
                  if (!field) return null;

                  return (
                    <SettingsFieldRenderer
                      key={field.name as string}
                      field={{
                        name: field.name as string,
                        type: field.type,
                        label: field.label,
                        placeholder: field.placeholder,
                        description: field.description,
                        required: field.required,
                        options: field.options,
                      }}
                      value={values[field.name as keyof TValues]}
                      error={errors[field.name as string]}
                      onChange={(value) =>
                        onChange?.(field.name as string, value)
                      }
                    />
                  );
                })}
              </div>
            ))}
          </div>
        );
      }

      // Simple vertical layout
      return (
        <div className={`space-y-${fieldGap}`}>
          {section.fields.map((field) => (
            <SettingsFieldRenderer
              key={field.name as string}
              field={{
                name: field.name as string,
                type: field.type,
                label: field.label,
                placeholder: field.placeholder,
                description: field.description,
                required: field.required,
                options: field.options,
              }}
              value={values[field.name as keyof TValues]}
              error={errors[field.name as string]}
              onChange={(value) => onChange?.(field.name as string, value)}
            />
          ))}
        </div>
      );
    },
    [values, errors, onChange, fieldGap, columnGap]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // Container classes based on variant
  const classes = getContainerClasses(containerVariant);
  const containerClasses = containerVariant === 'shell' ? '' : 'max-w-6xl mx-auto';
  const cardContainerClasses = classes.card;
  const headerSectionClasses = classes.header;
  const contentSectionClasses = classes.content;

  return (
    <div
      className={cn(containerClasses, className)}
      data-theme={theme}
    >
      <div className={cardContainerClasses}>
        {/* Header Section */}
        <div className={headerSectionClasses}>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{resolveDescription(description)}</p>
          )}
        </div>

        {/* Content Section */}
        <div className={contentSectionClasses}>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Navigation */}
            {slots?.beforeSidebar}
            <aside className="shrink-0 lg:w-72">
              <div className="rounded-lg border border-border bg-muted/30 p-2 sticky top-4">
                <nav
                  className="space-y-1"
                  role="navigation"
                  aria-label="Settings"
                  onKeyDown={handleKeyDown}
                >
                  {sections.map((section) => (
                    <SectionItem
                      key={section.id}
                      section={section}
                      isActive={section.id === activeSection}
                      onClick={getSectionClickHandler(section.id)}
                      buttonRef={(el) => {
                        if (el) {
                          sectionRefs.current.set(section.id, el);
                        } else {
                          sectionRefs.current.delete(section.id);
                        }
                      }}
                    />
                  ))}
                </nav>
              </div>
            </aside>
            {slots?.afterSidebar}

            {/* Main Content */}
            <main ref={contentRef} className="flex-1 min-w-0" tabIndex={-1}>
              {slots?.beforeContent}

              {/* Screen reader announcement for section changes */}
              <div className="sr-only" aria-live="polite" aria-atomic="true">
                {activeSectionInfo ? `Exibindo configurações de ${activeSectionInfo.label}` : ''}
              </div>

              {/* Section Header (Mobile) */}
              {activeSectionInfo && (
                <div className="mb-4 lg:hidden">
                  <h2
                    id={`settings-section-${activeSection}-title-mobile`}
                    className="text-lg font-semibold text-foreground"
                  >
                    {activeSectionInfo.label}
                  </h2>
                  {activeSectionInfo.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {activeSectionInfo.description}
                    </p>
                  )}
                </div>
              )}

              {/* Section Content */}
              <div
                className="rounded-lg border border-border bg-background p-6"
                aria-labelledby={activeSectionInfo
                  ? `settings-section-${activeSection}-title settings-section-${activeSection}-title-mobile`
                  : undefined}
              >
                {/* Section Header (Desktop) */}
                {activeSectionInfo && (
                  <div className="mb-6 pb-4 border-b border-border hidden lg:block">
                    <h2
                      id={`settings-section-${activeSection}-title`}
                      className="text-lg font-semibold text-foreground"
                    >
                      {activeSectionInfo.label}
                    </h2>
                    {activeSectionInfo.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {activeSectionInfo.description}
                      </p>
                    )}
                  </div>
                )}

                {/* Render content for active section */}
                {activeSectionInfo?.fields && activeSectionInfo.fields.length > 0
                  ? renderFields(activeSectionInfo)
                  : activeSectionInfo?.children
                    ? activeSectionInfo.children
                    : children
                      ? children(activeSection)
                      : null}
              </div>

              {slots?.afterContent}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

SettingsPage.displayName = 'SettingsPage';
