/**
 * FormPanel Component
 *
 * A mid-level form section container for embedding forms in detail pages.
 * Provides consistent layout with optional title, description, and footer actions.
 *
 * Use this when you need:
 * - A form section embedded in a detail page (not a full FormPage/FormModal)
 * - Consistent spacing and styling for form fields
 * - Optional header with title/description
 * - Optional footer with action buttons
 *
 * @package @pageshell/features
 *
 * @example Basic usage
 * ```tsx
 * <FormPanel title="Profile Settings" description="Update your profile information">
 *   <SettingInput label="Name" value={name} onChange={setName} />
 *   <SettingInput label="Email" value={email} onChange={setEmail} />
 * </FormPanel>
 * ```
 *
 * @example With footer actions
 * ```tsx
 * <FormPanel
 *   title="Notifications"
 *   footer={
 *     <PageButton onClick={handleSave} loading={isSaving}>
 *       Save Changes
 *     </PageButton>
 *   }
 * >
 *   <SettingToggle label="Email notifications" checked={emailEnabled} />
 * </FormPanel>
 * ```
 *
 * @example Loading state
 * ```tsx
 * <FormPanel title="Settings" isLoading>
 *   {children}
 * </FormPanel>
 * ```
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { PageIcon, Skeleton } from '@pageshell/primitives';
import type { PageIconVariant } from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

export interface FormPanelProps {
  /** Panel title */
  title?: string;
  /** Panel description */
  description?: string;
  /** Icon to display next to title */
  icon?: PageIconVariant;
  /** Form fields and content */
  children: React.ReactNode;
  /** Footer content (typically action buttons) */
  footer?: React.ReactNode;
  /** Show loading skeleton */
  isLoading?: boolean;
  /** Number of skeleton fields to show when loading */
  skeletonFieldCount?: number;
  /** Disable all interactions */
  disabled?: boolean;
  /** Show border around panel */
  bordered?: boolean;
  /** Additional className */
  className?: string;
  /** Data test ID for testing */
  testId?: string;
}

// =============================================================================
// Skeleton Component
// =============================================================================

interface FormPanelSkeletonProps {
  fieldCount: number;
  hasTitle: boolean;
  hasFooter: boolean;
}

function FormPanelSkeleton({ fieldCount, hasTitle, hasFooter }: FormPanelSkeletonProps) {
  return (
    <div className="space-y-6" role="status" aria-busy="true" aria-label="Loading form...">
      {/* Title skeleton */}
      {hasTitle && (
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      )}

      {/* Field skeletons */}
      <div className="space-y-4">
        {Array.from({ length: fieldCount }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>

      {/* Footer skeleton */}
      {hasFooter && (
        <div className="flex justify-end pt-4 border-t border-border">
          <Skeleton className="h-10 w-32" />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function FormPanel({
  title,
  description,
  icon,
  children,
  footer,
  isLoading = false,
  skeletonFieldCount = 3,
  disabled = false,
  bordered = false,
  className,
  testId,
}: FormPanelProps) {
  const hasHeader = Boolean(title || description);

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          bordered && 'p-6 rounded-lg border border-border bg-card',
          className
        )}
        data-testid={testId}
      >
        <FormPanelSkeleton
          fieldCount={skeletonFieldCount}
          hasTitle={hasHeader}
          hasFooter={Boolean(footer)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        bordered && 'p-6 rounded-lg border border-border bg-card',
        disabled && 'opacity-60 pointer-events-none',
        className
      )}
      data-testid={testId}
      aria-disabled={disabled}
    >
      <div className="space-y-6">
        {/* Header */}
        {hasHeader && (
          <div className="space-y-1">
            {title && (
              <div className="flex items-center gap-2">
                {icon && (
                  <PageIcon
                    name={icon}
                    className="h-5 w-5 text-muted-foreground"
                  />
                )}
                <h3 className="text-lg font-semibold text-foreground">
                  {title}
                </h3>
              </div>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Form content */}
        <div className="space-y-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components for compound pattern
// =============================================================================

export interface FormPanelHeaderProps {
  title: string;
  description?: string;
  icon?: PageIconVariant;
  className?: string;
}

function FormPanelHeader({ title, description, icon, className }: FormPanelHeaderProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center gap-2">
        {icon && (
          <PageIcon name={icon} className="h-5 w-5 text-muted-foreground" />
        )}
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export interface FormPanelContentProps {
  children: React.ReactNode;
  className?: string;
}

function FormPanelContent({ children, className }: FormPanelContentProps) {
  return <div className={cn('space-y-4', className)}>{children}</div>;
}

export interface FormPanelFooterProps {
  children: React.ReactNode;
  className?: string;
}

function FormPanelFooter({ children, className }: FormPanelFooterProps) {
  return (
    <div className={cn('flex justify-end gap-3 pt-4 border-t border-border', className)}>
      {children}
    </div>
  );
}

// Attach sub-components
FormPanel.Header = FormPanelHeader;
FormPanel.Content = FormPanelContent;
FormPanel.Footer = FormPanelFooter;
