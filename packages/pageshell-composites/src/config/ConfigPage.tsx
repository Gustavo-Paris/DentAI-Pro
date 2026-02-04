/**
 * ConfigPage Composite
 *
 * Full-page configuration management with category grouping,
 * dirty tracking, and save per category.
 * Framework-agnostic implementation.
 *
 * @module config/ConfigPage
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { Button, Badge, EmptyState, resolveIcon } from '@pageshell/primitives';
import { RefreshCw, Loader2 } from 'lucide-react';
import { logger } from '@repo/logger';

import type { ConfigPageProps, ConfigItem } from './types';
import { resolveDescription } from '../shared/types';
import { getContainerClasses } from '../shared/styles';
import { ConfigPageSkeleton, CategorySection } from './components';
import { configPageDefaults } from './defaults';

// =============================================================================
// ConfigPage Component
// =============================================================================

/**
 * Full-page configuration management with category grouping,
 * dirty tracking, and per-category save functionality.
 *
 * @template TData - The query data type
 * @template TConfig - The config item type (must extend ConfigItem)
 *
 * @example
 * ```tsx
 * import { ConfigPage } from '@repo/pageshell-composites/config';
 * // Field components implement ConfigFieldProps interface
 * import { TextField, SwitchField, SelectField } from './fields';
 *
 * function SystemSettings() {
 *   const query = api.settings.getAll.useQuery();
 *   const updateMutation = api.settings.updateBatch.useMutation();
 *
 *   return (
 *     <ConfigPage
 *       title="System Settings"
 *       description="Configure system-wide settings"
 *       query={query}
 *       categoryKey="category"
 *       categories={{
 *         general: { label: 'General', icon: 'settings' },
 *         security: { label: 'Security', icon: 'shield' },
 *       }}
 *       updateMutation={updateMutation}
 *       fieldComponents={{
 *         string: TextField,
 *         boolean: SwitchField,
 *         select: SelectField,
 *       }}
 *     />
 *   );
 * }
 * ```
 */
function ConfigPageInner<
  TData = unknown,
  TConfig extends ConfigItem = ConfigItem,
