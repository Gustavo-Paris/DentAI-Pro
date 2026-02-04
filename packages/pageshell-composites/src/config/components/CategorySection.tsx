/**
 * ConfigPage Category Section
 *
 * Section component for displaying a category of configurations.
 *
 * @module config/components/CategorySection
 */

'use client';

import * as React from 'react';
import { Button, Card, Badge } from '@pageshell/primitives';
import { Save, Loader2 } from 'lucide-react';

import type { ConfigItem, ConfigFieldComponents } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface CategorySectionProps<TConfig extends ConfigItem> {
  /** Category identifier */
  category: string;
  /** Display label */
  label: string;
  /** Optional icon component */
  Icon?: React.ComponentType<{ className?: string }>;
  /** Optional description */
  description?: string;
  /** Config items in this category */
  configs: TConfig[];
  /** Modified values for this category */
  modifiedValues: Record<string, unknown>;
  /** Value change handler */
  onValueChange: (key: string, value: unknown) => void;
  /** Save handler */
  onSave: () => void;
  /** Whether the category is being saved */
  isSaving: boolean;
  /** Whether there are unsaved changes */
  hasChanges: boolean;
  /** Field component map by value type */
  fieldComponents: ConfigFieldComponents;
}

// =============================================================================
// Component
// =============================================================================

export const CategorySection = React.memo(function CategorySection<TConfig extends ConfigItem>({
  category,
  label,
  Icon,
  description,
  configs,
  modifiedValues,
  onValueChange,
  onSave,
  isSaving,
  hasChanges,
  fieldComponents,
}: CategorySectionProps<TConfig>) {
  // Generate unique IDs for accessibility
  const sectionId = `config-section-${category.replace(/\W+/g, '-').toLowerCase()}`;
  const headingId = `${sectionId}-heading`;
  const legendId = `${sectionId}-legend`;

  return (
    <section aria-labelledby={headingId}>
      <Card className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-lg bg-muted">
                <Icon className="h-5 w-5 text-foreground" />
              </div>
            )}
            <div>
              <h2 id={headingId} className="text-base font-semibold text-foreground">
                {label}
              </h2>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="warning" className="text-xs" aria-label="Unsaved changes in this section">
                Unsaved
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Fields */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
        >
          <fieldset className="space-y-4 border-0 p-0 m-0">
            <legend id={legendId} className="sr-only">
              {label} settings
            </legend>
            {configs.map((config) => {
              const FieldComponent = fieldComponents[config.valueType];
              if (!FieldComponent) {
                return (
                  <div key={config.key} className="text-sm text-muted-foreground">
                    Tipo não suportado: {config.valueType}
                  </div>
                );
              }

              const value =
                modifiedValues[config.key] !== undefined
                  ? modifiedValues[config.key]
                  : config.value;

              // Extract options using type narrowing (only select/enum have options)
              const options = 'options' in config ? config.options : undefined;

              return (
                <FieldComponent
                  key={config.key}
                  label={config.key.split('.').pop() || config.key}
                  value={value}
                  onChange={(newValue: unknown) => onValueChange(config.key, newValue)}
                  description={config.description}
                  options={options}
                  type={config.valueType === 'number' ? 'number' : undefined}
                />
              );
            })}
          </fieldset>
        </form>
      </Card>
    </section>
  );
}) as (<TConfig extends ConfigItem>(props: CategorySectionProps<TConfig>) => React.ReactElement) & {
  displayName?: string;
};

CategorySection.displayName = 'CategorySection';
