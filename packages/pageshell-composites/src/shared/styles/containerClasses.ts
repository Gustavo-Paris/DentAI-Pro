/**
 * Container Classes
 *
 * Shared container styling constants for page composites.
 * Ensures consistent layout across ListPage, CardListPage, and other composites.
 *
 * @module shared/styles/containerClasses
 */

// =============================================================================
// Container Wrapper Variants
// =============================================================================

/**
 * Container wrapper variant - controls the wrapper styling (card vs shell)
 * - 'card': Card-like container with background (default)
 * - 'shell': Matches PageShell.Static layout (no card wrapper)
 */
export type ContainerWrapperVariant = 'card' | 'shell';

/**
 * @deprecated Use `ContainerWrapperVariant` instead. Will be removed in v1.0.
 */
export type ContainerVariant = ContainerWrapperVariant;

// =============================================================================
// Card Variant (default) - card-like container with background
// =============================================================================

/** Max-width container with centered content */
export const CONTAINER_CLASSES = 'max-w-7xl mx-auto';

/** Card container styling */
export const CARD_CONTAINER_CLASSES = 'bg-card rounded-xl overflow-hidden';

/** Header section with border bottom and subtle background */
export const HEADER_SECTION_CLASSES = 'p-4 sm:p-6 border-b border-border bg-muted/30';

/** Content section with spacing */
export const CONTENT_SECTION_CLASSES = 'p-4 sm:p-6 space-y-5 sm:space-y-6';

// =============================================================================
// Shell Variant - matches PageShell.Static layout (no card wrapper)
// =============================================================================

/** Shell container - no wrapper, just max-width */
export const SHELL_CONTAINER_CLASSES = '';

/** Shell header - clean header without background */
export const SHELL_HEADER_CLASSES = 'mb-6';

/** Shell content - simple spacing */
export const SHELL_CONTENT_CLASSES = 'space-y-6';

// =============================================================================
// Variant Resolver
// =============================================================================

export function getContainerClasses(variant: ContainerWrapperVariant = 'card') {
  if (variant === 'shell') {
    return {
      container: '', // Full width - no max-width constraint
      card: SHELL_CONTAINER_CLASSES,
      header: SHELL_HEADER_CLASSES,
      content: SHELL_CONTENT_CLASSES,
    };
  }
  return {
    container: CONTAINER_CLASSES,
    card: CARD_CONTAINER_CLASSES,
    header: HEADER_SECTION_CLASSES,
    content: CONTENT_SECTION_CLASSES,
  };
}

// =============================================================================
// Grouped Export (backward compatible)
// =============================================================================

export const PAGE_CONTAINER_CLASSES = {
  container: CONTAINER_CLASSES,
  card: CARD_CONTAINER_CLASSES,
  header: HEADER_SECTION_CLASSES,
  content: CONTENT_SECTION_CLASSES,
} as const;
