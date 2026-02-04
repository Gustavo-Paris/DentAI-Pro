/**
 * PageListItem Component
 *
 * Individual list item component for PageList.
 *
 * @package @pageshell/interactions
 */

'use client';

import { cn, formatCompactRelativeTime, getInitials } from '@pageshell/core';
import {
  Button,
  Checkbox,
  StatusBadge,
  resolveIcon,
  type IconName,
} from '@pageshell/primitives';
import { useListItemContext } from './context';
import { variantStyles, iconColorClasses } from './constants';
import type { PageListItemProps } from './types';

// =============================================================================
// Component
// =============================================================================

export function PageListItem({
  icon,
  iconColor = 'default',
  avatar,
  title,
  description,
  timestamp,
  badge,
  actions,
  children,
  className,
}: PageListItemProps) {
  const context = useListItemContext();
  const variant = context?.variant ?? 'default';
  const isSelected = context?.isSelected ?? false;
  const isSelectable = context?.isSelectable ?? false;
  const isClickable = context?.isClickable ?? false;
  const onSelect = context?.onSelect;
  const onClick = context?.onClick;
  const Icon = resolveIcon(icon as IconName);

  const styles = variantStyles[variant];

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={cn(
        styles.item,
        'transition-colors',
        isClickable && 'cursor-pointer hover:bg-muted/50',
        isSelected && 'bg-primary/5',
        variant === 'card' && isSelected && 'border-primary/50',
        className
      )}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      aria-selected={isSelectable ? isSelected : undefined}
    >
      <div className={cn('flex items-start', styles.content)}>
        {/* Selection checkbox */}
        {isSelectable && (
          <div className="flex-shrink-0 mr-2" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect?.()}
              aria-label={`Select ${title}`}
            />
          </div>
        )}

        {/* Icon or Avatar */}
        {(Icon || avatar) && (
          <div className="flex-shrink-0">
            {avatar ? (
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {avatar.src ? (
                  <img src={avatar.src} alt={avatar.alt} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">
                    {avatar.fallback ?? getInitials(avatar.alt)}
                  </span>
                )}
              </div>
            ) : Icon ? (
              <div
                className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center',
                  iconColorClasses[iconColor]
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
            ) : null}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-foreground truncate">{title}</h4>
                {badge && (
                  <StatusBadge variant={badge.variant ?? 'default'} className="flex-shrink-0">
                    {badge.label}
                  </StatusBadge>
                )}
              </div>
              {description && (
                <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                  {description}
                </p>
              )}
            </div>

            {/* Timestamp and actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {timestamp && (
                <span className="text-xs text-muted-foreground">
                  {formatCompactRelativeTime(timestamp)}
                </span>
              )}
              {actions && actions.length > 0 && (
                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {actions.map((action, index) => {
                    const ActionIcon = resolveIcon(action.icon as IconName);
                    return (
                      <Button
                        key={index}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={action.onClick}
                        disabled={action.disabled}
                        aria-label={action.label}
                      >
                        {ActionIcon && <ActionIcon className="h-4 w-4" />}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Additional content */}
          {children && <div className="mt-2">{children}</div>}
        </div>
      </div>
    </div>
  );
}
