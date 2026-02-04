/**
 * UserMenu Primitive
 *
 * User profile dropdown menu for sidebar footer.
 * Framework-agnostic with render props for links and avatars.
 * Shows avatar-only with tooltip when collapsed.
 *
 * @module primitives/UserMenu
 */

'use client';

import * as React from 'react';
import { ChevronUp, LogOut } from 'lucide-react';
import { cn, getInitials } from '@pageshell/core';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  resolveIcon,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@pageshell/primitives';
import { useLayout, useLayoutAdapters } from './LayoutContext';
import { useCollapsibleSidebarOptional } from './CollapsibleSidebar';
import { useSidebarPortalStyles } from './useSidebarPortalStyles';
import type { UserProfile, UserMenuItem } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface UserMenuProps {
  /** User profile data */
  user: UserProfile;
  /** Menu items */
  items?: UserMenuItem[];
  /** Sign out handler */
  onSignOut?: () => void;
  /** Sign out label */
  signOutLabel?: string;
  /** Account label */
  accountLabel?: string;
  /** Theme toggle component */
  themeToggle?: React.ReactNode;
  /** Theme label */
  themeLabel?: string;
  /** Additional CSS class */
  className?: string;
}

// =============================================================================
// Avatar Component - Memoized
// =============================================================================

interface UserAvatarProps {
  user: UserProfile;
  size?: number;
}

/**
 * Custom comparison for UserAvatar memoization.
 */
function areAvatarPropsEqual(
  prevProps: UserAvatarProps,
  nextProps: UserAvatarProps
): boolean {
  return (
    prevProps.user.image === nextProps.user.image &&
    prevProps.user.name === nextProps.user.name &&
    prevProps.size === nextProps.size
  );
}

const UserAvatar = React.memo(function UserAvatar({ user, size = 36 }: UserAvatarProps) {
  const { renderAvatar } = useLayoutAdapters();

  if (user.image && renderAvatar) {
    return renderAvatar({
      src: user.image,
      alt: user.name || 'User',
      width: size,
      height: size,
      className: 'rounded-full object-cover',
    });
  }

  if (user.image) {
    return (
      <img
        src={user.image}
        alt={user.name || 'User'}
        width={size}
        height={size}
        className="rounded-full object-cover"
      />
    );
  }

  return (
    <div
      className="rounded-full bg-sidebar-primary flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <span className="text-xs font-semibold text-sidebar-primary-foreground">
        {getInitials(user.name)}
      </span>
    </div>
  );
}, areAvatarPropsEqual);

UserAvatar.displayName = 'UserAvatar';

// =============================================================================
// Menu Item - Memoized
// =============================================================================

interface UserMenuItemRendererProps {
  item: UserMenuItem;
  renderLink: ReturnType<typeof useLayoutAdapters>['renderLink'];
  onNavigate: () => void;
}

const UserMenuItemRenderer = React.memo(function UserMenuItemRenderer({
  item,
  renderLink,
  onNavigate,
}: UserMenuItemRendererProps) {
  const ItemIcon = item.icon ? resolveIcon(item.icon) : null;

  return (
    <React.Fragment>
      {item.separator && <DropdownMenuSeparator />}
      <DropdownMenuItem asChild>
        {renderLink({
          item: {
            title: item.label,
            href: item.href,
            icon: item.icon,
          },
          isActive: false,
          className: 'flex items-center gap-3 cursor-pointer',
          children: (
            <>
              {ItemIcon && <ItemIcon className="w-4 h-4" />}
              <span>{item.label}</span>
            </>
          ),
          onClick: onNavigate,
        })}
      </DropdownMenuItem>
    </React.Fragment>
  );
});

UserMenuItemRenderer.displayName = 'UserMenuItemRenderer';

// =============================================================================
// Component
// =============================================================================

/**
 * User profile menu with dropdown.
 *
 * @example
 * ```tsx
 * <UserMenu
 *   user={{ name: "John Doe", email: "john@example.com", role: "Creator" }}
 *   items={[
 *     { label: "Profile", href: "/profile", icon: "user" },
 *     { label: "Settings", href: "/settings", icon: "settings" },
 *   ]}
 *   onSignOut={handleSignOut}
 * />
 * ```
 */
