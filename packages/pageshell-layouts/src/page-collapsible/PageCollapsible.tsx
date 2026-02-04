'use client';

/**
 * PageCollapsible & PageAccordion Components
 *
 * Expandable content sections with smooth animations.
 * PageAccordion manages multiple collapsible items.
 *
 * @example Basic collapsible
 * <PageCollapsible title="Detalhes avançados">
 *   <AdvancedSettings />
 * </PageCollapsible>
 *
 * @example With description and badge
 * <PageCollapsible
 *   title="Configurações"
 *   description="Ajuste as preferências do curso"
 *   icon={Settings}
 *   badge={{ label: "3 alterações", variant: "warning" }}
 *   defaultOpen
 * >
 *   <SettingsForm />
 * </PageCollapsible>
 *
 * @example Accordion (single open)
 * <PageAccordion type="single">
 *   <PageAccordion.Item value="section-1" title="Seção 1">
 *     <Content1 />
 *   </PageAccordion.Item>
 *   <PageAccordion.Item value="section-2" title="Seção 2">
 *     <Content2 />
 *   </PageAccordion.Item>
 * </PageAccordion>
 *
 * @example Accordion (multiple open)
 * <PageAccordion type="multiple" defaultValue={['section-1']}>
 *   <PageAccordion.Item value="section-1" title="FAQ 1">
 *     <Answer1 />
 *   </PageAccordion.Item>
 *   <PageAccordion.Item value="section-2" title="FAQ 2">
 *     <Answer2 />
 *   </PageAccordion.Item>
 * </PageAccordion>
 */

import * as React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '@pageshell/core';
import { StatusBadge, type StatusVariant } from '@pageshell/primitives';
import { usePageShellContext, iconColorClasses } from '@pageshell/theme';
import type { IconColor } from '../page-section/types';

// =============================================================================
// Types
// =============================================================================

/** Collapsible variant */
export type PageCollapsibleVariant = 'default' | 'card' | 'ghost';

/** Badge configuration */
export interface PageCollapsibleBadge {
  label: string;
  variant?: StatusVariant;
}

/**
 * PageCollapsible component props
 */
export interface PageCollapsibleProps {
  /** Section title */
  title: string;
  /** Section description */
  description?: string;
  /** Title icon */
  icon?: LucideIcon;
  /** Icon color variant (applies colored background when set) */
  iconColor?: IconColor;
  /** Badge */
  badge?: PageCollapsibleBadge;
  /** Content */
  children: React.ReactNode;

  // State
  /** Controlled open state */
  open?: boolean;
  /** Default open state */
  defaultOpen?: boolean;
  /** Open state change handler */
  onOpenChange?: (open: boolean) => void;

  // Styling
  /** Visual variant */
  variant?: PageCollapsibleVariant;
  /** Disable animations */
  animated?: boolean;

