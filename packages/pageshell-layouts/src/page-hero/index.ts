/**
 * PageHero Module
 *
 * Unified hero component with 4 variants.
 * ADR-0033: Domain Primitive Consolidation
 */

export { PageHero } from './PageHero';
export type {
  PageHeroProps,
  PageHeroBaseProps,
  PageHeroProgressVariantProps,
  PageHeroBalanceVariantProps,
  PageHeroWelcomeVariantProps,
  PageHeroTiersVariantProps,
  PageHeroInlineStat,
  PageHeroAction,
  HeroStatVariant,
  TierCounts,
  IconProp,
} from './types';
export {
  isProgressVariant,
  isBalanceVariant,
  isWelcomeVariant,
  isTiersVariant,
} from './types';
