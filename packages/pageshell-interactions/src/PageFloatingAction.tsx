'use client';

/**
 * PageFloatingAction Component (FAB)
 *
 * A floating action button for primary actions, following Material Design patterns.
 * Supports expandable menu with multiple actions.
 *
 * @example Simple FAB
 * <PageFloatingAction
 *   icon={Plus}
 *   label="Criar curso"
 *   onClick={() => router.push('/courses/new')}
 * />
 *
 * @example With expandable menu
 * <PageFloatingAction
 *   icon={Plus}
 *   label="Adicionar"
 *   actions={[
 *     { icon: BookOpen, label: 'Novo curso', onClick: () => {} },
 *     { icon: FileText, label: 'Novo modulo', onClick: () => {} },
 *     { icon: Video, label: 'Nova aula', onClick: () => {} },
 *   ]}
 * />
 *
 * @example Custom position and style
 * <PageFloatingAction
 *   icon={MessageCircle}
 *   label="Chat"
 *   position="bottom-left"
 *   variant="secondary"
 *   showLabel
 *   onClick={openChat}
 * />
 *
 * @example Hide on scroll
 * <PageFloatingAction
 *   icon={ArrowUp}
 *   label="Back to top"
 *   hideOnScroll
 *   onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
 * />
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { X } from 'lucide-react';
import { cn, useHandlerMap } from '@pageshell/core';
import { usePageShellContext } from '@pageshell/theme';
import { resolveIcon, type IconName } from '@pageshell/primitives';
import type { LucideIcon } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

/** Icon type - string name or LucideIcon component */
export type PageIconVariant = IconName | LucideIcon | undefined;

/** FAB position */
export type PageFloatingActionPosition = 'bottom-right' | 'bottom-left' | 'bottom-center';

/** FAB variant */
export type PageFloatingActionVariant = 'primary' | 'secondary';

/** FAB size */
export type PageFloatingActionSize = 'md' | 'lg';

/** Menu action */
export interface PageFloatingActionItem {
  /** Action icon */
  icon: PageIconVariant;
  /** Action label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * PageFloatingAction component props
 */
export interface PageFloatingActionProps {
  /** Main icon */
  icon: PageIconVariant;
  /** Accessible label */
  label: string;
  /** Click handler (for single action) */
  onClick?: () => void;

  // Menu (alternative to onClick)
  /** Expandable action menu */
  actions?: PageFloatingActionItem[];

  // Position
  /** Button position */
  position?: PageFloatingActionPosition;
  /** Offset from edges */
  offset?: { x?: number; y?: number };

  // Behavior
  /** Hide when scrolling down */
  hideOnScroll?: boolean;
  /** Scroll threshold for hide (pixels) */
  scrollThreshold?: number;

  // Display
  /** Show label next to icon */
  showLabel?: boolean | 'hover';
  /** Button variant */
  variant?: PageFloatingActionVariant;
  /** Button size */
  size?: PageFloatingActionSize;

  // Visibility
  /** Control visibility */
  visible?: boolean;

