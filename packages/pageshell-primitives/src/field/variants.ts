/**
 * Field Variants
 *
 * Shared CVA definitions for Input, Textarea, and Label components.
 * Uses CSS custom properties from the design system tokens.
 *
 * @module field/variants
 */

import { cva } from 'class-variance-authority';

/**
 * Base styles shared between Input and Textarea
 */
const fieldBaseStyles = [
  'w-full',
  'rounded-lg',
  'text-[var(--input-text)]',
  'bg-[var(--input-bg)]',
  'border border-[var(--input-border)]',
  'transition-all duration-200 ease-out',
  'placeholder:text-[var(--input-placeholder)]',
  'focus-visible:outline-none focus-visible:border-primary',
  'focus-visible:ring-2 focus-visible:ring-primary/30',
  'hover:border-border/80',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'disabled:bg-[var(--input-disabled-bg)] disabled:text-[var(--input-disabled-text)]',
  'disabled:hover:border-[var(--input-border)]',
].join(' ');

/**
 * Input variants
 *
 * @example
 * ```tsx
 * <Field.Input size="sm" />
 * <Field.Input size="lg" error />
 * ```
 */
export const fieldInputVariants = cva(fieldBaseStyles, {
  variants: {
    size: {
      sm: 'h-8 px-2.5 text-sm',
      md: 'h-10 px-3 text-sm',
      lg: 'h-12 px-4 text-base',
    },
    variant: {
      default: '',
      error:
        'border-destructive/60 focus-visible:border-destructive focus-visible:ring-2 focus-visible:ring-destructive/30 hover:border-destructive/50',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
});

/**
 * Textarea variants
 *
 * @example
 * ```tsx
 * <Field.Textarea size="sm" />
 * <Field.Textarea size="lg" rows={6} />
 * ```
 */
export const fieldTextareaVariants = cva(fieldBaseStyles, {
  variants: {
    size: {
      sm: 'min-h-[60px] px-2.5 py-2 text-sm leading-relaxed',
      md: 'min-h-[100px] px-3 py-2.5 text-sm leading-relaxed',
      lg: 'min-h-[140px] px-4 py-3 text-base leading-relaxed',
    },
    variant: {
      default: '',
      error:
        'border-destructive/60 focus-visible:border-destructive focus-visible:ring-2 focus-visible:ring-destructive/30 hover:border-destructive/50',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
});

/**
 * Label variants
 *
 * @example
 * ```tsx
 * <Field.Label>Nome</Field.Label>
 * <Field.Label required>Email</Field.Label>
 * ```
 */
export const fieldLabelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      required: {
        true: "after:content-['*'] after:ml-0.5 after:text-destructive",
        false: '',
      },
    },
    defaultVariants: {
      required: false,
    },
  }
);

/**
 * Select variants - matches Input/Textarea sizing for consistency
 */
export const fieldSelectVariants = cva('', {
  variants: {
    size: {
      sm: 'h-8 text-sm',
      md: 'h-input text-[length:var(--input-font-size)]',
      lg: 'h-12 text-base',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

/**
 * Checkbox variants
 */
export const fieldCheckboxVariants = cva(
  [
    'peer shrink-0 rounded-sm border border-[var(--input-border)]',
    'ring-offset-background',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
    'data-[state=checked]:border-primary',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'h-3.5 w-3.5',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);
