'use client';

/**
 * TopBar Component
 *
 * Shared header/topbar for all portal layouts (admin, creator, student).
 * Uses a slot-based design for maximum flexibility.
 *
 * @module portal/TopBar
 *
 * @example Basic usage with slots
 * ```tsx
 * <TopBar
 *   title="Minha Jornada"
 *   theme="student"
 *   menuButton={
 *     <MobileMenuButton onClick={openSidebar} isOpen={isSidebarOpen} />
 *   }
 *   notificationBell={
 *     <NotificationBell count={5} onClick={handleNotifications} />
 *   }
 * />
 * ```
 *
 * @example With custom content
 * ```tsx
 * <TopBar
 *   title="Portal do Criador"
 *   theme="creator"
 *   leftContent={<ConnectionStatus />}
 *   rightContent={<UserMenu />}
 * />
 * ```
 */

import type { ReactNode } from 'react';
import { cn } from '@pageshell/core';
import { getThemeConfig, type PageShellTheme } from '@pageshell/theme';

// =============================================================================
// Types
// =============================================================================

export interface PortalTopBarProps {
  /** Portal title displayed in the header */
  title: string;
  /** Theme variant */
  theme: PageShellTheme;
  /** Menu button slot (rendered on the left) */
  menuButton?: ReactNode;
  /** Left side custom content (after title) */
  leftContent?: ReactNode;
  /** Right side custom content (before notification) */
  rightContent?: ReactNode;
  /** Notification bell slot (rendered on the right) */
  notificationBell?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Theme-specific Styling
// =============================================================================

const themeStyles = {
  default: {
    title: 'text-foreground',
  },
  admin: {
    title: 'text-foreground',
  },
  creator: {
    title: 'text-foreground',
  },
  student: {
    title: 'text-foreground',
  },
} as const;

// =============================================================================
// TopBar Component
// =============================================================================

export function PortalTopBar({
  title,
  theme,
  menuButton,
  leftContent,
  rightContent,
  notificationBell,
  className,
}: PortalTopBarProps) {
  const config = getThemeConfig(theme);
  const styles = themeStyles[theme];

  return (
    <header
      role="banner"
      className={cn(
        'portal-topbar',
        'flex items-center justify-between',
        className
      )}
    >
      {/* Left Side: Menu Button + Title + Custom Content */}
      <div className="flex items-center gap-3">
        {menuButton}

        <span
          className={cn('text-lg font-semibold', styles.title, config.heading)}
          role="heading"
          aria-level={1}
        >
          {title}
        </span>

        {leftContent}
      </div>

      {/* Right Side: Custom Content + Notifications */}
      <div className="flex items-center gap-2 md:gap-4">
        {rightContent}
        {notificationBell}
      </div>
    </header>
  );
}

PortalTopBar.displayName = 'PortalTopBar';
