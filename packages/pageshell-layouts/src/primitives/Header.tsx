/**
 * Header Primitive
 *
 * Top bar component with mobile menu trigger and optional content slots.
 *
 * @module primitives/Header
 */

'use client';

import * as React from 'react';
import { Menu } from 'lucide-react';
import {
  cn,
  useMobileHeaderBehavior,
  type HeaderBehaviorConfig,
} from '@pageshell/core';
import { Button, resolveIcon } from '@pageshell/primitives';
import { useLayout } from './LayoutContext';
import type { BrandConfig } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface HeaderProps {
  /** Brand configuration (mobile) */
  brand?: BrandConfig;
  /** Left slot content */
  left?: React.ReactNode;
  /** Center slot content */
  center?: React.ReactNode;
  /** Right slot content */
  right?: React.ReactNode;
  /** Show mobile menu button */
  showMenuButton?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Sticky header */
  sticky?: boolean;
  /** Enable hide on scroll behavior (default: false) */
  hideOnScroll?: boolean;
  /** Current pathname for route-based header behavior */
  pathname?: string;
  /** Header behavior configuration */
  headerBehaviorConfig?: Partial<HeaderBehaviorConfig>;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Top header bar with mobile menu trigger.
 *
 * @example
 * ```tsx
 * <Header
 *   brand={{ icon: "sparkles", title: "App" }}
 *   right={<UserAvatar user={user} />}
 * />
 * ```
 */
export function Header({
  brand,
  left,
  center,
  right,
  showMenuButton = true,
  className,
  sticky = true,
  hideOnScroll = false,
  pathname = '',
  headerBehaviorConfig,
}: HeaderProps) {
  const { openSidebar } = useLayout();

  // Scroll-aware behavior (only when hideOnScroll is enabled)
  const { isHeaderVisible } = useMobileHeaderBehavior({
    pathname,
    config: headerBehaviorConfig,
  });

  // Determine if header should be visible
  const shouldShow = hideOnScroll ? isHeaderVisible : true;

  const BrandIcon = brand?.icon ? resolveIcon(brand.icon) : null;

  return (
    <header
      className={cn(
        'md:hidden flex items-center justify-between gap-4',
        // min-h-14 allows expansion with safe area padding
        'min-h-14 px-4 border-b border-border bg-background',
        // Safe area padding for notch/status bar on iOS/Android
        'pt-[env(safe-area-inset-top,0px)]',
        sticky && 'fixed top-0 left-0 right-0 z-40',
        // Hide on scroll transition
        hideOnScroll && 'transition-transform duration-300',
        hideOnScroll && !shouldShow && '-translate-y-full',
        className
      )}
    >
      {/* Left section */}
      <div className="flex items-center gap-3">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={openSidebar}
            aria-label="Open menu"
            className="touch-manipulation"
          >
            <Menu className="w-5 h-5" />
          </Button>
        )}

        {/* Brand (mobile) */}
        {brand && (
          <div className="flex items-center gap-2">
            {BrandIcon && (
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <BrandIcon className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <span className="font-semibold text-foreground">{brand.title}</span>
          </div>
        )}

        {left}
      </div>

      {/* Center section */}
      {center && <div className="flex-1 flex justify-center">{center}</div>}

      {/* Right section */}
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  );
}

// =============================================================================
// Desktop Header
// =============================================================================

export interface DesktopHeaderProps {
  /** Left slot content */
  left?: React.ReactNode;
  /** Center slot content */
  center?: React.ReactNode;
  /** Right slot content */
  right?: React.ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Sticky header */
  sticky?: boolean;
}

/**
 * Desktop-only header bar (hidden on mobile).
 *
 * @example
 * ```tsx
 * <DesktopHeader
 *   left={<Breadcrumbs items={crumbs} />}
 *   right={<NotificationBell />}
 * />
 * ```
 */
export function DesktopHeader({
  left,
  center,
  right,
  className,
  sticky = true,
}: DesktopHeaderProps) {
  return (
    <header
      className={cn(
        'hidden md:flex items-center justify-between gap-4',
        'h-14 px-6 border-b border-border bg-background',
        sticky && 'sticky top-0 z-40',
        className
      )}
    >
      {/* Left section */}
      {left && <div className="flex items-center gap-3">{left}</div>}

      {/* Center section */}
      {center && <div className="flex-1 flex justify-center">{center}</div>}

      {/* Right section */}
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  );
}

Header.Desktop = DesktopHeader;
