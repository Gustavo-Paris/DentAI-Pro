/**
 * Spinner Components
 *
 * Loading indicators for async operations.
 *
 * @module spinner
 *
 * @example Spinner
 * ```tsx
 * <Spinner size="md" />
 * ```
 *
 * @example LoadingOverlay
 * ```tsx
 * <LoadingOverlay message="Loading..." />
 * ```
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';

// ============================================
// Spinner Component
// ============================================

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-3',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-muted-foreground/30 border-t-primary',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// ============================================
// Loading Overlay
// ============================================

export interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

export function LoadingOverlay({
  message = 'Loading...',
  className,
}: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50',
        className
      )}
    >
      <Spinner size="lg" />
      {message && (
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
