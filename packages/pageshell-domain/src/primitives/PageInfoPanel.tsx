'use client';

/**
 * PageInfoPanel - Informational panel with items and optional tip
 *
 * Used for explanatory sections like tier explanations, feature guides, etc.
 * Shows a header with icon, optional subtitle, grid of info items, and optional tip.
 *
 * @example Basic usage
 * ```tsx
 * <PageInfoPanel
 *   title="Como funciona"
 *   icon="info"
 *   items={[
 *     { id: 'step1', emoji: '1️⃣', title: 'Passo 1', description: 'Faça X' },
 *     { id: 'step2', emoji: '2️⃣', title: 'Passo 2', description: 'Faça Y' },
 *   ]}
 * />
 * ```
 *
 * @example With tier variants and tip
 * ```tsx
 * <PageInfoPanel
 *   title="Entendendo os Tiers"
 *   subtitle="Como o sistema funciona"
 *   icon="info"
 *   items={[
 *     { id: 'bronze', emoji: '🥉', title: 'Bronze', description: 'Complete 1 curso', variant: 'bronze' },
 *     { id: 'silver', emoji: '🥈', title: 'Silver', description: 'Complete 3 cursos', variant: 'silver' },
 *     { id: 'gold', emoji: '🥇', title: 'Gold', description: 'Complete 5 cursos', variant: 'gold' },
 *   ]}
 *   tip={{ icon: 'sparkles', content: <><strong>Dica:</strong> Badges aparecem no seu portfolio!</> }}
 * />
 * ```
 */

import type { ReactNode } from 'react';
import { cn } from '@pageshell/core';
import { resolveIcon, type IconProp } from '@pageshell/primitives';
import { usePageShellContextOptional, getThemeConfig, type PageShellTheme } from '@pageshell/theme';

// =============================================================================
// Types
// =============================================================================

/**
 * Info panel item variant
 */
export type InfoPanelItemVariant = 'bronze' | 'silver' | 'gold' | 'default';

/**
 * Info panel item configuration
 */
export interface InfoPanelItem {
  /** Unique identifier */
  id: string;
  /** Emoji to display */
  emoji?: string;
  /** Icon to display (alternative to emoji) */
  icon?: IconProp;
  /** Item title */
  title: string;
  /** Item description */
  description: string;
  /** Visual variant */
  variant?: InfoPanelItemVariant;
}

/**
 * Tip configuration
 */
export interface InfoPanelTip {
  /** Tip icon */
  icon?: IconProp;
  /** Tip content */
  content: ReactNode;
}

/**
 * PageInfoPanel component props
 */
export interface PageInfoPanelProps {
  /** Panel title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Header icon */
  icon?: IconProp;
  /** Info items to display */
  items: InfoPanelItem[];
  /** Optional tip at the bottom */
  tip?: InfoPanelTip;
  /** Animation delay index (default: 4) */
  animationDelay?: number;
  /** Theme override */
  theme?: PageShellTheme;
}

// =============================================================================
// Component
// =============================================================================

export function PageInfoPanel({
  title,
  subtitle,
  icon = 'info',
  items,
  tip,
  animationDelay = 4,
  theme,
}: PageInfoPanelProps) {
  // Get context config or use default
  const context = usePageShellContextOptional();
  const config = context?.config ?? getThemeConfig(theme ?? 'student');

  const delayClass = animationDelay > 0 ? config.animateDelay(animationDelay) : '';

  const HeaderIcon = icon ? resolveIcon(icon) : null;
  const TipIcon = tip?.icon ? resolveIcon(tip.icon) : null;

  return (
    <div className={cn('portal-badges-info-section', config.animate, delayClass)}>
      {/* Header */}
      <div className="portal-badges-info-header">
        {HeaderIcon && <HeaderIcon className="w-5 h-5 text-info" />}
        <h2 className="portal-heading portal-heading-sm">{title}</h2>
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="portal-badges-info-subtitle">{subtitle}</p>
      )}

      {/* Items Grid */}
      <div className="portal-badges-info-tiers">
        {items.map((item) => {
          const ItemIcon = item.icon ? resolveIcon(item.icon) : null;
          const variantClass = item.variant
            ? `portal-badges-info-tier-${item.variant}`
            : '';

          return (
            <div
              key={item.id}
              className={cn('portal-badges-info-tier', variantClass)}
            >
              <div className="portal-badges-info-tier-header">
                {item.emoji && (
                  <span className="portal-badges-info-tier-emoji">{item.emoji}</span>
                )}
                {ItemIcon && !item.emoji && (
                  <ItemIcon className="w-5 h-5" />
                )}
                <span className="portal-badges-info-tier-name">{item.title}</span>
              </div>
              <p className="portal-badges-info-tier-desc">{item.description}</p>
            </div>
          );
        })}
      </div>

      {/* Tip */}
      {tip && (
        <div className="portal-badges-info-tip">
          {TipIcon && <TipIcon className="w-4 h-4 text-accent" />}
          <p>{tip.content}</p>
        </div>
      )}
    </div>
  );
}
