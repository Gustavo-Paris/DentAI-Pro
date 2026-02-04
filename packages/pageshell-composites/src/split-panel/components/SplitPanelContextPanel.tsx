/**
 * SplitPanelPage Context Panel
 *
 * Collapsible context/details panel for SplitPanelPage.
 *
 * @module split-panel/components/SplitPanelContextPanel
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { Button } from '@pageshell/primitives';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { PANEL_WIDTH_CLASSES } from '../utils';
import {
  type SplitPanelAriaLabels,
  DEFAULT_SPLIT_PANEL_ARIA_LABELS,
  resolveSplitPanelAriaLabels,
} from '../../shared/types';

// =============================================================================
// Types
// =============================================================================

export interface SplitPanelContextPanelProps {
  /** Panel title */
  title?: string;
  /** Panel width */
  width?: 'sm' | 'md' | 'lg';
  /** Whether panel is collapsible */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
  /** Panel content */
  children: React.ReactNode;
  /** ARIA labels for i18n */
  ariaLabels?: SplitPanelAriaLabels;
}

// =============================================================================
// Component
// =============================================================================

export function SplitPanelContextPanel({
  title,
  width = 'md',
  collapsible = false,
  defaultCollapsed = false,
  children,
  ariaLabels,
}: SplitPanelContextPanelProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  const resolvedAriaLabels = resolveSplitPanelAriaLabels(ariaLabels);

  if (collapsible && collapsed) {
    return (
      <aside
        aria-label={resolvedAriaLabels.contextPanelCollapsed}
        className="flex flex-col items-center border-l border-border bg-card/50 p-2"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(false)}
          aria-label={resolvedAriaLabels.expandPanel}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </aside>
    );
  }

  return (
    <aside
      aria-label={title || resolvedAriaLabels.contextPanel}
      className={cn(
        'flex-shrink-0 border-l border-border bg-card/50 overflow-auto',
        PANEL_WIDTH_CLASSES[width]
      )}
    >
      {(title || collapsible) && (
        <div className="flex items-center justify-between p-4 border-b border-border">
          {title && (
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          )}
          {collapsible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(true)}
              className="h-6 w-6 p-0"
              aria-label={resolvedAriaLabels.collapsePanel}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      <div className="p-4">{children}</div>
    </aside>
  );
}

SplitPanelContextPanel.displayName = 'SplitPanelContextPanel';
