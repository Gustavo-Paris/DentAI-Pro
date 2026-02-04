'use client';

/**
 * Next.js Adapter for @pageshell/shell
 *
 * Provides Next.js-specific components and utilities.
 *
 * @module adapters/next
 */

import type { ReactNode, ComponentType } from 'react';
import Link from 'next/link';

/**
 * Props for Link component
 */
export interface LinkComponentProps {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

/**
 * Next.js Link component type
 */
export type LinkComponent = ComponentType<LinkComponentProps>;

/**
 * Default Next.js Link wrapper
 */
export function NextLink({ href, className, children, onClick }: LinkComponentProps) {
  return (
    <Link href={href} className={className} onClick={onClick}>
      {children as any}
    </Link>
  );
}

// Re-export Link for convenience
export { Link };

// Re-export usePathname for active state detection
export { usePathname } from 'next/navigation';
