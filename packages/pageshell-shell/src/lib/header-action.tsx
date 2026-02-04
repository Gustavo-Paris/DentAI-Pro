'use client';

import type { ReactNode } from 'react';
import { PageHeaderAction, PageHeaderActions } from '@pageshell/layouts';
import type { ActionConfig } from '../types';

/**
 * Resolves header action(s) to a React node.
 *
 * Priority: headerActions (array) > headerAction (single/array/ReactNode)
 *
 * @param headerAction - Single action, array, or ReactNode
 * @param headerActions - Array of actions (takes precedence)
 * @returns Rendered header action component
 *
 * @internal
 */
export function resolveHeaderAction(
  headerAction: ActionConfig | ActionConfig[] | ReactNode | undefined,
  headerActions: ActionConfig[] | undefined
): ReactNode {
  // headerActions takes precedence over headerAction
  // Note: Type assertion needed due to ActionVariant mismatch (local types include 'accent')
  if (headerActions) {
    return (
      <PageHeaderActions
        actions={headerActions as Parameters<typeof PageHeaderActions>[0]['actions']}
      />
    );
  }

  return (
    <PageHeaderAction
      action={headerAction as Parameters<typeof PageHeaderAction>[0]['action']}
    />
  );
}
