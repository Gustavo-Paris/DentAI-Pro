'use client';

/**
 * React Router Adapter for @pageshell/shell
 *
 * Provides React Router-specific components and utilities.
 *
 * @module adapters/react-router
 */

import type { ReactNode, ComponentType } from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Props for Link component
 */
export interface LinkComponentProps {
  to: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

/**
 * React Router Link component type
 */
export type LinkComponent = ComponentType<LinkComponentProps>;

/**
 * Default React Router Link wrapper
 */
export function RouterLink({ to, className, children, onClick }: LinkComponentProps) {
  return (
    <Link to={to} className={className} onClick={onClick}>
      {children as any}
    </Link>
  );
}

// Re-export Link for convenience
export { Link };

/**
 * Hook to get the current pathname for active state detection.
 * Wraps useLocation().pathname to provide a usePathname-compatible API.
 */
export function usePathname(): string {
  const location = useLocation();
  return location.pathname;
}
