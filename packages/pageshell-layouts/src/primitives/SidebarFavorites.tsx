/**
 * SidebarFavorites - Display and manage favorite/pinned navigation items
 *
 * Features:
 * - Drag and drop reordering
 * - Pin/unpin items
 * - Persists in localStorage
 *
 * @module primitives/SidebarFavorites
 */

'use client';

import * as React from 'react';
import { Star, GripVertical, X, Pin } from 'lucide-react';
import { cn, useFavorites, type FavoriteItem } from '@pageshell/core';
import { resolveIcon } from '@pageshell/primitives';
import { useLayoutAdapters, useLayout } from './LayoutContext';

// =============================================================================
// Types
// =============================================================================

export interface SidebarFavoritesProps {
  /** localStorage key for persistence */
  storageKey?: string;
  /** Maximum favorites allowed (default: 10) */
  maxItems?: number;
  /** Section label */
  label?: string;
  /** Enable drag and drop reordering (default: true) */
  enableReorder?: boolean;
  /** Show remove button on hover (default: true) */
  showRemoveButton?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Hide when no items (default: true) */
  hideWhenEmpty?: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Display and manage favorite/pinned navigation items.
 *
 * @example
 * ```tsx
 * <SidebarFavorites
 *   label="Favoritos"
 *   maxItems={5}
 *   enableReorder={true}
 * />
 * ```
 */
export function SidebarFavorites({
  storageKey = 'sidebar-favorites',
  maxItems = 10,
  label = 'Favoritos',
  enableReorder = true,
  showRemoveButton = true,
  className,
  hideWhenEmpty = true,
}: SidebarFavoritesProps) {
  const { renderLink } = useLayoutAdapters();
  const { closeSidebar } = useLayout();
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [dropIndex, setDropIndex] = React.useState<number | null>(null);

  const { favorites, removeFavorite, reorder, count } = useFavorites({
    storageKey,
    maxItems,
  });

  // Hide section when empty
  if (hideWhenEmpty && count === 0) {
    return null;
  }

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropIndex(index);
  };

  const handleDragLeave = () => {
    setDropIndex(null);
  };

  const handleDrop = (toIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const fromIndex = Number(e.dataTransfer.getData('text/plain'));
    if (!isNaN(fromIndex) && fromIndex !== toIndex) {
      reorder(fromIndex, toIndex);
    }
    setDragIndex(null);
    setDropIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDropIndex(null);
  };

  return (
    <div className={cn('mt-6', className)}>
      {/* Section Header */}
      <div className="px-3 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Star className="w-3 h-3 text-sidebar-foreground/50" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
            {label}
          </span>
        </div>
        <span className="text-[10px] text-sidebar-foreground/40">
          {count}/{maxItems}
        </span>
      </div>

      {/* Favorites List */}
      <div className="space-y-0.5">
        {favorites.map((item, index) => (
          <FavoriteItemRow
            key={item.href}
            item={item}
            index={index}
            onRemove={() => removeFavorite(item.href)}
            onNavigate={closeSidebar}
            renderLink={renderLink}
            enableReorder={enableReorder}
            showRemoveButton={showRemoveButton}
            isDragging={dragIndex === index}
            isDropTarget={dropIndex === index}
            onDragStart={handleDragStart(index)}
            onDragOver={handleDragOver(index)}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop(index)}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      {/* Empty State */}
      {count === 0 && !hideWhenEmpty && (
        <div className="px-3 py-4 text-center">
          <Pin className="w-5 h-5 mx-auto mb-2 text-sidebar-foreground/30" />
          <p className="text-xs text-sidebar-foreground/40">
            Nenhum favorito ainda
          </p>
          <p className="text-[10px] text-sidebar-foreground/30 mt-1">
            Clique no ícone de estrela para fixar páginas
          </p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Favorite Item Row
// =============================================================================

interface FavoriteItemRowProps {
  item: FavoriteItem;
  index: number;
  onRemove: () => void;
  onNavigate?: () => void;
  renderLink: ReturnType<typeof useLayoutAdapters>['renderLink'];
  enableReorder: boolean;
  showRemoveButton: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

function FavoriteItemRow({
  item,
  index,
  onRemove,
  onNavigate,
  renderLink,
  enableReorder,
  showRemoveButton,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: FavoriteItemRowProps) {
  const ResolvedIcon = item.icon ? resolveIcon(item.icon) : null;
  const Icon = ResolvedIcon ?? Star;

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove();
  };

  const itemClassName = cn(
    'group relative flex items-center gap-2 px-3 min-h-[40px] py-1.5 rounded-lg',
    'text-sm transition-all duration-150 touch-manipulation',
    'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground',
    isDragging && 'opacity-50',
    isDropTarget && 'bg-sidebar-primary/10 border-t-2 border-sidebar-primary'
  );

  const content = (
    <>
      {/* Drag handle */}
      {enableReorder && (
        <div
          className={cn(
            'flex-shrink-0 p-1 -ml-1 cursor-grab active:cursor-grabbing',
            'opacity-0 group-hover:opacity-50 hover:!opacity-100',
            'transition-opacity'
          )}
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <GripVertical className="w-3 h-3" />
        </div>
      )}

      {/* Icon */}
      <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />

      {/* Title */}
      <span className="flex-1 truncate text-[13px]">{item.title}</span>

      {/* Remove button */}
      {showRemoveButton && (
        <button
          onClick={handleRemove}
          className={cn(
            'absolute right-2 p-1 rounded',
            'text-sidebar-foreground/40 hover:text-sidebar-foreground/70',
            'opacity-0 group-hover:opacity-100',
            'transition-opacity'
          )}
          aria-label={`Remover ${item.title} dos favoritos`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </>
  );

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {renderLink({
        item: { href: item.href, title: item.title, icon: item.icon },
        isActive: false,
        className: itemClassName,
        children: content,
        onClick: onNavigate,
      })}
    </div>
  );
}

// =============================================================================
// Pin Button Component (for use in nav items)
// =============================================================================

export interface PinButtonProps {
  /** Item to pin/unpin */
  item: Omit<FavoriteItem, 'addedAt' | 'order'>;
  /** localStorage key for favorites */
  storageKey?: string;
  /** Additional CSS class */
  className?: string;
}

/**
 * Button to pin/unpin a navigation item.
 * Use this in nav items to allow users to add favorites.
 *
 * @example
 * ```tsx
 * <NavItem href="/dashboard" title="Dashboard" icon="home">
 *   <PinButton item={{ href: '/dashboard', title: 'Dashboard', icon: 'home' }} />
 * </NavItem>
 * ```
 */
export function PinButton({
  item,
  storageKey = 'sidebar-favorites',
  className,
}: PinButtonProps) {
  const { isFavorite, toggleFavorite, isMaxReached } = useFavorites({
    storageKey,
  });

  const isPinned = isFavorite(item.href);
  const disabled = !isPinned && isMaxReached;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      toggleFavorite(item);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'p-1 rounded transition-colors',
        isPinned
          ? 'text-primary hover:text-primary/80'
          : 'text-sidebar-foreground/30 hover:text-sidebar-foreground/60',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      aria-label={isPinned ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      title={
        disabled
          ? 'Limite de favoritos atingido'
          : isPinned
            ? 'Remover dos favoritos'
            : 'Adicionar aos favoritos'
      }
    >
      <Star
        className={cn('w-3 h-3', isPinned && 'fill-current')}
      />
    </button>
  );
}
