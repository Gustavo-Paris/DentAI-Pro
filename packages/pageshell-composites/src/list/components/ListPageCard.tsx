/**
 * ListPageCard Component
 *
 * Auto-generated card renderer based on FieldConfig.
 * Maps fields to card slots (title, description, badge, meta, footer, collapsible, media, content).
 *
 * @module list/components/ListPageCard
 * @see ADR-0058 - ListPageCard Feature Evolution
 * @see ADR-0059 - Native Card Enhancements (media slot, progress, dynamic footer action)
 */

'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn, interpolateHref } from '@pageshell/core';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Avatar,
  resolveIcon,
  Button,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@pageshell/primitives';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import type {
  FieldConfig,
  CardLayoutConfig,
  CardSlot,
  FooterActionConfig,
  FooterActionProp,
} from '../../shared/types';
import { ListPageCardMedia } from './ListPageCardMedia';
import type { CardActionsConfig, CardActionConfirm } from '../types';
import {
  getNestedValue,
  resolveEllipsisClass,
  formatFieldValue,
  groupFieldsBySlot,
  CardActionsMenu,
  renderCardFieldValue,
} from './card';

// =============================================================================
// Types
// =============================================================================

export interface ListPageCardProps<TRow = Record<string, unknown>> {
  /** Row data */
  item: TRow;
  /** Field configuration */
  fields: FieldConfig<TRow>[];
  /** Card layout configuration (ADR-0058: now generic for footerAction) */
  layout?: CardLayoutConfig<TRow>;
  /** Card actions */
  actions?: CardActionsConfig<TRow>;
  /** Click href */
  href?: string | ((item: TRow) => string);
  /** Card index (for animations) */
  index?: number;
  /** Open confirmation dialog */
  onConfirm?: (config: CardActionConfirm<TRow>, action: () => Promise<void>, item: TRow) => void;
  /** Refetch after mutation */
  refetch?: () => void;
}

// =============================================================================
// Sub-Components (ADR-0058)
// =============================================================================

/**
 * Collapsible section for card content
 * @see ADR-0058
 */
