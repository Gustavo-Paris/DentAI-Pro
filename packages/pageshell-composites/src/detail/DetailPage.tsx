/**
 * DetailPage Composite
 *
 * Declarative detail/view page with sections or tabs.
 *
 * @module detail/DetailPage
 */

'use client';

import * as React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@pageshell/core';
import { Button, Tabs, TabsList, TabsTrigger, TabsContent, resolveIcon, Badge } from '@pageshell/primitives';
import type { DetailPageProps, DetailPageBadge, FooterActionConfig } from './types';
import {
  getErrorMessage,
  type DetailPageLabels,
  DEFAULT_DETAIL_PAGE_LABELS,
  resolveDetailPageLabels,
} from '../shared/types';
import { getContainerClasses } from '../shared/styles';
import { useDetailPageLogic } from './hooks';
import {
  DetailPageSkeleton,
  DetailPageFooter,
  DetailPageQuickActions,
} from './components';

// =============================================================================
// Detail Page Component
// =============================================================================

/**
 * Declarative detail page composite.
 *
 * @example
 * ```tsx
 * <DetailPage
 *   title="User Details"
 *   query={userQuery}
 *   sections={[
 *     { id: 'info', title: 'Information', children: <UserInfo /> },
 *     { id: 'activity', title: 'Activity', children: <ActivityLog /> },
 *   ]}
 *   headerActions={[
 *     { label: 'Edit', href: '/users/:id/edit' },
 *   ]}
 * />
 * ```
 */
