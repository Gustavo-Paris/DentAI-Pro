/**
 * ListPage Header
 *
 * Shared header component for ListPage (table and cards modes).
 * Supports title, description, label, and header actions.
 *
 * @module list/components/shared/ListPageHeader
 */

'use client';

import * as React from 'react';
import { Link } from 'react-router-dom';
import { Button, resolveIcon } from '@pageshell/primitives';
import { PageHeader } from '@pageshell/layouts';

import type { HeaderActionConfig } from '../../../shared/types';

// =============================================================================
// Types
// =============================================================================

export interface ListPageHeaderProps {
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Label/badge above title */
  label?: string;
  /**
   * Header actions (array of action configs)
   * For backward compatibility with CardListPage, also accepts single action
   */
  headerActions?: HeaderActionConfig[];
  /**
   * Single header action - for CardListPage backward compat
   * @deprecated Use headerActions array instead
   */
  headerAction?: HeaderActionConfig | React.ReactNode;
  /**
   * Create action shorthand (rendered as primary button)
   */
  createAction?: {
    label?: string;
    href?: string;
    onClick?: () => void;
    icon?: string;
  };
  /**
   * Custom slot for additional header content
   */
  headerSlot?: React.ReactNode;
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if action is a header action config object
 */
function isHeaderActionConfig(
  action: unknown
): action is HeaderActionConfig {
  if (!action) return false;
  if (typeof action !== 'object') return false;
  return 'label' in action && typeof (action as { label: unknown }).label === 'string';
}

// =============================================================================
// Component
// =============================================================================

export const ListPageHeader = React.memo(function ListPageHeader({
  title,
  description,
  label,
  headerActions,
  headerAction,
  createAction,
  headerSlot,
}: ListPageHeaderProps) {
  // Render single action button
  const renderActionButton = React.useCallback(
    (config: HeaderActionConfig, index: number) => {
      // Check show !== false before rendering
      if (config.show === false) return null;

      // Resolve icon if provided
      const ResolvedIcon = config.icon ? resolveIcon(config.icon) : null;

      if (config.href) {
        return (
          <Button
            key={index}
            asChild
            variant={config.variant || 'outline'}
            disabled={config.disabled}
          >
            <Link to={config.href}>
              {ResolvedIcon && <ResolvedIcon className="h-4 w-4 mr-2" />}
              {config.label}
            </Link>
          </Button>
        );
      }

      return (
        <Button
          key={index}
          onClick={config.onClick}
          variant={config.variant || 'outline'}
          disabled={config.disabled}
          leftIcon={ResolvedIcon ? <ResolvedIcon className="h-4 w-4" /> : undefined}
        >
          {config.label}
        </Button>
      );
    },
    []
  );

  // Build actions content
  const actionsContent = React.useMemo(() => {
    const actionElements: React.ReactNode[] = [];

    // Add headerActions array
    if (headerActions?.length) {
      headerActions.forEach((action, i) => {
        const element = renderActionButton(action, i);
        if (element) actionElements.push(element);
      });
    }

    // Add single headerAction (backward compat with CardListPage)
    if (headerAction) {
      if (isHeaderActionConfig(headerAction)) {
        const element = renderActionButton(headerAction, actionElements.length);
        if (element) actionElements.push(element);
      } else {
        // Custom ReactNode
        actionElements.push(
          <React.Fragment key="custom-action">{headerAction}</React.Fragment>
        );
      }
    }

    // Add createAction as primary button
    if (createAction) {
      const CreateIcon = createAction.icon ? resolveIcon(createAction.icon) : null;

      if (createAction.href) {
        actionElements.push(
          <Button key="create-action" asChild>
            <Link to={createAction.href}>
              {CreateIcon && <CreateIcon className="h-4 w-4 mr-2" />}
              {createAction.label || 'Add New'}
            </Link>
          </Button>
        );
      } else {
        actionElements.push(
          <Button
            key="create-action"
            onClick={createAction.onClick}
            leftIcon={CreateIcon ? <CreateIcon className="h-4 w-4" /> : undefined}
          >
            {createAction.label || 'Add New'}
          </Button>
        );
      }
    }

    // Add custom header slot
    if (headerSlot) {
      actionElements.push(
        <React.Fragment key="header-slot">{headerSlot}</React.Fragment>
      );
    }

    if (actionElements.length === 0) return null;

    return (
      <div className="flex items-center gap-2">
        {actionElements}
      </div>
    );
  }, [headerActions, headerAction, createAction, headerSlot, renderActionButton]);

  return (
    <PageHeader
      title={title}
      description={description}
      label={label}
      action={actionsContent}
    />
  );
});

ListPageHeader.displayName = 'ListPageHeader';
