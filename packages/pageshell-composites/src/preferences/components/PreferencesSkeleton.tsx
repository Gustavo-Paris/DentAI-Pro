/**
 * PreferencesSkeleton Component
 *
 * Loading skeleton for PreferencesPage.
 *
 * @module preferences/components/PreferencesSkeleton
 */

'use client';

import * as React from 'react';
import { Card, Skeleton } from '@pageshell/primitives';

export function PreferencesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Sections */}
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i} className="p-6 space-y-6">
          {/* Section header */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>

          {/* Toggle rows */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div
                key={j}
                className="flex items-start justify-between gap-4 py-4"
              >
                <div className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

PreferencesSkeleton.displayName = 'PreferencesSkeleton';