export function DetailPage<TData = unknown>(props: DetailPageProps<TData>) {
  const {
    // Base
    theme = 'default',
    containerVariant = 'shell',
    title,
    description,
    label,
    badge,
    className,
    // Data
    query,
    // Navigation
    backHref,
    backLabel,
    breadcrumbs,
    // Layout
    sections,
    tabs,
    defaultTab,
    // Actions
    headerAction,
    headerActions,
    quickActions,
    footerActions,
    stickyFooter = false,
    // Slots
    skeleton,
    slots,
    children,
    // i18n
    labels,
  } = props;

  // Resolve labels with English defaults
  const resolvedLabels = resolveDetailPageLabels(labels);
  const finalBackLabel = backLabel ?? resolvedLabels.back;

  // ---------------------------------------------------------------------------
  // Detail Page Logic Hook
  // ---------------------------------------------------------------------------

  const detailLogic = useDetailPageLogic({
    data: query.data,
    title,
    description,
    badge,
    tabs,
    defaultTab,
    footerActions,
  });

  const {
    resolvedTitle,
    resolvedDescription,
    resolvedBadge,
    activeTab,
    setActiveTab,
    visibleFooterActions,
  } = detailLogic;

  // Container classes (defined early for loading state)
  const loadingContainerClasses = containerVariant === 'shell' ? '' : 'max-w-7xl mx-auto';

  // Loading state
  if (query.isLoading) {
    return (
      <div className={cn(loadingContainerClasses, className)} data-theme={theme} aria-busy="true" aria-live="polite">
        {skeleton || <DetailPageSkeleton />}
      </div>
    );
  }

  // Error state
  if (query.isError) {
    return (
      <div role="alert" className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium text-red-500">{resolvedLabels.errorLoadingData}</p>
        <p className="text-muted-foreground mt-1">{getErrorMessage(query.error)}</p>
        <Button className="mt-4" onClick={() => query.refetch?.()}>
          Retry
        </Button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render Header Action
  // ---------------------------------------------------------------------------

  // Type guard for HeaderActionConfig
  const isHeaderActionConfig = (
    action: React.ReactNode | import('../shared/types').HeaderActionConfig
  ): action is import('../shared/types').HeaderActionConfig => {
    return (
      action !== null &&
      typeof action === 'object' &&
      'label' in action &&
      typeof (action as import('../shared/types').HeaderActionConfig).label === 'string'
    );
  };

  const renderHeaderAction = (): React.ReactNode => {
    if (!headerAction) return null;

    // ReactNode (custom) - check if it's NOT a HeaderActionConfig
    if (!isHeaderActionConfig(headerAction)) {
      return headerAction;
    }

    // HeaderActionConfig
    const config = headerAction;
    const ResolvedIcon = config.icon ? resolveIcon(config.icon) : null;

    if (config.href) {
      return (
        <Button
          variant={config.variant ?? 'default'}
          asChild
        >
          <a href={config.href}>
            {ResolvedIcon && <ResolvedIcon className="h-4 w-4 mr-2" />}
            {config.label}
          </a>
        </Button>
      );
    }

    return (
      <Button
        variant={config.variant ?? 'default'}
        onClick={config.onClick}
        leftIcon={ResolvedIcon ? <ResolvedIcon className="h-4 w-4" /> : undefined}
      >
        {config.label}
      </Button>
    );
  };

  // ---------------------------------------------------------------------------
  // Render Page Header
  // ---------------------------------------------------------------------------

  const renderPageHeader = (): React.ReactNode => (
    <div className={headerSectionClasses}>
      {/* Back navigation - separate row */}
      {backHref && (
        <div className="mb-4">
          <Button variant="ghost" size="sm" className="-ml-2" asChild>
            <a href={backHref}>← {finalBackLabel}</a>
          </Button>
        </div>
      )}

      {/* Main header - matches ListPage pattern */}
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {label && <p className="text-sm text-muted-foreground mb-1">{label}</p>}
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{resolvedTitle}</h1>
            {resolvedBadge && (
              <Badge variant={resolvedBadge.variant ?? 'default'}>
                {resolvedBadge.text}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {renderHeaderAction()}
          {headerActions && headerActions.length > 0 && headerActions.map((action, i) => {
            const ActionIcon = resolveIcon(action.icon);
            if (action.href) {
              return (
                <Button
                  key={i}
                  asChild
                  variant={action.variant || 'outline'}
                >
                  <Link to={action.href}>
                    {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                    {action.label}
                  </Link>
                </Button>
              );
            }
            return (
              <Button
                key={i}
                variant={action.variant || 'outline'}
                onClick={action.onClick}
                leftIcon={ActionIcon ? <ActionIcon className="h-4 w-4" /> : undefined}
              >
                {action.label}
              </Button>
            );
          })}
          {slots?.header && (
            typeof slots.header === 'function' && data
              ? (slots.header as (data: TData) => React.ReactNode)(data)
              : (slots.header as React.ReactNode)
          )}
        </div>
      </header>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render Page Content Section
  // ---------------------------------------------------------------------------

  const renderPageContent = (): React.ReactNode => (
    <div className={contentSectionClasses}>
      {/* Before Quick Actions slot */}
      {slots?.beforeQuickActions}

      {/* Quick Actions */}
      {quickActions && quickActions.length > 0 && (
        <DetailPageQuickActions actions={quickActions} />
      )}

      {/* After Quick Actions slot */}
      {slots?.afterQuickActions}

      {/* Content */}
      {data && renderContent(data)}

      {/* Before Footer slot */}
      {slots?.beforeFooter}

      {/* Footer Actions */}
      {data && visibleFooterActions.length > 0 && (
        <DetailPageFooter
          actions={visibleFooterActions}
          sticky={stickyFooter}
        />
      )}

      {/* Footer slot */}
      {slots?.footer}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render Content
  // ---------------------------------------------------------------------------

  const renderContent = (data: TData): React.ReactNode => {
    // Custom children render
    if (children) {
      return children(data);
    }

    // Tabs layout
    if (tabs && tabs.length > 0) {
      return (
        <>
          {slots?.beforeContent}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              {tabs.map((tab) => {
                const TabIcon = resolveIcon(tab.icon);
                return (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    {TabIcon && <TabIcon className="h-4 w-4 mr-2" />}
                    {tab.label}
                    {tab.badge !== undefined && (
                      <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                        {tab.badge}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id}>
                {/* Support both `content` (function or ReactNode) and `children` */}
                {typeof tab.content === 'function'
                  ? tab.content(data)
                  : tab.content ?? tab.children}
              </TabsContent>
            ))}
          </Tabs>
          {slots?.afterContent}
        </>
      );
    }

    // Sections layout
    if (sections && sections.length > 0) {
      return (
        <>
          {slots?.beforeContent}
          <div className="space-y-6">
            {sections.map((section) => {
              const SectionIcon = resolveIcon(section.icon);
              const headingId = `section-heading-${section.id}`;
              return (
                <section key={section.id} className="rounded-lg border p-6" aria-labelledby={headingId}>
                  <div className="flex items-center gap-2 mb-4">
                    {SectionIcon && <SectionIcon className="h-5 w-5" aria-hidden="true" />}
                    <h2 id={headingId} className="text-lg font-semibold">{section.title}</h2>
                  </div>
                  {section.description && (
                    <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
                  )}
                  {section.children}
                </section>
              );
            })}
          </div>
          {slots?.afterContent}
        </>
      );
    }

    return null;
  };

  // ---------------------------------------------------------------------------
  // Derived Values
  // ---------------------------------------------------------------------------

  const data = query.data;

  // Back navigation uses backHref and backLabel directly

  // Container classes based on variant (card vs shell)
  const variantClasses = getContainerClasses(containerVariant);
  const containerClasses = variantClasses.container; // shell = '' (full width), card = 'max-w-7xl mx-auto'
  const cardContainerClasses = variantClasses.card;
  const headerSectionClasses = variantClasses.header;
  const contentSectionClasses = variantClasses.content;

  return (
    <div className={cn(containerClasses, className)} data-theme={theme}>
      {/* Breadcrumbs (outside card) */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label={resolvedLabels.breadcrumb} className="flex items-center text-sm text-muted-foreground mb-4">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="mx-2">/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-foreground">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main content - conditionally wrapped based on variant */}
      {containerVariant === 'card' ? (
        <div className={cardContainerClasses}>
          {renderPageHeader()}
          {renderPageContent()}
        </div>
      ) : (
        <>
          {renderPageHeader()}
          {renderPageContent()}
        </>
      )}
    </div>
  );
}

DetailPage.displayName = 'DetailPage';
