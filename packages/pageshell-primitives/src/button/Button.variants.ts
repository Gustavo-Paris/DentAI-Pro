/**
 * Button variants using CVA
 *
 * Uses CSS custom properties for theming compatibility.
 *
 * @module button/variants
 */

import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Button variants using CSS custom properties.
 * These tokens should be defined by the consumer's theme.
 */
export const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium transition-all',
    'focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-ring focus-visible:ring-offset-2',
    'focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
    'whitespace-nowrap',
    // PWA: touch optimization for responsive tap
    'touch-manipulation',
  ].join(' '),
  {
    variants: {
      variant: {
        // Primary - Main call-to-action
        primary: [
          'bg-primary text-primary-foreground',
          'hover:bg-primary/90',
        ].join(' '),

        // Default - Alias for primary
        default: [
          'bg-primary text-primary-foreground',
          'hover:bg-primary/90',
        ].join(' '),

        // Secondary - Subtle background
        secondary: [
          'bg-secondary text-secondary-foreground',
          'hover:bg-secondary/80',
        ].join(' '),

        // Ghost - Transparent background
        ghost: [
          'bg-transparent text-foreground',
          'hover:bg-accent hover:text-accent-foreground',
        ].join(' '),

        // Outline - Border only
        outline: [
          'bg-transparent text-foreground',
          'border border-input',
          'hover:bg-accent hover:text-accent-foreground',
        ].join(' '),

        // Destructive - For dangerous actions
        destructive: [
          'bg-destructive text-destructive-foreground',
          'hover:bg-destructive/90',
        ].join(' '),

        // Link - Text-only with underline
        link: [
          'bg-transparent text-primary',
          'underline-offset-4 hover:underline',
          'p-0 h-auto',
        ].join(' '),
      },

      size: {
        sm: ['h-8 px-3', 'text-sm', 'rounded-md'].join(' '),
        md: ['h-9 px-4', 'text-sm', 'rounded-md'].join(' '),
        default: ['h-9 px-4', 'text-sm', 'rounded-md'].join(' '),
        lg: ['h-10 px-6', 'text-base', 'rounded-md'].join(' '),
        // Touch-friendly size (44px min) for mobile contexts
        touch: ['h-11 px-6', 'text-base', 'rounded-lg'].join(' '),
        icon: ['h-9 w-9', 'rounded-md', 'p-0'].join(' '),
        // Touch-friendly icon button (44px min)
        'icon-touch': ['h-11 w-11', 'rounded-lg', 'p-0'].join(' '),
      },

      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },

    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
export type ButtonVariant = NonNullable<ButtonVariantProps['variant']>;
export type ButtonSize = NonNullable<ButtonVariantProps['size']>;
