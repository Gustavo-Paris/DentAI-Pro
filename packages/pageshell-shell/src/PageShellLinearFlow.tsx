'use client';

/**
 * PageShellLinearFlow Component
 *
 * Simplified wizard shell for page-to-page navigation flows.
 * Ideal for multi-page workflows where each page is a separate route.
 *
 * @example Basic with declarative skeleton
 * <PageShell.LinearFlow
 *   theme="creator"
 *   title="Configure Resources"
 *   description="Select resources for your course"
 *   icon="settings"
 *   background="gradient-mesh"
 *   backHref="/creator-portal/proposal/123"
 *   backLabel="Back to Proposal"
 *   query={api.proposal.getById.useQuery({ proposalId })}
 *   skeletonVariant="linearFlow"
 *   skeletonConfig={{ stepCount: 5 }}
 * >
 *   {(proposal) => <ResourcesContent proposal={proposal} />}
 * </PageShell.LinearFlow>
 *
 * @example With custom skeleton (legacy)
 * <PageShell.LinearFlow
 *   theme="creator"
 *   title="Configure Resources"
 *   query={query}
 *   skeleton={<WizardSkeleton steps={5} />}
 * >
 *   {(data) => <Content data={data} />}
 * </PageShell.LinearFlow>
 */

import { useNavigate } from 'react-router-dom';
import { cn } from '@pageshell/core/utils';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Button, Card, QueryError, resolveIcon } from '@pageshell/primitives';
import { PageShellProvider, usePageShellContext } from './context';
import { WizardBackground } from '@pageshell/interactions';
import { getSkeletonPreset } from './skeletons';
import type { PageShellLinearFlowProps } from './types';

/**
 * PageShellLinearFlowInner - Internal component
 *
 * Separated from outer component to avoid duplicate getThemeConfig calls.
 * Uses context to get config instead of calling getThemeConfig directly.
 */
function PageShellLinearFlowInner<TData>({
  title,
  description,
  icon,
  headerClassName,
  backHref,
  backLabel = 'Back',
  nextHref,
  nextLabel = 'Continuar',
  onNext,
  nextDisabled,
  nextLoading,
  background = 'none',
  spacing = 'default',
  query,
  skeleton,
  skeletonVariant,
  skeletonConfig,
  children,
  className,
}: Omit<PageShellLinearFlowProps<TData>, 'theme'>) {
  const navigate = useNavigate();
  // Use context to get config (instead of calling getThemeConfig directly)
  const { theme, config } = usePageShellContext();
  const Icon = resolveIcon(icon);
  const spacingClass =
    spacing === 'compact' ? 'space-y-4' : spacing === 'relaxed' ? 'space-y-8' : 'space-y-6';

  // Theme-specific class prefixes
  const themePrefix = theme === 'student' ? 'dash' : theme;

  const handleBack = () => {
    if (backHref) {
      navigate(backHref);
    }
  };

  const handleNext = async () => {
    if (onNext) {
      await onNext();
    }
    if (nextHref && !onNext) {
      navigate(nextHref);
    }
  };

  // Resolve skeleton: prefer custom skeleton, fallback to preset
  const resolvedSkeleton = skeleton ?? getSkeletonPreset(skeletonVariant, skeletonConfig);

  // Loading state
  if (query?.isLoading) {
    return (
      <div className={cn(`${themePrefix}-theme`, 'min-h-screen', className)}>
        <WizardBackground variant={background} theme={theme} />
        <div className={cn(config.container, 'py-8 relative z-10')}>
          {resolvedSkeleton}
        </div>
      </div>
    );
  }

  // Error state
  if (query?.error) {
    return (
      <div className={cn(`${themePrefix}-theme`, 'min-h-screen', className)}>
        <WizardBackground variant={background} theme={theme} />
        <div className={cn(config.container, 'py-8 relative z-10', spacingClass)}>
          {/* Header with back */}
          <div className={cn(`${themePrefix}-page-header`, config.animate, headerClassName)}>
            <div className="flex items-center gap-4">
              {backHref && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    style={{ color: config.textMuted }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {backLabel}
                  </Button>
                  <div className="h-6 w-px bg-muted-foreground/25" />
                </>
              )}
              <div className="flex items-center gap-3">
                {Icon && (
                  <div className="p-2 rounded-lg bg-primary/10">
                    <span style={{ color: config.primary }}>
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                )}
                <div>
                  <h1 className={cn(config.heading, config.headingMd)}>{title}</h1>
                  {description && (
                    <p className="text-sm" style={{ color: config.textMuted }}>
                      {description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Card className={cn('p-5', config.animate)}>
            <QueryError error={query.error} retry={query.refetch} />
          </Card>
        </div>
      </div>
    );
  }

  // Determine content to render
  const renderContent = () => {
    if (typeof children === 'function') {
      if (query?.data) {
        return children(query.data);
      }
      return null;
    }
    return children;
  };

  return (
    <div className={cn(`${themePrefix}-theme`, 'min-h-screen', className)}>
      <WizardBackground variant={background} theme={theme} />

        <div className={cn(config.container, 'py-8 relative z-10', spacingClass)}>
          {/* Header with back navigation */}
          <div className={cn(`${themePrefix}-page-header`, config.animate, headerClassName)}>
            <div className="flex items-center gap-4">
              {backHref && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    style={{ color: config.textMuted }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {backLabel}
                  </Button>
                  <div className="h-6 w-px bg-muted-foreground/25" />
                </>
              )}
              <div className="flex items-center gap-3">
                {Icon && (
                  <div className="p-2 rounded-lg bg-primary/10">
                    <span style={{ color: config.primary }}>
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                )}
                <div>
                  <h1 className={cn(config.heading, config.headingMd)}>{title}</h1>
                  {description && (
                    <p className="text-sm" style={{ color: config.textMuted }}>
                      {description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className={cn(config.animate, config.animateDelay(1))}>
            {renderContent()}
          </div>

          {/* Footer Navigation */}
          {(backHref || nextHref || onNext) && (
            <div
              className={cn(
                'flex justify-between',
                config.animate,
                config.animateDelay(2)
              )}
            >
              {backHref ? (
                <Button variant="outline" onClick={handleBack} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  {backLabel}
                </Button>
              ) : (
                <div />
              )}

              {(nextHref || onNext) && (
                <Button
                  variant="primary"
                  onClick={handleNext}
                  disabled={nextDisabled || nextLoading}
                  className="gap-2"
                >
                  {nextLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Aguarde...
                    </>
                  ) : (
                    <>
                      {nextLabel}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
    </div>
  );
}

/**
 * PageShellLinearFlow - Outer wrapper component
 *
 * Wraps PageShellLinearFlowInner with PageShellProvider to provide theme context.
 * This pattern eliminates duplicate getThemeConfig calls.
 */
export function PageShellLinearFlow<TData>(props: PageShellLinearFlowProps<TData>) {
  const { theme, ...innerProps } = props;

  return (
    <PageShellProvider theme={theme}>
      <PageShellLinearFlowInner {...innerProps} />
    </PageShellProvider>
  );
}