  // Accessibility
  /** Test ID */
  testId?: string;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

const positionClasses: Record<PageFloatingActionPosition, string> = {
  // PWA safe-area: use calc() with safe-area-inset for home indicator
  'bottom-right': 'right-6 bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))]',
  'bottom-left': 'left-6 bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))]',
  'bottom-center': 'left-1/2 -translate-x-1/2 bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))]',
};

const variantClasses: Record<PageFloatingActionVariant, { main: string; menu: string }> = {
  primary: {
    main: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25',
    menu: 'bg-primary text-primary-foreground hover:bg-primary/90',
  },
  secondary: {
    main: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-lg',
    menu: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  },
};

const sizeClasses: Record<PageFloatingActionSize, { button: string; icon: string; menuItem: string; menuIcon: string }> = {
  md: {
    button: 'h-14 w-14',
    icon: 'h-6 w-6',
    menuItem: 'h-12 min-w-12 px-4',
    menuIcon: 'h-5 w-5',
  },
  lg: {
    button: 'h-16 w-16',
    icon: 'h-7 w-7',
    menuItem: 'h-14 min-w-14 px-5',
    menuIcon: 'h-6 w-6',
  },
};

// =============================================================================
// PageFloatingAction Component
// =============================================================================

export function PageFloatingAction({
  icon,
  label,
  onClick,
  // Menu
  actions = [],
  // Position
  position = 'bottom-right',
  offset = {},
  // Behavior
  hideOnScroll = false,
  scrollThreshold = 50,
  // Display
  showLabel = false,
  variant = 'primary',
  size = 'md',
  // Visibility
  visible = true,
  // Accessibility
  testId,
  className,
}: PageFloatingActionProps) {
  // Try to get context, but don't fail if not available
  let config;
  try {
    const context = usePageShellContext();
    config = context.config;
  } catch {
    config = { animate: 'animate-in fade-in-0' };
  }

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const lastScrollY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resolve icon - handle both string and LucideIcon
  const Icon = typeof icon === 'string' ? resolveIcon(icon as IconName) : icon;
  const hasMenu = actions.length > 0;
  const styles = variantClasses[variant];
  const sizes = sizeClasses[size];

  // Hide on scroll behavior
  useEffect(() => {
    if (!hideOnScroll) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDiff = currentScrollY - lastScrollY.current;

      if (scrollDiff > scrollThreshold && currentScrollY > 100) {
        setIsHidden(true);
        setIsMenuOpen(false);
      } else if (scrollDiff < -scrollThreshold || currentScrollY < 100) {
        setIsHidden(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hideOnScroll, scrollThreshold]);

  // Close menu on outside click
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Close menu on escape
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen]);

  // Handle main button click
  const handleMainClick = () => {
    if (hasMenu) {
      setIsMenuOpen(!isMenuOpen);
    } else {
      onClick?.();
    }
  };

  // Handle menu item click - memoized handlers for stable references
  const { getHandler: getMenuItemHandler } = useHandlerMap((index: number) => {
    const action = actions[index];
    if (action) {
      action.onClick();
      setIsMenuOpen(false);
    }
  });

  // Calculate offset styles (memoized for stable reference)
  const offsetStyle = useMemo(() => {
    const style: React.CSSProperties = {};
    if (offset.x !== undefined) {
      if (position === 'bottom-right') {
        style.right = offset.x;
      } else if (position === 'bottom-left') {
        style.left = offset.x;
      }
    }
    if (offset.y !== undefined) {
      style.bottom = offset.y;
    }
    return style;
  }, [offset.x, offset.y, position]);

  // Determine if label should be shown
  const shouldShowLabel = showLabel === true || (showLabel === 'hover' && isHovered);

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed z-40 flex flex-col-reverse items-center gap-3',
        positionClasses[position],
        isHidden && 'translate-y-24 opacity-0',
        'transition-all duration-300',
        className
      )}
      style={offsetStyle}
      data-testid={testId}
    >
      {/* Main button */}
      <button
        type="button"
        onClick={handleMainClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'relative flex items-center justify-center rounded-full transition-all duration-200',
          'focus:outline-none focus-visible:ring-4 focus-visible:ring-ring',
          styles.main,
          sizes.button,
          shouldShowLabel && 'w-auto px-5 gap-2',
          isMenuOpen && 'rotate-45'
        )}
        aria-label={label}
        aria-expanded={hasMenu ? isMenuOpen : undefined}
        aria-haspopup={hasMenu ? 'menu' : undefined}
      >
        {isMenuOpen && hasMenu ? (
          <X className={sizes.icon} />
        ) : (
          Icon && <Icon className={sizes.icon} />
        )}
        {shouldShowLabel && !isMenuOpen && (
          <span className="font-medium whitespace-nowrap">{label}</span>
        )}
      </button>

      {/* Menu items */}
      {hasMenu && isMenuOpen && (
        <div
          className={cn(
            'flex flex-col-reverse gap-2',
            config.animate
          )}
          role="menu"
          aria-label={label}
        >
          {actions.map((action, index) => {
            // Resolve action icon
            const ActionIcon = typeof action.icon === 'string'
              ? resolveIcon(action.icon as IconName)
              : action.icon;
            return (
              <button
                key={index}
                type="button"
                role="menuitem"
                onClick={getMenuItemHandler(index)}
                disabled={action.disabled}
                className={cn(
                  'flex items-center gap-2 rounded-full transition-all duration-200',
                  'focus:outline-none focus-visible:ring-4 focus-visible:ring-ring',
                  styles.menu,
                  sizes.menuItem,
                  action.disabled && 'opacity-50 cursor-not-allowed',
                  // Stagger animation (delay handled via inline style below)
                  'animate-in fade-in-0 slide-in-from-bottom-2'
                )}
                style={{
                  animationDelay: `${(actions.length - 1 - index) * 50}ms`,
                }}
                aria-disabled={action.disabled}
              >
                {ActionIcon && <ActionIcon className={sizes.menuIcon} />}
                <span className="text-sm font-medium whitespace-nowrap pr-1">{action.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
