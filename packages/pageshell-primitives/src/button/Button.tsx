/**
 * Button Primitive
 *
 * Theme-aware button that works across design systems.
 * Uses CSS custom properties from the configured theme.
 *
 * @module button
 */

'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@pageshell/core';
import { buttonVariants, type ButtonVariantProps } from './Button.variants';

// =============================================================================
// Types
// =============================================================================

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {
  /** Render as a different element using Radix Slot */
  asChild?: boolean;
  /** Show loading state */
  loading?: boolean;
  /** Icon to show before the label */
  leftIcon?: React.ReactNode;
  /** Icon to show after the label */
  rightIcon?: React.ReactNode;
}

// =============================================================================
// Loading Spinner
// =============================================================================

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 flex-shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// =============================================================================
// Component
// =============================================================================

/**
 * Button component
 *
 * A theme-aware button that adapts to the current design system theme.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Button>Click me</Button>
 *
 * // With variants
 * <Button variant="secondary" size="sm">Small secondary</Button>
 *
 * // With icons
 * <Button leftIcon={<PlusIcon />}>Add item</Button>
 *
 * // Loading state
 * <Button loading>Saving...</Button>
 *
 * // As a link (polymorphic)
 * <Button asChild>
 *   <a href="/page">Navigate</a>
 * </Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;
    const hasIcons = leftIcon || rightIcon || loading;

    const renderContent = () => {
      if (loading) {
        return (
          <>
            <LoadingSpinner />
            {children}
          </>
        );
      }

      if (!hasIcons) {
        return children;
      }

      return (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      );
    };

    // When using asChild with icons, clone the child and inject icons inside it
    if (asChild && hasIcons) {
      const child = React.Children.only(children) as React.ReactElement<{
        children?: React.ReactNode;
        className?: string;
      }>;

      const iconContent = (
        <>
          {loading && <LoadingSpinner />}
          {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {child.props.children}
          {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      );

      const clonedChild = React.cloneElement(child, {
        children: iconContent,
      });

      return (
        <Comp
          className={cn(buttonVariants({ variant, size, fullWidth, className }))}
          ref={ref}
          disabled={isDisabled}
          aria-disabled={isDisabled}
          aria-busy={loading}
          {...props}
        >
          {clonedChild}
        </Comp>
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {renderContent()}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button };
