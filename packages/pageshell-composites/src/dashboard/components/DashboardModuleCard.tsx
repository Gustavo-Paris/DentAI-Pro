/**
 * DashboardModuleCard Component
 *
 * Module card for DashboardPage composite.
 *
 * @module dashboard/components/DashboardModuleCard
 */

'use client';

import * as React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@pageshell/core';
import {
  resolveIcon,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from '@pageshell/primitives';
import type { ModuleConfig } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface DashboardModuleCardProps {
  /** Module configuration */
  module: ModuleConfig;
  /** Data to pass to render function */
  data?: unknown;
}

// =============================================================================
// Component
// =============================================================================

export function DashboardModuleCard({ module, data }: DashboardModuleCardProps) {
  const ModuleIcon = resolveIcon(module.icon);

  const cardContent = (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all flex-1 h-full',
        'hover:shadow-md hover:border-primary/50',
        module.disabled && 'opacity-50 pointer-events-none'
      )}
    >
      <CardHeader className={module.render ? 'pb-2' : undefined}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {ModuleIcon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ModuleIcon className="h-5 w-5" />
              </div>
            )}
            <div>
              <CardTitle className="text-base">{module.title}</CardTitle>
              {module.description && (
                <CardDescription className="text-xs mt-0.5">
                  {module.description}
                </CardDescription>
              )}
            </div>
          </div>
          {module.badge !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {module.badge}
            </Badge>
          )}
        </div>
      </CardHeader>
      {module.render && (
        <CardContent className="pt-0">
          {module.render(data)}
        </CardContent>
      )}
    </Card>
  );

  if (module.href) {
    return (
      <Link to={module.href} className="flex flex-col">
        {cardContent}
      </Link>
    );
  }

  if (module.onClick) {
    return (
      <button onClick={module.onClick} className="flex flex-col w-full text-left">
        {cardContent}
      </button>
    );
  }

  return cardContent;
}

DashboardModuleCard.displayName = 'DashboardModuleCard';
