import { useId, useRef, useMemo } from 'react';
import { cn } from '@pageshell/core/utils';
import {
  containerVariantClasses,
  paddingClasses,
  spacingClasses,
  headerSpacingClasses,
  type ContainerVariant,
  type PaddingVariant,
  type SpacingVariant,
} from '../lib/class-maps';

/**
 * Configuration for container setup.
 */
export interface ContainerSetupConfig {
  containerVariant?: ContainerVariant;
  padding?: PaddingVariant;
  spacing?: SpacingVariant;
  className?: string;
  ariaLabel?: string;
  testId?: string;
}

/**
 * Return type for useContainerSetup hook.
 */
export interface ContainerSetupResult {
  /** Ref to attach to the main container element */
  containerRef: React.RefObject<HTMLElement>;
  /** Generated ID for header-main association (SSR-safe) */
  headerId: string;
  /** Computed container CSS classes */
  containerClasses: string;
  /** Computed header area CSS classes */
  headerAreaClasses: string;
  /** Props to spread on the main element */
  mainProps: {
    ref: React.RefObject<HTMLElement>;
    className: string;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'data-testid'?: string;
  };
}

/**
 * Hook to consolidate container setup logic used across PageShell variants.
 *
 * Extracts common pattern for:
 * - Container class computation
 * - Header area classes
 * - Main element props (ref, aria, testId)
 *
 * @internal
 */
export function useContainerSetup({
  containerVariant = 'default',
  padding = 'none',
  spacing = 'default',
  className,
  ariaLabel,
  testId,
}: ContainerSetupConfig): ContainerSetupResult {
  // Cast needed: React 19 useRef returns RefObject<T | null>, React 18 types expect RefObject<T>
  const containerRef = useRef<HTMLElement>(null) as React.RefObject<HTMLElement>;
  const headerId = useId();

  const containerClasses = cn(
    containerVariantClasses[containerVariant],
    paddingClasses[padding],
    spacingClasses[spacing],
    className
  );

  const headerAreaClasses = cn(headerSpacingClasses[spacing]);

  // Note: aria-label takes precedence over aria-labelledby when both are present,
  // so we only add aria-labelledby when aria-label is not provided
  const mainProps = useMemo(
    () => ({
      ref: containerRef,
      className: containerClasses,
      'aria-label': ariaLabel,
      'aria-labelledby': !ariaLabel ? headerId : undefined,
      'data-testid': testId,
    }),
    [containerClasses, ariaLabel, headerId, testId]
  );

  return {
    containerRef,
    headerId,
    containerClasses,
    headerAreaClasses,
    mainProps,
  };
}
