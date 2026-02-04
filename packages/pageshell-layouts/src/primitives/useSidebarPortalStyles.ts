/**
 * Sidebar Portal Theme Styles Hook
 *
 * Since Radix portals render outside the theme context (.ui-theme),
 * we need to read computed CSS values and inject them into portal elements.
 *
 * @see ADR-0043 - Radix Portal Theme Variables Injection
 * @module primitives/useSidebarPortalStyles
 */

'use client';

import * as React from 'react';

/**
 * CSS properties for sidebar portal elements.
 * These are injected via inline styles to override the default theme.
 */
export interface SidebarPortalStyles extends React.CSSProperties {
  '--color-popover'?: string;
  '--color-popover-foreground'?: string;
  '--color-accent'?: string;
  '--color-accent-foreground'?: string;
  '--color-muted'?: string;
  '--color-muted-foreground'?: string;
  '--border'?: string;
}

/**
 * Hook to inject sidebar theme styles into portal elements.
 *
 * Reads computed values from the closest `.ui-theme` element and returns
 * an object of inline styles with:
 * - Background and foreground colors from sidebar
 * - Accent colors for hover states
 * - Border color
 *
 * @example
 * ```tsx
 * const portalStyles = useSidebarPortalStyles();
 *
 * <DropdownMenuContent style={portalStyles}>
 *   {children}
 * </DropdownMenuContent>
 * ```
 *
 * @returns CSS properties object to spread on portal content
 */
export function useSidebarPortalStyles(): SidebarPortalStyles {
  const [styles, setStyles] = React.useState<SidebarPortalStyles>({});

  React.useEffect(() => {
    // Find the closest theme container to inherit sidebar colors
    const themeElement = document.querySelector('.ui-theme');
    if (!themeElement) return;

    const computed = getComputedStyle(themeElement);

    // Read sidebar-specific CSS variables
    const sidebar = computed.getPropertyValue('--color-sidebar').trim();
    const sidebarForeground = computed
      .getPropertyValue('--color-sidebar-foreground')
      .trim();
    const sidebarAccent = computed
      .getPropertyValue('--color-sidebar-accent')
      .trim();
    const sidebarAccentForeground = computed
      .getPropertyValue('--color-sidebar-accent-foreground')
      .trim();
    const sidebarBorder = computed
      .getPropertyValue('--color-sidebar-border')
      .trim();

    // Only update if we have valid values
    if (sidebar || sidebarForeground) {
      setStyles({
        // Map sidebar variables to popover/dropdown variables
        '--color-popover': sidebar || undefined,
        '--color-popover-foreground': sidebarForeground || undefined,
        '--color-accent': sidebarAccent || undefined,
        '--color-accent-foreground': sidebarAccentForeground || undefined,
        '--color-muted': sidebarAccent || undefined,
        '--color-muted-foreground': sidebarForeground || undefined,
        '--border': sidebarBorder || undefined,
        // Direct style properties for immediate effect
        backgroundColor: sidebar || undefined,
        color: sidebarForeground || undefined,
        borderColor: sidebarBorder || undefined,
      });
    }
  }, []);

  return styles;
}
