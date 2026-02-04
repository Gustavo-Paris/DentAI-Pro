/**
 * EnhancedWizardSidePanel Component
 *
 * Collapsible side panel for EnhancedWizardPage.
 *
 * @module wizard/components/EnhancedWizardSidePanel
 */

'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@pageshell/core';
import { Button, Card } from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

export interface EnhancedWizardSidePanelProps {
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
}

// =============================================================================
// Constants
// =============================================================================

const widthClasses = {
  sm: 'w-64',
  md: 'w-80',
  lg: 'w-96',
};

// =============================================================================
// Component
// =============================================================================

export function EnhancedWizardSidePanel({
  title,
  width = 'md',
  collapsible = false,
  defaultCollapsed = false,
  children,
}: EnhancedWizardSidePanelProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  if (collapsible && collapsed) {
    return (
      <div className="flex flex-col items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(false)}
          className="mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('flex-shrink-0', widthClasses[width])}>
      <Card className="sticky top-8 p-4">
        {(title || collapsible) && (
          <div className="flex items-center justify-between mb-4">
            {title && (
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            )}
            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed(true)}
                className="h-6 w-6 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        {children}
      </Card>
    </div>
  );
}

EnhancedWizardSidePanel.displayName = 'EnhancedWizardSidePanel';
