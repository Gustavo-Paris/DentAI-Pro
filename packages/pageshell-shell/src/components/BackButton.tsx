'use client';

import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@pageshell/core/utils';

export interface BackButtonProps {
  /** Navigation href */
  href: string;
  /** Button label */
  label?: string;
}

/**
 * BackButton - Navigation link with chevron icon.
 *
 * @internal Used by HeaderSection
 */
export function BackButton({ href, label = 'Back' }: BackButtonProps) {
  return (
    <Link
      to={href}
      className={cn(
        'inline-flex items-center gap-1.5 text-sm text-muted-foreground',
        'hover:text-foreground transition-colors group'
      )}
    >
      <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
      {label}
    </Link>
  );
}