export function UserMenu({
  user,
  items = [],
  onSignOut,
  signOutLabel = 'Sair da Conta',
  accountLabel = 'Conta',
  themeToggle,
  themeLabel = 'Tema',
  className,
}: UserMenuProps) {
  const { closeSidebar } = useLayout();
  const { renderLink } = useLayoutAdapters();
  const collapsible = useCollapsibleSidebarOptional();
  const isCollapsed = collapsible?.isCollapsed ?? false;

  // Get portal styles for sidebar theme (ADR-0043)
  const portalStyles = useSidebarPortalStyles();

  // Prevent hydration mismatch: Radix DropdownMenu generates IDs that differ
  // between server and client. Only render after hydration is complete.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Memoize callbacks
  const handleNavigate = React.useCallback(() => {
    closeSidebar();
  }, [closeSidebar]);

  // Memoize role icon resolution
  // IMPORTANT: Must be called before any early returns (Rules of Hooks)
  const RoleIcon = React.useMemo(
    () => (user.roleIcon ? resolveIcon(user.roleIcon) : null),
    [user.roleIcon]
  );

  // Show skeleton placeholder during SSR/hydration to prevent layout shift
  if (!mounted) {
    return (
      <div
        className={cn(
          'w-full flex items-center gap-3 p-2 rounded-lg',
          'bg-sidebar-accent/50',
          isCollapsed ? 'justify-center' : '',
          className
        )}
        aria-hidden="true"
      >
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-sidebar-accent animate-pulse" />
        {!isCollapsed && (
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="h-3.5 w-24 rounded bg-sidebar-accent animate-pulse" />
            <div className="h-2.5 w-16 rounded bg-sidebar-accent animate-pulse" />
          </div>
        )}
      </div>
    );
  }

  // Collapsed: avatar-only button with tooltip, dropdown opens on click
  if (isCollapsed) {
    return (
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'group flex items-center justify-center p-2 rounded-lg transition-colors w-full',
                  'bg-sidebar-accent/50 hover:bg-sidebar-accent',
                  'data-[state=open]:bg-sidebar-accent',
                  className
                )}
                aria-label="User menu"
                suppressHydrationWarning
              >
                {/* Avatar - overflow-hidden + text-transparent to hide alt text when image fails */}
                <div className="relative flex-shrink-0 w-8 h-8 overflow-hidden rounded-full text-transparent [&_img]:w-full [&_img]:h-full [&_img]:object-cover">
                  <UserAvatar user={user} size={32} />
                  {/* Online indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-sidebar" />
                </div>
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            <div>
              <div className="font-semibold">{user.name || 'Usuario'}</div>
              {user.role && (
                <div className="text-xs opacity-70">{user.role}</div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent
          side="right"
          align="end"
          sideOffset={8}
          className="w-56 sidebar-dropdown"
          style={portalStyles}
        >
          <DropdownMenuLabel className="text-xs font-medium opacity-60 uppercase tracking-wider">
            {accountLabel}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-[var(--border)]" />

          {/* Menu items - memoized */}
          {items.map((item) => (
            <UserMenuItemRenderer
              key={item.href}
              item={item}
              renderLink={renderLink}
              onNavigate={handleNavigate}
            />
          ))}

          {/* Theme toggle */}
          {themeToggle && (
            <>
              <DropdownMenuSeparator className="bg-[var(--border)]" />
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-sm opacity-70">{themeLabel}</span>
                {themeToggle}
              </div>
            </>
          )}

          {/* Sign out */}
          {onSignOut && (
            <>
              <DropdownMenuSeparator className="bg-[var(--border)]" />
              <DropdownMenuItem
                onClick={onSignOut}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span>{signOutLabel}</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Expanded: full user menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'group w-full flex items-center gap-3 p-2 rounded-lg transition-colors',
            'bg-sidebar-accent/50 hover:bg-sidebar-accent',
            'data-[state=open]:bg-sidebar-accent',
            className
          )}
          aria-label="User menu"
          suppressHydrationWarning
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <UserAvatar user={user} />
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-sidebar" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user.name || 'Usuario'}
            </p>
            {user.role && (
              <div className="flex items-center gap-1">
                {RoleIcon && (
                  <RoleIcon className="w-3 h-3 text-sidebar-foreground/50" />
                )}
                <span className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider font-medium">
                  {user.role}
                </span>
              </div>
            )}
          </div>

          {/* Expand indicator */}
          <ChevronUp
            className={cn(
              'w-4 h-4 text-sidebar-foreground/50 transition-transform duration-200',
              'rotate-180 group-data-[state=open]:rotate-0'
            )}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align="end"
        sideOffset={8}
        alignOffset={-8}
        className="w-56 sidebar-dropdown"
        style={portalStyles}
      >
        <DropdownMenuLabel className="text-xs font-medium opacity-60 uppercase tracking-wider">
          {accountLabel}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[var(--border)]" />

        {/* Menu items - memoized */}
        {items.map((item) => (
          <UserMenuItemRenderer
            key={item.href}
            item={item}
            renderLink={renderLink}
            onNavigate={handleNavigate}
          />
        ))}

        {/* Theme toggle */}
        {themeToggle && (
          <>
            <DropdownMenuSeparator className="bg-[var(--border)]" />
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm opacity-70">{themeLabel}</span>
              {themeToggle}
            </div>
          </>
        )}

        {/* Sign out */}
        {onSignOut && (
          <>
            <DropdownMenuSeparator className="bg-[var(--border)]" />
            <DropdownMenuItem
              onClick={onSignOut}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span>{signOutLabel}</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
