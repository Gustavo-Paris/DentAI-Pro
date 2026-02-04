/**
 * Domain Primitives
 *
 * General-purpose primitives for domain-specific displays.
 * These are simple, reusable components that work across domains.
 *
 * @module primitives
 */

export {
  PageKeyValueList,
  type PageKeyValueListProps,
  type KeyValueItem,
  type KeyValueTextVariant,
  type KeyValueGap,
  type KeyValueLayout,
} from './PageKeyValueList';

export {
  PageBulletList,
  type PageBulletListProps,
  type PageBulletListVariant,
  type PageBulletListSize,
  type PageBulletListGap,
} from './PageBulletList';

export {
  PageProgressCard,
  type PageProgressCardProps,
  type PageProgressVariant,
} from './PageProgressCard';

export {
  PageCommandList,
  type PageCommandListProps,
  type CommandItem,
  type PageCommandListVariant,
} from './PageCommandList';

export {
  PageInfoPanel,
  type PageInfoPanelProps,
  type InfoPanelItem,
  type InfoPanelTip,
  type InfoPanelItemVariant,
} from './PageInfoPanel';

export {
  PageLeaderboardRow,
  type PageLeaderboardRowProps,
  type LeaderboardUserData,
  type LeaderboardLinkProps,
  type LeaderboardLabels,
} from './PageLeaderboardRow';