interface CollapsibleSectionProps {
  defaultOpen?: boolean;
  openLabel: string;
  closeLabel: string;
  OpenIcon: React.ComponentType<{ className?: string }>;
  CloseIcon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

function CollapsibleSection({
  defaultOpen = false,
  openLabel,
  closeLabel,
  OpenIcon,
  CloseIcon,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {isOpen ? (
          <>
            <CloseIcon className="h-4 w-4" />
            {closeLabel}
          </>
        ) : (
          <>
            <OpenIcon className="h-4 w-4" />
            {openLabel}
          </>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Footer action button
 * @see ADR-0058 - Initial feature
 * @see ADR-0059 - Added href support
 */
interface FooterActionButtonProps<TRow> {
  config: FooterActionConfig<TRow>;
  item: TRow;
}

function FooterActionButton<TRow>({ config, item }: FooterActionButtonProps<TRow>) {
  const router = useRouter();
  const ActionIcon = config.icon ? resolveIcon(config.icon) : null;
  const isDisabled = config.disabledWhen?.(item) ?? false;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // ADR-0059: Support href navigation
    if (config.href) {
      const url = typeof config.href === 'function'
        ? config.href(item)
        : interpolateHref(config.href, item as Record<string, unknown>);
      router.push(url);
      return;
    }

    // Original onClick behavior
    config.onClick?.(item);
  };

  return (
    <Button
      variant={config.variant ?? 'outline'}
      size={config.size ?? 'default'}
      className={cn(
        'h-10 whitespace-nowrap',
        // Full-width on mobile, auto on desktop
        'w-full sm:w-auto',
        config.className
      )}
      onClick={handleClick}
      disabled={isDisabled}
    >
      {ActionIcon && <ActionIcon className="h-4 w-4 mr-2 shrink-0" />}
      {config.label}
    </Button>
  );
}

// =============================================================================
// Component
// =============================================================================

export function ListPageCard<TRow = Record<string, unknown>>({
  item,
  fields,
  layout = {},
  actions,
  href,
  index = 0,
  onConfirm,
  refetch,
}: ListPageCardProps<TRow>) {
  const router = useRouter();
  const {
    variant = 'standard',
    showActions = true,
    clickable = true,
    hoverable = true,
    className,
    badgePosition = 'top-right',
  } = layout;

  // Group fields by slot
  const fieldsBySlot = groupFieldsBySlot(fields);

  // Resolve href
  const resolvedHref = href
    ? typeof href === 'function'
      ? href(item)
      : interpolateHref(href, item as Record<string, unknown>)
    : undefined;

  // Handle card click
  const handleClick = () => {
    if (clickable && resolvedHref) {
      router.push(resolvedHref);
    }
  };

  // Render field value using extracted CardFieldRenderer
  const renderFieldValue = (field: FieldConfig<TRow>, slot: CardSlot): React.ReactNode => {
    return renderCardFieldValue(item, field, slot);
  };

  // Render meta field (with icon)
  // Uses renderFieldValue to support tags overflow, badges, skeletons
  const renderMetaField = (field: FieldConfig<TRow>) => {
    const icon = field.cardConfig?.icon;
    const Icon = icon ? resolveIcon(icon) : null;

    // Use renderFieldValue for proper handling of tags, badges, etc.
    const content = renderFieldValue(field, 'meta');

    // For tags with tagsOverflow - use block layout to constrain width
    if (field.valueType === 'tags' && field.cardConfig?.tagsOverflow) {
      return (
        <div key={field.key} className="w-full overflow-hidden">
          <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
            {Icon && <Icon className="h-4 w-4 mt-0.5 shrink-0" />}
            <div className="flex-1 min-w-0">
              {content}
            </div>
          </div>
        </div>
      );
    }

    // For text content - responsive handling for long text
    const shouldTruncate = field.cardConfig?.truncate;

    return (
      <div key={field.key} className="w-full overflow-hidden">
        <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
          {Icon && <Icon className="h-4 w-4 mt-0.5 shrink-0" />}
          <span className={cn(
            'flex-1 min-w-0',
            shouldTruncate ? 'truncate' : 'break-words'
          )}>
            {content}
          </span>
        </div>
      </div>
    );
  };

  // Get title field
  const titleFields = fieldsBySlot.get('title') ?? [];
  const titleField = titleFields[0];
  const titleValue = titleField ? getNestedValue(item, titleField.key) : undefined;

  // Get subtitle field
  const subtitleFields = fieldsBySlot.get('subtitle') ?? [];
  const subtitleField = subtitleFields[0];
  const subtitleValue = subtitleField ? getNestedValue(item, subtitleField.key) : undefined;

  // Get description field
  const descriptionFields = fieldsBySlot.get('description') ?? [];
  const descriptionField = descriptionFields[0];
  const descriptionValue = descriptionField ? getNestedValue(item, descriptionField.key) : undefined;

  // Get badge field
  const badgeFields = fieldsBySlot.get('badge') ?? [];

  // Get meta fields
  const metaFields = fieldsBySlot.get('meta') ?? [];

  // Get footer fields
  const footerFields = fieldsBySlot.get('footer') ?? [];

  // Get avatar field
  const avatarFields = fieldsBySlot.get('avatar') ?? [];
  const avatarField = avatarFields[0];
  const avatarValue = avatarField ? getNestedValue(item, avatarField.key) : undefined;

  // ADR-0058: Get collapsible fields
  const collapsibleFields = fieldsBySlot.get('collapsible') ?? [];

  // ADR-0059: Get media fields
  const mediaFields = fieldsBySlot.get('media') ?? [];
  const mediaField = mediaFields[0];
  const mediaValue = mediaField ? getNestedValue(item, mediaField.key) : undefined;
  const mediaConfig = mediaField?.cardConfig?.media;

  // ADR-0059: Get content fields (for progress bars, etc.)
  const contentFields = fieldsBySlot.get('content') ?? [];

  // ADR-0059: Resolve footer action (static config or function)
  const resolvedFooterAction = React.useMemo(() => {
    if (!layout.footerAction) return null;
    if (typeof layout.footerAction === 'function') {
      const result = layout.footerAction(item);
      return result ?? null;
    }
    return layout.footerAction;
  }, [layout.footerAction, item]);

  // ADR-0059: Check if badge should overlay on media
  const shouldOverlayBadge = mediaField && mediaConfig?.badgeOverlay && mediaValue;

  // Check if we have actions
  const hasActions = actions && Object.keys(actions).length > 0 && showActions;

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-200 flex flex-col',
        hoverable && 'hover:shadow-md hover:border-primary/20',
        clickable && resolvedHref && 'cursor-pointer',
        className
      )}
      onClick={handleClick}
    >
      {/* ADR-0059: Media slot with optional badge overlay */}
      {mediaField && (
        <ListPageCardMedia
          src={mediaValue as string | null | undefined}
          alt={titleValue ? String(titleValue) : ''}
          config={mediaConfig}
          badgeContent={
            shouldOverlayBadge && badgeFields.length > 0
              ? badgeFields.map((field) => (
                  <React.Fragment key={field.key}>
                    {renderFieldValue(field, 'badge')}
                  </React.Fragment>
                ))
              : undefined
          }
        />
      )}

      {/* Badge (top-right by default) - skip if overlaid on media */}
      {badgeFields.length > 0 && badgePosition === 'top-right' && !shouldOverlayBadge && (
        <div className={cn(
          'absolute top-3 z-10',
          // Offset badge left when actions menu is present to avoid overlap
          hasActions ? 'right-12' : 'right-3'
        )}>
          {badgeFields.map((field) => (
            <React.Fragment key={field.key}>
              {renderFieldValue(field, 'badge')}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Actions Menu */}
      {hasActions && (
        <CardActionsMenu
          item={item}
          actions={actions!}
          onConfirm={onConfirm}
          refetch={refetch}
        />
      )}

      <CardHeader className={cn(
        'pb-2',
        // Responsive padding for badge/actions
        hasActions && badgeFields.length > 0 && badgePosition === 'top-right' && 'pr-24', // badge + actions
        hasActions && (badgeFields.length === 0 || badgePosition !== 'top-right') && 'pr-10', // actions only
        !hasActions && badgeFields.length > 0 && badgePosition === 'top-right' && 'pr-16' // badge only
      )}>
        <div className="flex items-start gap-3">
          {/* Avatar */}
          {avatarField && avatarValue ? (
            <Avatar className="h-10 w-10 flex-shrink-0">
              <img src={String(avatarValue)} alt="" />
            </Avatar>
          ) : null}

          <div className="flex-1 min-w-0">
            {/* Badge inline - skip if overlaid on media */}
            {badgeFields.length > 0 && badgePosition === 'inline' && !shouldOverlayBadge && (
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {badgeFields.map((field) => (
                  <React.Fragment key={field.key}>
                    {renderFieldValue(field, 'badge')}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Title - default 2 lines ellipsis */}
            {titleValue ? (
              <h3 className={cn(
                'font-semibold text-foreground leading-tight group-hover:text-primary transition-colors',
                titleField ? resolveEllipsisClass(titleField) : 'line-clamp-2'
              )}>
                {titleField?.render
                  ? (titleField.render(item, titleValue) as React.ReactNode)
                  : String(titleValue)}
              </h3>
            ) : null}

            {/* Subtitle - default 2 lines ellipsis */}
            {subtitleValue ? (
              <p className={cn(
                'text-sm text-muted-foreground mt-0.5',
                subtitleField ? resolveEllipsisClass(subtitleField) : 'line-clamp-2'
              )}>
                {subtitleField?.render
                  ? (subtitleField.render(item, subtitleValue) as React.ReactNode)
                  : String(subtitleValue)}
              </p>
            ) : null}
          </div>
        </div>
      </CardHeader>

      {/* Description, Meta, and Content */}
      {(descriptionValue || metaFields.length > 0 || contentFields.length > 0) && (
        <CardContent className="pt-0 pb-3 flex-1 overflow-hidden">
          {/* Description - default 2 lines ellipsis */}
          {descriptionValue ? (
            <p className={cn(
              'text-sm text-muted-foreground',
              descriptionField ? resolveEllipsisClass(descriptionField) : 'line-clamp-2'
            )}>
              {descriptionField?.render
                ? (descriptionField.render(item, descriptionValue) as React.ReactNode)
                : String(descriptionValue)}
            </p>
          ) : null}

          {/* Meta fields - each item constrained to parent width */}
          {metaFields.length > 0 && (
            <div className="space-y-2 mt-2">
              {metaFields.map((field) => renderMetaField(field))}
            </div>
          )}

          {/* ADR-0059: Content fields (progress bars, etc.) with showWhen support */}
          {contentFields.length > 0 && (
            <div className="space-y-2 mt-3">
              {contentFields.map((field) => {
                // Check showWhen condition
                if (field.cardConfig?.showWhen && !field.cardConfig.showWhen(item)) {
                  return null;
                }
                return (
                  <div key={field.key}>
                    {renderFieldValue(field, 'content')}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}

      {/* ADR-0058: Collapsible content section */}
      {collapsibleFields.length > 0 && (
        <div className="px-4 pb-3">
          {collapsibleFields.map((field) => {
            const value = getNestedValue(item, field.key);
            if (!value) return null;

            const config = field.cardConfig?.collapsible;
            const openIcon = config?.openIcon;
            const closeIcon = config?.closeIcon;
            const OpenIcon = (openIcon ? resolveIcon(openIcon) : null) ?? ChevronDown;
            const CloseIcon = (closeIcon ? resolveIcon(closeIcon) : null) ?? ChevronUp;

            return (
              <CollapsibleSection
                key={field.key}
                defaultOpen={config?.defaultOpen}
                openLabel={config?.openLabel ?? 'Ver mais'}
                closeLabel={config?.closeLabel ?? 'Ver menos'}
                OpenIcon={OpenIcon}
                CloseIcon={CloseIcon}
              >
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
                  {field.render ? field.render(item, value) : String(value)}
                </div>
              </CollapsibleSection>
            );
          })}
        </div>
      )}

      {/* Footer - responsive with flex-wrap for mobile */}
      {(footerFields.length > 0 || resolvedFooterAction) && (
        <CardFooter className="pt-3 pb-3 mt-auto text-sm text-muted-foreground border-t border-border/50 overflow-hidden">
          <div className={cn(
            'flex w-full gap-3 min-w-0',
            // Stack on mobile when action button exists, inline on desktop
            resolvedFooterAction
              ? 'flex-col sm:flex-row sm:items-center sm:justify-between'
              : 'items-center justify-between'
          )}>
            {/* Footer fields */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {footerFields.map((field) => {
                const value = getNestedValue(item, field.key);
                const icon = field.cardConfig?.icon;
                const Icon = icon ? resolveIcon(icon) : (field.valueType === 'relativeTime' ? Clock : null);

                return (
                  <span key={field.key} className="flex items-center gap-1.5">
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {formatFieldValue(value, field)}
                  </span>
                );
              })}
            </div>

            {/* ADR-0059: Footer action button - supports function form */}
            {resolvedFooterAction && (
              resolvedFooterAction.showWhen?.(item) !== false && (
                <div className="min-w-0 sm:flex-shrink-0 w-full sm:w-auto">
                  <FooterActionButton
                    config={resolvedFooterAction}
                    item={item}
                  />
                </div>
              )
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

ListPageCard.displayName = 'ListPageCard';
