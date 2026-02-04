import { cva } from 'class-variance-authority';

/**
 * FormModal Glass Styles
 *
 * CVA variants for glassmorphism modal styling with theme support.
 */

// =============================================================================
// Glass Modal Container
// =============================================================================

export const glassModalVariants = cva(
  [
    'rounded-2xl',
    'border',
    'overflow-hidden',
    'backdrop-blur-xl',
  ],
  {
    variants: {
      theme: {
        // Uses CSS variables from @pageshell/themes presets:
        // --glass-modal-bg and --glass-modal-glow
        admin: [
          'bg-[var(--glass-modal-bg,rgba(10,20,30,0.85))]',
          'border-cyan-500/20',
          'shadow-[0_8px_32px_var(--glass-modal-glow,rgba(6,182,212,0.15)),inset_0_1px_0_rgba(255,255,255,0.1)]',
        ],
        creator: [
          'bg-[var(--glass-modal-bg,rgba(20,10,35,0.85))]',
          'border-violet-500/20',
          'shadow-[0_8px_32px_var(--glass-modal-glow,rgba(139,92,246,0.15)),inset_0_1px_0_rgba(255,255,255,0.1)]',
        ],
        student: [
          'bg-[var(--glass-modal-bg,rgba(10,25,20,0.85))]',
          'border-emerald-500/20',
          'shadow-[0_8px_32px_var(--glass-modal-glow,rgba(16,185,129,0.15)),inset_0_1px_0_rgba(255,255,255,0.1)]',
        ],
      },
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        full: 'max-w-[90vw]',
      },
    },
    defaultVariants: {
      theme: 'creator',
      size: 'lg',
    },
  }
);

export type GlassModalVariants = typeof glassModalVariants;
