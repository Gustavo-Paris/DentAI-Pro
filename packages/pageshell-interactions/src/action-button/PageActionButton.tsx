/**
 * PageActionButton Component
 *
 * A stateful toggle button for actions like Follow, Like, Star, Bookmark.
 * Supports three states: idle, active, and hover (on active).
 *
 * @module action-button
 *
 * @example Basic usage with custom states
 * ```tsx
 * const followStates = {
 *   idle: { label: 'Follow', icon: 'user-plus', variant: 'outline' },
 *   active: { label: 'Following', icon: 'user-check', variant: 'default' },
 *   hover: { label: 'Unfollow', icon: 'user-minus', variant: 'destructive' },
 * };
 *
 * <PageActionButton
 *   isActive={isFollowing}
 *   states={followStates}
 *   onToggle={handleToggle}
 * />
 * ```
 *
 * @example Using preset states
 * ```tsx
 * import { ACTION_BUTTON_PRESETS } from '@pageshell/interactions';
 *
 * <PageActionButton
 *   isActive={isLiked}
 *   states={ACTION_BUTTON_PRESETS.like}
 *   onToggle={handleLike}
 * />
 * ```
 *
 * @example Without icon
 * ```tsx
 * <PageActionButton
 *   isActive={isSubscribed}
 *   states={subscribeStates}
 *   onToggle={handleSubscribe}
 *   showIcon={false}
 *   size="sm"
 * />
 * ```
 */

'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { cn } from '@pageshell/core';
import { PageButton } from '@pageshell/primitives';
import type { PageActionButtonProps } from './types';

export function PageActionButton({
  isActive,
  isLoading = false,
  states,
  onToggle,
  size = 'default',
  showIcon = true,
  className,
  disabled,
  ...rest
}: PageActionButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(async () => {
    if (isLoading || disabled) return;
    await onToggle();
  }, [onToggle, isLoading, disabled]);

  // Determine current state config
  const currentState = isActive
    ? isHovered && states.hover
      ? states.hover
      : states.active
    : states.idle;

  // Get icon based on state and showIcon prop
  const getIcon = () => {
    if (!showIcon || isLoading) return undefined;
    return currentState.icon;
  };

  // Special hover styling for active → hover transition
  const isShowingHoverState = isActive && isHovered && states.hover;

  return (
    <PageButton
      variant={currentState.variant}
      size={size}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      loading={isLoading}
      icon={getIcon()}
      disabled={disabled}
      className={cn(
        'transition-all duration-200',
        // Apply destructive styling when showing hover state on active
        isShowingHoverState &&
          states.hover?.variant === 'destructive' &&
          'border-destructive text-destructive hover:bg-destructive/10',
        className
      )}
      {...rest}
    >
      {currentState.label}
    </PageButton>
  );
}

PageActionButton.displayName = 'PageActionButton';
