'use client';

/**
 * FocusGlow - Focus State Glow Effect Wrapper
 *
 * Wraps form elements to add a theme-appropriate glow effect on focus.
 * Uses :focus-within to detect when any child element is focused.
 *
 * @module focus-glow
 *
 * @example Basic usage
 * ```tsx
 * <FocusGlow theme="creator">
 *   <Input name="email" />
 * </FocusGlow>
 * ```
 *
 * @example With custom color
 * ```tsx
 * <FocusGlow color="rgba(255, 100, 0, 0.5)">
 *   <Input />
 * </FocusGlow>
 * ```
 *
 * @example With intensity variant
 * ```tsx
 * <FocusGlow theme="admin" intensity="lg">
 *   <Textarea />
 * </FocusGlow>
 * ```
 */

import { type ReactNode, type CSSProperties } from 'react';
import { cn } from '@pageshell/core';
import { cva, type VariantProps } from 'class-variance-authority';

// =============================================================================
// Variants
// =============================================================================

const focusGlowVariants = cva(
  // Base - applies glow on focus-within
  [
    '[&:focus-within]:ring-2',
    '[&:focus-within]:ring-offset-2',
    '[&:focus-within]:ring-offset-background',
    'transition-shadow duration-200',
    'rounded-lg',
  ],
  {
    variants: {
      intensity: {
        sm: '[&:focus-within]:ring-1 [&:focus-within]:shadow-sm',
        md: '[&:focus-within]:ring-2 [&:focus-within]:shadow-md',
        lg: '[&:focus-within]:ring-2 [&:focus-within]:shadow-lg',
      },
      theme: {
        admin: [
          '[&:focus-within]:ring-cyan-500/50',
          '[&:focus-within]:shadow-cyan-500/20',
        ],
        creator: [
          '[&:focus-within]:ring-violet-500/50',
          '[&:focus-within]:shadow-violet-500/20',
        ],
        student: [
          '[&:focus-within]:ring-emerald-500/50',
          '[&:focus-within]:shadow-emerald-500/20',
        ],
      },
    },
    defaultVariants: {
      intensity: 'md',
      theme: 'creator',
    },
  }
);

// =============================================================================
// Types
// =============================================================================

export interface FocusGlowProps extends VariantProps<typeof focusGlowVariants> {
  /** Custom glow color (overrides theme) */
  color?: string;
  /** Additional className */
  className?: string;
  /** Children to wrap */
  children: ReactNode;
}

// =============================================================================
// Component
// =============================================================================

export function FocusGlow({
  intensity,
  theme,
  color,
  className,
  children,
}: FocusGlowProps) {
  return (
    <div
      className={cn(focusGlowVariants({ intensity, theme }), className)}
      style={
        color
          ? ({
              '--tw-ring-color': color,
              '--tw-shadow-color': color,
            } as CSSProperties)
          : undefined
      }
    >
      {children}
    </div>
  );
}

FocusGlow.displayName = 'FocusGlow';
