/**
 * Sidebar Primitive
 *
 * Container for sidebar navigation. Handles responsive behavior:
 * - Desktop: Fixed sidebar
 * - Mobile: Overlay drawer with backdrop
 *
 * @module primitives/Sidebar
 */

'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@pageshell/core';
import { useLayout } from './LayoutContext';

// =============================================================================
// Types
// =============================================================================

export interface SidebarProps {
  children: React.ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Width class for desktop (default: w-64) */
  width?: string;
  /** ARIA label for accessibility */
  'aria-label'?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Sidebar container with responsive behavior.
 *
 * @example
 * ```tsx
 * <Sidebar aria-label="Main navigation">
 *   <SidebarHeader brand={brand} />
 *   <SidebarNav sections={sections} />
 *   <SidebarFooter>
 *     <UserMenu user={user} />
 *   </SidebarFooter>
 * </Sidebar>
 * ```
 */
export function Sidebar({
  children,
  className,
  width = 'w-64',
  'aria-label': ariaLabel = 'Navigation',
}: SidebarProps) {
  const { isSidebarOpen, closeSidebar } = useLayout();
  const sidebarRef = React.useRef<HTMLElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  // Handle Escape key to close drawer
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        closeSidebar();
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      closeButtonRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen, closeSidebar]);

  // Focus trap for mobile drawer
  React.useEffect(() => {
    const handleFocusTrap = (e: KeyboardEvent) => {
      if (!isSidebarOpen || e.key !== 'Tab' || !sidebarRef.current) return;

      const focusableElements = sidebarRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0]!;
      const lastElement = focusableElements[focusableElements.length - 1]!;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('keydown', handleFocusTrap);
    }

    return () => {
      document.removeEventListener('keydown', handleFocusTrap);
    };
  }, [isSidebarOpen]);

  return (
    <>
      {/* Desktop Sidebar - Fixed */}
      <div className={cn('hidden md:block', width, 'flex-shrink-0')}>
        <aside
          role="navigation"
          aria-label={ariaLabel}
          className={cn(
            'fixed top-0 left-0 h-screen flex flex-col',
            'bg-sidebar border-r border-sidebar-border',
            width,
            className
          )}
        >
          {children}
        </aside>
      </div>

      {/* Mobile Drawer - Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 md:hidden',
          'transition-opacity duration-300',
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            'absolute inset-0 bg-[var(--overlay-light)] backdrop-blur-sm',
            'transition-opacity duration-300'
          )}
          style={{
            opacity: isSidebarOpen ? 1 : 0,
            willChange: isSidebarOpen ? 'opacity' : 'auto',
          }}
          onClick={closeSidebar}
          aria-hidden="true"
        />

        {/* Drawer */}
        <aside
          ref={sidebarRef}
          role="navigation"
          aria-label={ariaLabel}
          aria-modal="true"
          className={cn(
            'absolute top-0 left-0 h-full w-72 flex flex-col',
            'bg-sidebar border-r border-sidebar-border',
            'shadow-2xl',
            'transition-transform duration-300 ease-out',
            className
          )}
          style={{
            // GPU acceleration for smoother animations
            willChange: isSidebarOpen ? 'transform' : 'auto',
            transform: isSidebarOpen
              ? 'translate3d(0, 0, 0)'
              : 'translate3d(-100%, 0, 0)',
            // PWA safe-area: padding for notch/home indicator in standalone mode
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            paddingLeft: 'env(safe-area-inset-left, 0px)',
          }}
        >
          {/* Mobile close button */}
          <button
            ref={closeButtonRef}
            onClick={closeSidebar}
            className={cn(
              // PWA safe-area: position adjusted for notch area
              'absolute top-[calc(1rem+env(safe-area-inset-top,0px))] right-4 md:hidden',
              'flex h-10 w-10 items-center justify-center rounded-lg',
              'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
              'transition-colors touch-manipulation'
            )}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>

          {children}
        </aside>
      </div>
    </>
  );
}

// =============================================================================
// Sidebar Parts
// =============================================================================

export interface SidebarHeaderProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Header section of the sidebar (brand, title)
 */
export function SidebarHeader({ children, className }: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        'flex-shrink-0 p-4 border-b border-sidebar-border',
        className
      )}
    >
      {children}
    </div>
  );
}

export interface SidebarContentProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Scrollable content area of the sidebar
 */
export function SidebarContent({ children, className }: SidebarContentProps) {
  return (
    <div
      className={cn(
        'flex-1 overflow-y-auto py-4 px-3',
        'scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent',
        'hover:scrollbar-thumb-sidebar-foreground/30',
        className
      )}
      style={{ scrollbarWidth: 'thin' }}
    >
      {children}
    </div>
  );
}

export interface SidebarFooterProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Footer section of the sidebar (user menu, actions)
 */
export function SidebarFooter({ children, className }: SidebarFooterProps) {
  return (
    <div
      className={cn(
        'flex-shrink-0 border-t border-sidebar-border p-3',
        className
      )}
    >
      {children}
    </div>
  );
}

Sidebar.Header = SidebarHeader;
Sidebar.Content = SidebarContent;
Sidebar.Footer = SidebarFooter;
