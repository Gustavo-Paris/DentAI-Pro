'use client';

/**
 * PageBenefitsGrid - Benefits grid for empty states
 *
 * Displays a grid of benefits with icons and descriptions.
 * Useful for upsell sections or empty state enhancement.
 *
 * @example Basic usage with default benefits
 * ```tsx
 * <PageBenefitsGrid title="Por que comprar pacotes?" />
 * ```
 *
 * @example Custom benefits
 * ```tsx
 * <PageBenefitsGrid
 *   title="Vantagens"
 *   benefits={[
 *     { icon: 'savings', title: 'Economia', description: 'Até 20% off' },
 *     { icon: 'flexibility', title: 'Flexível', description: 'Agende quando quiser' },
 *   ]}
 * />
 * ```
 */

import { type ReactNode } from 'react';
import { CreditCard, Zap, Timer } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export type BenefitIcon = 'savings' | 'flexibility' | 'validity' | 'custom';

export interface Benefit {
  /** Icon type or custom ReactNode */
  icon: BenefitIcon | ReactNode;
  /** Benefit title */
  title: string;
  /** Benefit description */
  description: string;
}

export interface PageBenefitsGridProps {
  /** Section title */
  title?: string;
  /** Array of benefits to display */
  benefits?: Benefit[];
  /** Animation delay index */
  animationDelay?: number;
}

// =============================================================================
// Helpers
// =============================================================================

const defaultBenefits: Benefit[] = [
  {
    icon: 'savings',
    title: 'Economia',
    description: 'Ate 20% de desconto em pacotes',
  },
  {
    icon: 'flexibility',
    title: 'Flexibilidade',
    description: 'Agende quando quiser',
  },
  {
    icon: 'validity',
    title: 'Validade',
    description: '6 meses para usar',
  },
];

function getIconComponent(icon: BenefitIcon | ReactNode): ReactNode {
  if (typeof icon !== 'string') return icon;

  switch (icon) {
    case 'savings':
      return <CreditCard className="w-5 h-5" />;
    case 'flexibility':
      return <Zap className="w-5 h-5" />;
    case 'validity':
      return <Timer className="w-5 h-5" />;
    default:
      return <CreditCard className="w-5 h-5" />;
  }
}

// =============================================================================
// Component
// =============================================================================

export function PageBenefitsGrid({
  title = 'Por que comprar pacotes?',
  benefits = defaultBenefits,
  animationDelay = 2,
}: PageBenefitsGridProps) {
  return (
    <div
      className={`portal-credits-benefits portal-animate-in portal-animate-in-delay-${animationDelay}`}
    >
      <h3 className="portal-credits-benefits-title">{title}</h3>
      <div className="portal-credits-benefits-grid">
        {benefits.map((benefit, index) => (
          <div key={index} className="portal-credits-benefit">
            <div className="portal-credits-benefit-icon">
              {getIconComponent(benefit.icon)}
            </div>
            <div>
              <span className="portal-credits-benefit-title">{benefit.title}</span>
              <span className="portal-credits-benefit-desc">{benefit.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
