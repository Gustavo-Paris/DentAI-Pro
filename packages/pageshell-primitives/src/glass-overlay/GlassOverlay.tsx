'use client';

/**
 * GlassOverlay - Glassmorphism Overlay Primitive
 *
 * Provides a frosted glass background overlay for modals with theme support.
 * Uses backdrop-filter for blur effects.
 *
 * @module glass-overlay
 *
 * @example Basic usage
 * ```tsx
 * <GlassOverlay theme="creator" onClick={handleClose} />
 * ```
 *
 * @example With custom blur and opacity
 * ```tsx
 * <GlassOverlay blur="lg" opacity={0.8} theme="admin" />
 * ```
 *
 * @example With children (content overlay)
 * ```tsx
 * <GlassOverlay theme="student">
 *   <div className="modal-container">Modal content</div>
 * </GlassOverlay>
 * ```
 */

import { type ReactNode } from 'react';
import { cn } from '@pageshell/core';
import { cva, type VariantProps } from 'class-variance-authority';

// =============================================================================
// Constants
// =============================================================================

const blurPixels = {
  sm: '8px',
  md: '16px',
  lg: '24px',
} as const;

// =============================================================================
// Variants
// =============================================================================

const glassOverlayVariants = cva(
  // Base styles
  [
    'fixed inset-0 z-40',
    'backdrop-blur-md',
    'transition-opacity duration-300',
  ],
  {
    variants: {
      blur: {
        sm: 'backdrop-blur-sm',
        md: 'backdrop-blur-md',
        lg: 'backdrop-blur-xl',
      },
      theme: {
        admin: '', // Background handled via inline style with CSS variables
        creator: '', // Background handled via inline style with CSS variables
        student: '', // Background handled via inline style with CSS variables
      },
    },
    defaultVariants: {
      blur: 'md',
      theme: 'creator',
    },
  }
);

// =============================================================================
// Types
// =============================================================================

export interface GlassOverlayProps
  extends VariantProps<typeof glassOverlayVariants> {
  /** Custom opacity (0-1) */
  opacity?: number;
  /** Animate entrance */
  animate?: boolean;
  /** Additional className */
  className?: string;
  /** Click handler (for closing) */
  onClick?: () => void;
  /** Children to render over the overlay */
  children?: ReactNode;
}

// =============================================================================
// Component
// =============================================================================

export function GlassOverlay({
  blur,
  theme = 'creator',
  opacity,
  animate = true,
  className,
  onClick,
  children,
}: GlassOverlayProps) {
  const blurValue = blurPixels[blur ?? 'md'];

  // Theme-specific overlay colors using CSS variables with fallbacks
  const overlayColors: Record<string, string> = {
    admin: 'var(--color-overlay-admin, rgba(10, 15, 20, 0.75))',
    creator: 'var(--color-overlay-creator, rgba(15, 10, 25, 0.75))',
    student: 'var(--color-overlay-student, rgba(10, 20, 15, 0.75))',
  };

  const backgroundColor = overlayColors[theme || 'creator'] ?? overlayColors.creator;

  return (
    <div
      className={cn(
        glassOverlayVariants({ blur, theme }),
        animate && 'portal-animate-in motion-reduce:animate-none motion-reduce:duration-0',
        className
      )}
      style={{
        backgroundColor,
        ...(opacity !== undefined ? { opacity } : {}),
        WebkitBackdropFilter: `blur(${blurValue})`,
        backdropFilter: `blur(${blurValue})`,
      }}
      onClick={onClick}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

GlassOverlay.displayName = 'GlassOverlay';
