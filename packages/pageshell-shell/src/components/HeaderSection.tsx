'use client';

import type { ReactNode } from 'react';
import { PageHeader, PageBreadcrumbs } from '@pageshell/layouts';
import type { IconProp } from '@pageshell/primitives';
import type { PageBreadcrumb, PageHeaderMeta, PageHeaderSize, PageHeaderAlign, PageBadge } from '../types';
import { BackButton } from './BackButton';

export interface HeaderSectionProps {
  /** Header ID for accessibility */
  headerId: string;
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Label above title */
  label?: string;
  /** Badge next to title */
  badge?: PageBadge;
  /** Header action element */
  action?: ReactNode;
  /** Header icon */
  icon?: IconProp;
  /** Header meta information */
  meta?: PageHeaderMeta[];
  /** Header size variant */
  size?: PageHeaderSize;
  /** Header alignment */
  align?: PageHeaderAlign;
  /** Make header sticky on scroll */
  sticky?: boolean;
  /** Show header divider */
  divider?: boolean;
  /** Breadcrumb navigation items */
  breadcrumbs?: PageBreadcrumb[];
  /** Back navigation href */
  backHref?: string;
  /** Back button label */
  backLabel?: string;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * HeaderSection - Consolidated header area rendering.
 *
 * Combines back button, breadcrumbs, and PageHeader into a single component.
 *
 * @internal Used by PageShellCore variants
 */
export function HeaderSection({
  headerId,
  title,
  description,
  label,
  badge,
  action,
  icon,
  meta,
  size,
  align,
  sticky,
  divider,
  breadcrumbs,
  backHref,
  backLabel,
  className,
}: HeaderSectionProps) {
  return (
    <div className={className}>
      {backHref && <BackButton href={backHref} label={backLabel} />}
      {breadcrumbs && <PageBreadcrumbs items={breadcrumbs} />}
      <PageHeader
        id={headerId}
        title={title}
        description={description}
        label={label}
        badge={badge}
        action={action}
        icon={icon}
        meta={meta}
        size={size}
        align={align}
        sticky={sticky}
        divider={divider}
      />
    </div>
  );
}
