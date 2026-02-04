/**
 * @pageshell/features
 *
 * Compound feature components for PageShell (Layer 4)
 *
 * Components:
 * - PageStats, PageStatsCard, PageStatsBar
 * - PageLiveStats, PageLiveStatsBar
 * - PageSystemInfo
 * - Chat (declarative API)
 * - PageBenefitsGrid, PageFAQ
 * - PageEligibilityAlert
 * - PageLoadingState, PageLoadingSkeleton
 * - PageErrorState
 * - PageRecoveryCodesList, PageRecoveryCodesModal
 * - FormPanel (embedded form sections)
 * - AlertBanner (dismissible banners with actions)
 *
 * @packageDocumentation
 */

// =============================================================================
// Stats Components
// =============================================================================
export {
  PageStats,
  type PageStatsProps,
  type PageStatsVariant,
  type StatItem,
  type StatTrend,
  type TrendDirection,
  type StatsLabel,
  type StatsTimestamp,
  type StatsBarItemVariant,
  type LiveStatVariant,
  type GridStatVariant,
} from './PageStats';

export {
  PageStatsCard,
  type PageStatsCardProps,
  type PageStatsCardSize,
  type PageStatsCardVariant,
  type PageStatsCardPortalVariant,
  type PageStatsCardTrend,
  type PageStatsCardComparison,
  type PageBadge,
  type LinkComponentType as PageStatsCardLinkComponent,
} from './PageStatsCard';

// =============================================================================
// System Info
// =============================================================================
export {
  PageSystemInfo,
  type PageSystemInfoProps,
  type SystemInfoStatus,
} from './PageSystemInfo';

// =============================================================================
// Chat Components (New Declarative API)
// =============================================================================
export {
  Chat,
  type ChatProps,
  type ChatMessage,
  type ChatMessageRole,
  type ChatMessageStatus,
  type ChatAttachment,
  type ChatMessageReactions,
  type ChatReaction,
  type ChatAssistant,
  type ChatUser,
  type ChatFeatures,
  type ChatVariant,
} from './chat';

// =============================================================================
// Content Components
// =============================================================================
export {
  PageBenefitsGrid,
  type PageBenefitsGridProps,
  type Benefit,
  type BenefitIcon,
} from './PageBenefitsGrid';

export {
  PageFAQ,
  type PageFAQProps,
  type FAQSection,
  type FAQItem,
  type FAQCategory,
} from './PageFAQ';

export {
  PageEligibilityAlert,
  type PageEligibilityAlertProps,
  type EligibilityData,
  type EligibilityAlertType,
} from './PageEligibilityAlert';

// =============================================================================
// Loading & Error States
// =============================================================================
export {
  PageLoadingState,
  PageLoadingSkeleton,
} from './PageLoadingState';

export {
  PageErrorState,
  type LinkComponentType as PageErrorStateLinkComponent,
} from './PageErrorState';

// =============================================================================
// Recovery Codes
// =============================================================================
export {
  PageRecoveryCodesList,
  type PageRecoveryCodesListProps,
} from './PageRecoveryCodesList';

export {
  PageRecoveryCodesModal,
  type PageRecoveryCodesModalProps,
} from './PageRecoveryCodesModal';

// =============================================================================
// Layout Components
// =============================================================================
export {
  PageFooterActions,
  type PageFooterActionsProps,
} from './PageFooterActions';

// =============================================================================
// Form Components
// =============================================================================
export {
  FormPanel,
  type FormPanelProps,
  type FormPanelHeaderProps,
  type FormPanelContentProps,
  type FormPanelFooterProps,
} from './FormPanel';

// =============================================================================
// Alert Components
// =============================================================================
export {
  AlertBanner,
  type AlertBannerProps,
  type AlertBannerVariant,
  type AlertBannerAction,
} from './AlertBanner';

// =============================================================================
// Hooks
// =============================================================================
export {
  useDismissState,
  type UseDismissStateOptions,
  type UseDismissStateReturn,
} from './hooks/useDismissState';
