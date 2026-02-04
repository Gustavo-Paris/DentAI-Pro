/**
 * ItemCard Module
 *
 * A compound component for displaying list items as cards.
 *
 * @module item-card
 *
 * @example Basic usage
 * ```tsx
 * import { ItemCard } from '@pageshell/composites';
 *
 * <ItemCard
 *   title="My Brainstorm"
 *   description="Target audience: Developers"
 *   icon="lightbulb"
 *   status={{ label: "Draft", variant: "info" }}
 *   stats={[
 *     { icon: "target", label: "5 objectives" },
 *     { icon: "layers", label: "3 modules" },
 *   ]}
 *   timestamp={new Date()}
 *   primaryAction={{ label: "Continue", href: "/brainstorms/123" }}
 * />
 * ```
 */

export { ItemCard } from './ItemCard';
export type {
  ItemCardProps,
  ItemCardHeaderProps,
  ItemCardTitleProps,
  ItemCardDescriptionProps,
  ItemCardStatsProps,
  ItemCardFooterProps,
  ItemCardActionsProps,
  ItemCardAction,
  ItemCardMenuAction,
  ItemCardStat,
  ItemCardStatus,
} from './types';
export { formatRelativeTime } from './utils';
