/**
 * Class Maps - Shared CSS class configurations for PageShell components.
 *
 * @internal These are used internally and not part of the public API.
 */

// =============================================================================
// Container Variants
// =============================================================================

export type ContainerVariant = 'default' | 'narrow' | 'wide' | 'fullWidth' | 'shell';

export const containerVariantClasses: Record<ContainerVariant, string> = {
  default: 'max-w-7xl mx-auto',
  narrow: 'max-w-4xl mx-auto',
  wide: 'max-w-[1400px] mx-auto',
  fullWidth: 'w-full',
  shell: 'w-full',
};

// =============================================================================
// Padding Classes (responsive)
// =============================================================================

export type PaddingVariant = 'none' | 'sm' | 'md' | 'lg';

export const paddingClasses: Record<PaddingVariant, string> = {
  none: '',
  sm: 'px-3 sm:px-4 py-3 sm:py-4',
  md: 'px-4 sm:px-6 py-4 sm:py-6',
  lg: 'px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8',
};

// =============================================================================
// Spacing Classes
// =============================================================================

export type SpacingVariant = 'compact' | 'default' | 'relaxed';

export const spacingClasses: Record<SpacingVariant, string> = {
  compact: 'space-y-3',  // 12px - for dense layouts
  default: 'space-y-4',  // 16px - balanced default
  relaxed: 'space-y-6',  // 24px - spacious layouts
};

// Header area spacing (navigation + header) is always tighter
export const headerSpacingClasses: Record<SpacingVariant, string> = {
  compact: 'space-y-1',  // 4px
  default: 'space-y-2',  // 8px
  relaxed: 'space-y-3',  // 12px
};
