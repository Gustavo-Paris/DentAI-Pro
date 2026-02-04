/**
 * PageList Component
 *
 * A versatile list component for displaying items with icons, actions, and metadata.
 * Ideal for notifications, activity feeds, comments, and simple data lists.
 *
 * @package @pageshell/interactions
 *
 * @example Basic list with renderItem
 * <PageList
 *   items={notifications}
 *   renderItem={(notification) => (
 *     <PageList.Item
 *       icon={Bell}
 *       title={notification.title}
 *       description={notification.message}
 *       timestamp={notification.createdAt}
 *     />
 *   )}
 * />
 *
 * @example Card variant with selection
 * <PageList
 *   items={tasks}
 *   variant="card"
 *   selectable
 *   selectedKeys={selectedKeys}
 *   onSelectionChange={setSelectedKeys}
 *   renderItem={(task) => (
 *     <PageList.Item
 *       icon={CheckSquare}
 *       title={task.title}
 *       badge={{ label: task.priority, variant: 'warning' }}
 *     />
 *   )}
 * />
 */

'use client';

import { useCallback } from 'react';
import { cn } from '@pageshell/core';
import { usePageShellContextOptional } from '@pageshell/theme';
import { ListItemContext, type PageListItemContext } from './context';
import { ANIMATION_DELAY_CLASSES, variantStyles } from './constants';
import { ListEmptyState, SkeletonItem } from './components';
import { PageListItem } from './PageListItem';
import type { PageListProps } from './types';

// =============================================================================
// PageList Component
// =============================================================================

function PageListRoot<T>({
  items,
  renderItem,
  keyExtractor,
  // Variants
  variant = 'default',
  dividers = true,
  animated = true,
  maxAnimationDelay = 8,
  // Selection
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
  // Click
  onItemClick,
  // States
  isLoading = false,
  skeleton,
  skeletonCount = 3,
  emptyState,
  // Accessibility
  ariaLabel,
  testId,
  className,
  itemClassName,
}: PageListProps<T>) {
  // Try to get context, but don't fail if not available
  const context = usePageShellContextOptional();
  const config = context?.config ?? {
    animate: 'animate-in fade-in-0 slide-in-from-bottom-2',
    animateDelay: (n: number) => ANIMATION_DELAY_CLASSES[Math.min(n, 8)] ?? '',
  };

  const styles = variantStyles[variant];

  // Get item key
  const getItemKey = useCallback((item: T, index: number): string => {
    if (keyExtractor) {
      return keyExtractor(item, index);
    }
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      if ('id' in obj) return String(obj.id);
      if ('_id' in obj) return String(obj._id);
      if ('key' in obj) return String(obj.key);
    }
    return String(index);
  }, [keyExtractor]);

  // Handle selection
  const handleSelect = useCallback((key: string) => {
    if (!onSelectionChange) return;

    const newKeys = new Set(selectedKeys);
    if (newKeys.has(key)) {
      newKeys.delete(key);
    } else {
      newKeys.add(key);
    }
    onSelectionChange(newKeys);
  }, [selectedKeys, onSelectionChange]);

  // Common list props
  const listProps = {
    role: 'list' as const,
    'aria-label': ariaLabel,
    'data-testid': testId,
  };

  // Loading state
  if (isLoading) {
    if (skeleton) {
      return <>{skeleton}</>;
    }

    return (
      <div
        {...listProps}
        aria-busy="true"
        className={cn(
          'overflow-hidden',
          variant !== 'card' && 'rounded-lg border border-border',
          styles.container,
          className
        )}
      >
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div
            key={index}
            className={cn(
              dividers && variant !== 'card' && index > 0 && 'border-t border-border'
            )}
          >
            <SkeletonItem variant={variant} />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (items.length === 0 && emptyState) {
    return (
      <div
        {...listProps}
        className={cn(
          'overflow-hidden rounded-lg border border-border',
          className
        )}
      >
        <ListEmptyState emptyState={emptyState} />
      </div>
    );
  }

  // Empty without state
  if (items.length === 0) {
    return null;
  }

  // Normal list
  return (
    <div
      {...listProps}
      className={cn(
        'overflow-hidden',
        variant !== 'card' && 'rounded-lg border border-border',
        styles.container,
        className
      )}
    >
      {items.map((item, index) => {
        const key = getItemKey(item, index);
        const isSelected = selectedKeys.has(key);

        const itemContext: PageListItemContext = {
          variant,
          isSelected,
          isSelectable: selectable,
          isClickable: Boolean(onItemClick),
          onSelect: () => handleSelect(key),
          onClick: () => onItemClick?.(item, index),
        };

        return (
          <div
            key={key}
            role="listitem"
            className={cn(
              dividers && variant !== 'card' && index > 0 && 'border-t border-border',
              animated && [
                config.animate,
                typeof config.animateDelay === 'function'
                  ? config.animateDelay(Math.min(index + 1, maxAnimationDelay))
                  : undefined,
              ],
              itemClassName
            )}
          >
            <ListItemContext.Provider value={itemContext}>
              {renderItem(item, index)}
            </ListItemContext.Provider>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// Compound Component Export
// =============================================================================

/**
 * PageList with attached sub-components
 *
 * @example
 * <PageList items={notifications} renderItem={(n) => (
 *   <PageList.Item
 *     icon={Bell}
 *     title={n.title}
 *     description={n.message}
 *     timestamp={n.createdAt}
 *   />
 * )} />
 */
export const PageList = Object.assign(PageListRoot, {
  /** Individual list item */
  Item: PageListItem,
});