  // Accessibility
  /** Accessible label */
  ariaLabel?: string;
  /** Test ID */
  testId?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PageAccordion component props
 */
export interface PageAccordionProps {
  /** Accordion type */
  type?: 'single' | 'multiple';
  /** Default open items (for uncontrolled) */
  defaultValue?: string | string[];
  /** Open items (for controlled) */
  value?: string | string[];
  /** Open items change handler */
  onValueChange?: (value: string | string[]) => void;
  /** Allow collapsing all items (single mode only) */
  collapsible?: boolean;
  /** Children (PageAccordion.Item) */
  children: React.ReactNode;
  /** Visual variant */
  variant?: PageCollapsibleVariant;
  /** Additional CSS classes */
  className?: string;
  /** Test ID */
  testId?: string;
}

/**
 * PageAccordion.Item props
 */
export interface PageAccordionItemProps {
  /** Unique item value */
  value: string;
  /** Item title */
  title: string;
  /** Item description */
  description?: string;
  /** Title icon */
  icon?: LucideIcon;
  /** Icon color variant (applies colored background when set) */
  iconColor?: IconColor;
  /** Badge */
  badge?: PageCollapsibleBadge;
  /** Content */
  children: React.ReactNode;
  /** Disabled state */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

const variantStyles: Record<PageCollapsibleVariant, { container: string; trigger: string; content: string }> = {
  default: {
    container: 'border border-border rounded-lg',
    trigger: 'px-4 py-3 hover:bg-muted/50',
    content: 'px-4 pb-4',
  },
  card: {
    container: 'border border-border rounded-lg bg-card shadow-sm',
    trigger: 'px-4 py-3 hover:bg-muted/30',
    content: 'px-4 pb-4',
  },
  ghost: {
    container: '',
    trigger: 'px-2 py-2 -mx-2 rounded-md hover:bg-muted/50',
    content: 'pt-2',
  },
};

// =============================================================================
// Context for Accordion Variant
// =============================================================================

const AccordionVariantContext = React.createContext<PageCollapsibleVariant>('default');

// =============================================================================
// PageCollapsible Component
// =============================================================================

export const PageCollapsible = React.forwardRef<HTMLDivElement, PageCollapsibleProps>(
  function PageCollapsible(
    {
      title,
      description,
      icon: Icon,
      iconColor,
      badge,
      children,
      // State
      open,
      defaultOpen = false,
      onOpenChange,
      // Styling
      variant = 'default',
      animated = true,
      // Accessibility
      ariaLabel,
      testId,
      className,
    },
    ref
  ) {
    const { theme, config } = usePageShellContext();
    const styles = variantStyles[variant];
    const colorClass = iconColor ? (iconColorClasses[theme][iconColor] ?? iconColor) : undefined;

    return (
      <CollapsiblePrimitive.Root
        ref={ref}
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        className={cn(styles.container, className)}
        data-testid={testId}
      >
        <CollapsiblePrimitive.Trigger
          className={cn(
            'group flex w-full items-center justify-between gap-3 text-left transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            styles.trigger
          )}
          aria-label={ariaLabel ?? title}
        >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {Icon && (
            iconColor ? (
              <div className={cn(config.sectionIcon, colorClass)} aria-hidden="true">
                <Icon className="h-5 w-5" />
              </div>
            ) : (
              <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
            )
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn('font-medium text-foreground truncate', iconColor && `${config.heading} ${config.headingMd}`)}>{title}</span>
              {badge && (
                <StatusBadge variant={badge.variant ?? 'default'} className="flex-shrink-0">
                  {badge.label}
                </StatusBadge>
              )}
            </div>
            {description && (
              <p className="text-sm text-muted-foreground truncate">{description}</p>
            )}
          </div>
        </div>
        <ChevronDown
          className="h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </CollapsiblePrimitive.Trigger>
      <CollapsiblePrimitive.Content
        className={cn(
          animated && 'data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up',
          'overflow-hidden'
        )}
      >
        <div className={styles.content}>{children}</div>
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  );
  }
);

// =============================================================================
// PageAccordion Component
// =============================================================================

function PageAccordionRoot({
  type = 'single',
  defaultValue,
  value,
  onValueChange,
  collapsible = true,
  children,
  variant = 'default',
  className,
  testId,
}: PageAccordionProps) {
  // Handle the type-safe props for Radix
  const accordionProps = type === 'single'
    ? {
        type: 'single' as const,
        defaultValue: defaultValue as string | undefined,
        value: value as string | undefined,
        onValueChange: onValueChange as ((value: string) => void) | undefined,
        collapsible,
      }
    : {
        type: 'multiple' as const,
        defaultValue: defaultValue as string[] | undefined,
        value: value as string[] | undefined,
        onValueChange: onValueChange as ((value: string[]) => void) | undefined,
      };

  return (
    <AccordionVariantContext.Provider value={variant}>
      <AccordionPrimitive.Root
        {...accordionProps}
        className={cn('space-y-2', className)}
        data-testid={testId}
      >
        {children}
      </AccordionPrimitive.Root>
    </AccordionVariantContext.Provider>
  );
}

/**
 * PageAccordion.Item - Individual accordion item
 */
function PageAccordionItem({
  value,
  title,
  description,
  icon: Icon,
  iconColor,
  badge,
  children,
  disabled = false,
  className,
}: PageAccordionItemProps) {
  const variant = React.useContext(AccordionVariantContext);
  const { theme, config } = usePageShellContext();
  const styles = variantStyles[variant];
  const colorClass = iconColor ? (iconColorClasses[theme][iconColor] ?? iconColor) : undefined;

  return (
    <AccordionPrimitive.Item
      value={value}
      disabled={disabled}
      className={cn(styles.container, disabled && 'opacity-50', className)}
    >
      <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
          className={cn(
            'flex w-full items-center justify-between gap-3 text-left transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            '[&[data-state=open]>svg.chevron]:rotate-180',
            styles.trigger
          )}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {Icon && (
              iconColor ? (
                <div className={cn(config.sectionIcon, colorClass)} aria-hidden="true">
                  <Icon className="h-5 w-5" />
                </div>
              ) : (
                <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
              )
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn('font-medium text-foreground truncate', iconColor && `${config.heading} ${config.headingMd}`)}>{title}</span>
                {badge && (
                  <StatusBadge variant={badge.variant ?? 'default'} className="flex-shrink-0">
                    {badge.label}
                  </StatusBadge>
                )}
              </div>
              {description && (
                <p className="text-sm text-muted-foreground truncate">{description}</p>
              )}
            </div>
          </div>
          <ChevronDown
            className="chevron h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-200"
            aria-hidden="true"
          />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content
        className={cn(
          'overflow-hidden',
          'data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up'
        )}
      >
        <div className={styles.content}>{children}</div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}

// =============================================================================
// Compound Component Export
// =============================================================================

// Set displayName on individual components (PageCollapsible already has displayName via named forwardRef)
PageAccordionRoot.displayName = 'PageAccordion';
PageAccordionItem.displayName = 'PageAccordion.Item';

// Create compound component
export const PageAccordion = Object.assign(PageAccordionRoot, {
  Item: PageAccordionItem,
});
