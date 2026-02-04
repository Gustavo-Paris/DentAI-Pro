/**
 * Split Panel Defaults
 *
 * Default configuration values for SplitPanelPage.
 *
 * @module split-panel/defaults
 */

// =============================================================================
// SplitPanelPage Defaults
// =============================================================================

/**
 * Default values for SplitPanelPage component
 *
 * Note: SplitPanelPage uses a specialized 3-panel layout that doesn't
 * follow the standard card/shell pattern. The containerVariant is included
 * for API consistency but has limited effect on this composite.
 */
export const splitPanelPageDefaults = {
  theme: 'admin' as const,
  containerVariant: 'shell' as const,
  minHeight: '600px',
  stackOnMobile: true,
  mobileBreakpoint: 768,
} as const;