>(
  props: ConfigPageProps<TData, TConfig>,
  ref: React.ForwardedRef<HTMLElement>
) {
  const {
    // Base
    theme = configPageDefaults.theme,
    containerVariant = configPageDefaults.containerVariant,
    title,
    description,
    className,
    // Data
    query,
    getConfigs = (data) => {
      if (process.env.NODE_ENV !== 'production') {
        if (!Array.isArray(data)) {
          logger.warn('[ConfigPage] getConfigs: data is not an array. Provide a custom getConfigs function to extract configs from your data structure.');
          return [];
        }
      }
      return data as unknown as TConfig[];
    },
    emptyCheck,
    emptyState,
    // Categories
    categoryKey,
    categories,
    // Mutation
    updateMutation,
    // Field components
    fieldComponents,
    // Actions
    actions,
    // Callbacks
    onSaveSuccess,
    onSaveError,
    // Skeleton
    skeleton,
    // Note: historyModal is defined in types for API compatibility but not yet implemented
  } = props;

  // ---------------------------------------------------------------------------
  // IDs (for accessibility)
  // ---------------------------------------------------------------------------

  const titleId = React.useId();

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [modifiedValues, setModifiedValues] = React.useState<
    Record<string, Record<string, unknown>>
  >({});
  const [savingCategory, setSavingCategory] = React.useState<string | null>(
    null
  );

  // ---------------------------------------------------------------------------
  // Data Processing
  // ---------------------------------------------------------------------------

  const extractCategory = React.useCallback(
    (configItem: TConfig): string => {
      if (typeof categoryKey === 'string') {
        const item = configItem as unknown as Record<string, unknown>;
        return String(item[categoryKey]);
      }
      return categoryKey(configItem);
    },
    [categoryKey]
  );

  const configs = React.useMemo(() => {
    if (!query.data) return [];
    return getConfigs(query.data);
  }, [query.data, getConfigs]);

  const byCategory = React.useMemo(() => {
    return configs.reduce(
      (acc, configItem) => {
        const category = extractCategory(configItem);
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category]!.push(configItem);
        return acc;
      },
      {} as Record<string, TConfig[]>
    );
  }, [configs, extractCategory]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleValueChange = React.useCallback(
    (category: string, key: string, value: unknown) => {
      setModifiedValues((prev) => ({
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value,
        },
      }));
    },
    []
  );

  const hasChanges = React.useCallback(
    (category: string): boolean => {
      const modified = modifiedValues[category];
      if (!modified) return false;

      const categoryConfigs = byCategory[category] || [];
      return Object.entries(modified).some(([key, value]) => {
        const original = categoryConfigs.find((c) => c.key === key)?.value;
        return value !== original;
      });
    },
    [modifiedValues, byCategory]
  );

  const saveCategory = React.useCallback(
    async (category: string) => {
      const modified = modifiedValues[category];
      if (!modified || !hasChanges(category)) return;

      setSavingCategory(category);

      const categoryConfigs = byCategory[category] || [];
      const updates = Object.entries(modified)
        .filter(([key, value]) => {
          const original = categoryConfigs.find((c) => c.key === key)?.value;
          return value !== original;
        })
        .map(([key, value]) => ({ key, value }));

      try {
        await updateMutation.mutateAsync({ updates });
        onSaveSuccess?.(category);
        query.refetch?.();

        // Clear modified values for this category
        setModifiedValues((prev) => {
          const { [category]: _, ...rest } = prev;
          return rest;
        });
      } catch (error) {
        onSaveError?.(
          category,
          error instanceof Error ? error : new Error('Unknown error')
        );
      } finally {
        setSavingCategory(null);
      }
    },
    [
      modifiedValues,
      hasChanges,
      byCategory,
      updateMutation,
      onSaveSuccess,
      onSaveError,
      query,
    ]
  );

  const handleAction = React.useCallback(
    async (actionKey: string) => {
      const action = actions?.[actionKey];
      if (!action) return;

      if (action.onClick) {
        action.onClick();
      } else if (action.mutation) {
        try {
          await action.mutation.mutateAsync(undefined);
          query.refetch?.();
        } catch {
          // Error handling
        }
      }
    },
    [actions, query]
  );

  // ---------------------------------------------------------------------------
  // Container Classes (defined early for loading state)
  // ---------------------------------------------------------------------------

  const loadingContainerClasses = containerVariant === 'shell' ? '' : 'max-w-5xl mx-auto';

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (query.isLoading) {
    return (
      <main ref={ref} className={cn(loadingContainerClasses, className)} data-theme={theme}>
        {skeleton ?? <ConfigPageSkeleton />}
      </main>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty State
  // ---------------------------------------------------------------------------

  if (query.data && emptyCheck?.(query.data) && emptyState) {
    const EmptyIcon = emptyState.icon ? resolveIcon(emptyState.icon) : undefined;
    const emptyContainerClasses = containerVariant === 'shell' ? '' : 'max-w-5xl mx-auto';
    return (
      <main
        ref={ref}
        className={cn(emptyContainerClasses, className)}
        data-theme={theme}
        aria-labelledby={titleId}
      >
        {/* Header */}
        <div className="mb-6">
          <h1 id={titleId} className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{resolveDescription(description, query.data)}</p>
          )}
        </div>
        <EmptyState
          icon={EmptyIcon}
          title={emptyState.title}
          description={emptyState.description}
          action={emptyState.action}
        />
      </main>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // Container classes based on variant
  const classes = getContainerClasses(containerVariant);
  const containerClasses = containerVariant === 'shell' ? '' : 'max-w-5xl mx-auto';
  const cardContainerClasses = classes.card;
  const headerSectionClasses = classes.header;
  const contentSectionClasses = classes.content;

  return (
    <main
      ref={ref}
      className={cn(containerClasses, className)}
      data-theme={theme}
      aria-labelledby={titleId}
      aria-busy={savingCategory !== null}
    >
      {/* SR-only status announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {savingCategory && `Saving settings for ${categories[savingCategory]?.label || savingCategory}...`}
      </div>

      <div className={cardContainerClasses}>
        {/* Header Section */}
        <div className={headerSectionClasses}>
          <div className="flex items-center justify-between">
            <div>
              <h1 id={titleId} className="text-2xl font-bold tracking-tight">{title}</h1>
              {description && (
                <p className="text-muted-foreground mt-1">{resolveDescription(description, query.data)}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {Object.keys(byCategory).length} categorias
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => query.refetch?.()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar
              </Button>
              {actions &&
                Object.entries(actions).map(([key, action]) => {
                  const ActionIcon = resolveIcon(action.icon);
                  return (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction(key)}
                      disabled={action.mutation?.isPending}
                    >
                      {action.mutation?.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : ActionIcon ? (
                        <ActionIcon className="h-4 w-4 mr-2" />
                      ) : null}
                      {action.label}
                    </Button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Content Section - Category Sections */}
        <div className={contentSectionClasses}>
          {Object.entries(byCategory).map(([category, categoryConfigs]) => {
            const categoryInfo = categories[category] || { label: category };

            return (
              <CategorySection
                key={category}
                category={category}
                label={categoryInfo.label}
                Icon={resolveIcon(categoryInfo.icon)}
                description={categoryInfo.description}
                configs={categoryConfigs}
                modifiedValues={modifiedValues[category] || {}}
                onValueChange={(key, value) =>
                  handleValueChange(category, key, value)
                }
                onSave={() => saveCategory(category)}
                isSaving={savingCategory === category}
                hasChanges={hasChanges(category)}
                fieldComponents={fieldComponents}
              />
            );
          })}
        </div>
      </div>
    </main>
  );
}

// Generic forwardRef wrapper
export const ConfigPage = React.forwardRef(ConfigPageInner) as <
  TData = unknown,
  TConfig extends ConfigItem = ConfigItem,
>(
  props: ConfigPageProps<TData, TConfig> & { ref?: React.ForwardedRef<HTMLElement> }
) => React.ReactElement;

(ConfigPage as React.FC).displayName = 'ConfigPage';
