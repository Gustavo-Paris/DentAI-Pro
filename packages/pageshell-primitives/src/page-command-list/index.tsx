'use client';

/**
 * PageCommandList - Command palette/shortcut list primitive
 *
 * Displays a list of keyboard commands with descriptions.
 * Used for command references, shortcuts, keyboard help.
 *
 * @example Basic usage
 * ```tsx
 * <PageCommandList
 *   commands={[
 *     { key: '/help', description: 'Obter ajuda com o Claude Code' },
 *     { key: '/commit', description: 'Criar um commit das mudanças' },
 *     { key: '/test', description: 'Executar testes do projeto' },
 *   ]}
 * />
 * ```
 *
 * @example With title and hint
 * ```tsx
 * <PageCommandList
 *   title="Comandos do Claude Code"
 *   icon="terminal"
 *   commands={commands}
 *   hint="Digite '/' no Claude Code para ver todos os comandos"
 * />
 * ```
 *
 * @example Compact variant
 * ```tsx
 * <PageCommandList
 *   commands={shortcuts}
 *   variant="compact"
 * />
 * ```
 */

import type { ReactNode } from 'react';
import { cn } from '@pageshell/core';
import { resolveIcon, type IconProp } from '../icons';

// =============================================================================
// Types
// =============================================================================

/**
 * Command item configuration
 */
export interface CommandItem {
  /** Command key/shortcut (e.g., "/help", "Ctrl+S") */
  key: string;
  /** Description of what the command does */
  description: string;
}

/**
 * List variant
 */
export type PageCommandListVariant = 'default' | 'compact';

/**
 * PageCommandList component props
 */
export interface PageCommandListProps {
  /** List of commands to display */
  commands: CommandItem[];
  /** Optional title */
  title?: string;
  /** Optional icon for the title */
  icon?: IconProp;
  /** Optional hint text at the bottom */
  hint?: ReactNode;
  /** Variant (default: 'default') */
  variant?: PageCommandListVariant;
  /** Additional CSS class */
  className?: string;
  /** Test ID for automated testing */
  testId?: string;
}

// =============================================================================
// Styling Maps
// =============================================================================

const variantClasses: Record<PageCommandListVariant, { gap: string; padding: string }> = {
  default: { gap: 'space-y-3', padding: 'py-2' },
  compact: { gap: 'space-y-2', padding: 'py-1' },
};

// =============================================================================
// Component
// =============================================================================

export function PageCommandList({
  commands,
  title,
  icon,
  hint,
  variant = 'default',
  className,
  testId,
}: PageCommandListProps) {
  const Icon = icon ? resolveIcon(icon) : null;
  const styles = variantClasses[variant];

  if (commands.length === 0) {
    return null;
  }

  return (
    <div
      className={cn('rounded-lg border border-border bg-card p-4', className)}
      data-testid={testId}
    >
      {title && (
        <h3 className="mb-4 flex items-center gap-2 text-base font-medium text-foreground">
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />}
          {title}
        </h3>
      )}

      <div className={styles.gap}>
        {commands.map((command, index) => (
          <div key={index} className={cn('flex items-center gap-3', styles.padding)}>
            <kbd className="inline-flex h-7 min-w-[60px] items-center justify-center rounded border border-border bg-muted px-2 font-mono text-xs text-foreground">
              {command.key}
            </kbd>
            <span className="text-sm text-muted-foreground">{command.description}</span>
          </div>
        ))}
      </div>

      {hint && <p className="mt-4 text-xs italic text-muted-foreground/70">{hint}</p>}
    </div>
  );
}
