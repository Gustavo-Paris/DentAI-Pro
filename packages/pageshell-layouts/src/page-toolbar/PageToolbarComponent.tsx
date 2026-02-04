/**
 * PageToolbar Component
 *
 * A versatile toolbar for page actions, search, filters, and view mode switching.
 * Supports bulk selection mode with contextual actions.
 *
 * @package @pageshell/layouts
 *
 * @example Basic toolbar with search and actions
 * <PageToolbar
 *   search={{
 *     value: searchQuery,
 *     onChange: setSearchQuery,
 *     placeholder: "Buscar cursos...",
 *   }}
 *   actions={[
 *     { icon: Plus, label: "Novo", onClick: () => {}, variant: "primary" },
 *   ]}
 * />
 *
 * @example With view mode toggle
 * <PageToolbar
 *   viewMode={viewMode}
 *   onViewModeChange={setViewMode}
 *   viewModeOptions={['grid', 'list', 'table']}
 * />
 *
 * @example Bulk selection mode
 * <PageToolbar
 *   bulkMode={selectedItems.size > 0}
 *   selectedCount={selectedItems.size}
 *   bulkActions={[
 *     { icon: Trash, label: "Excluir", onAction: handleDelete, variant: "destructive" },
 *   ]}
 *   onBulkCancel={() => clearSelection()}
 * />
 */

'use client';

import { cn } from '@pageshell/core';
import { usePageShellContextOptional } from '@pageshell/theme';
import { variantStyles } from './constants';
import { SearchInput, ViewModeToggle, BulkModeBar, ActionButtons } from './components';
import type { PageToolbarProps, PageToolbarSectionProps } from './types';

// =============================================================================
// PageToolbar Component
// =============================================================================

function PageToolbarComponent({
  // Content slots
  leftContent,
  centerContent,
  rightContent,
  // Actions
  actions,
  // Search
  search,
  // View mode
  viewMode,
  onViewModeChange,
  viewModeOptions = ['grid', 'list'],
  // Bulk mode
  bulkMode = false,
  selectedCount = 0,
  bulkActions = [],
  onBulkCancel,
  onSelectAll,
  totalItems,
  // Layout
  sticky = false,
  variant = 'default',
  blur = true,
  // Accessibility
  ariaLabel = 'Barra de ferramentas',
  testId,
  className,
}: PageToolbarProps) {
  // Optional context - PageToolbar can work outside PageShell with fallbacks
  const context = usePageShellContextOptional();
  const animateClass = context?.config.animate ?? '';

  // Determine if we have view mode toggle
  const hasViewMode = viewMode !== undefined && onViewModeChange !== undefined;

  // Base container classes
  const containerClasses = cn(
    'w-full border-b border-border',
    'bg-background/95',
    blur && 'backdrop-blur-sm',
    sticky && 'sticky top-0 z-20',
    variantStyles[variant],
    animateClass,
    className
  );

  // Bulk mode takes over the entire toolbar
  if (bulkMode && selectedCount > 0) {
    return (
      <div
        role="toolbar"
        aria-label={ariaLabel}
        data-testid={testId}
        className={cn(
          containerClasses,
          'bg-primary/5 border-primary/20'
        )}
      >
        <BulkModeBar
          selectedCount={selectedCount}
          bulkActions={bulkActions}
          onBulkCancel={onBulkCancel}
          onSelectAll={onSelectAll}
          totalItems={totalItems}
          variant={variant}
        />
      </div>
    );
  }

  return (
    <div
      role="toolbar"
      aria-label={ariaLabel}
      data-testid={testId}
      className={containerClasses}
    >
      <div className="flex items-center gap-4">
        {/* Left section */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {leftContent}

          {/* Search input */}
          {search && <SearchInput {...search} variant={variant} />}
        </div>

        {/* Center section */}
        {centerContent && (
          <div className="hidden md:flex items-center justify-center">
            {centerContent}
          </div>
        )}

        {/* Right section */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {rightContent}

          {/* View mode toggle */}
          {hasViewMode && (
            <ViewModeToggle
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
              viewModeOptions={viewModeOptions}
              variant={variant}
            />
          )}

          {/* Actions */}
          {actions && actions.length > 0 && (
            <ActionButtons actions={actions} variant={variant} />
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Compound Components
// =============================================================================

/**
 * PageToolbar.Section - Flexible section wrapper
 */
function PageToolbarSection({
  children,
  align = 'left',
  className,
}: PageToolbarSectionProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2',
        align === 'center' && 'justify-center',
        align === 'right' && 'justify-end ml-auto',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * PageToolbar.Divider - Visual separator
 */
function PageToolbarDivider({ className }: { className?: string }) {
  return (
    <div
      className={cn('h-6 w-px bg-border', className)}
      role="separator"
      aria-orientation="vertical"
    />
  );
}

// Set display names
PageToolbarComponent.displayName = 'PageToolbar';
PageToolbarSection.displayName = 'PageToolbar.Section';
PageToolbarDivider.displayName = 'PageToolbar.Divider';

// =============================================================================
// Compound Component Export
// =============================================================================

export const PageToolbar = Object.assign(PageToolbarComponent, {
  Section: PageToolbarSection,
  Divider: PageToolbarDivider,
});
