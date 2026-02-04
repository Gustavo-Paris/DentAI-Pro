'use client';

/**
 * PageCreditCard - Credit package card with status and progress
 *
 * Displays a credit card with:
 * - Service info and duration
 * - Status badge (active, expiring, depleted, expired)
 * - Usage progress bar with shimmer animation
 * - Purchase date and book action
 *
 * @example Declarative (preferred)
 * ```tsx
 * <PageCreditCard
 *   serviceTitle="Sessão de Mentoria"
 *   durationMinutes={60}
 *   totalCredits={10}
 *   creditsRemaining={7}
 *   status="active"
 *   isExpiringSoon={false}
 *   expiresAt={new Date()}
 *   purchasedAt={new Date()}
 *   bookHref="/mentorship/123?serviceId=abc"
 * />
 * ```
 *
 * @example Imperative fallback (avoid if possible)
 * ```tsx
 * <PageCreditCard
 *   ...
 *   onBook={() => router.push('/book')}
 * />
 * ```
 */

import Link from 'next/link';
import { PageIcon } from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

export type CreditStatus = 'active' | 'depleted' | 'expired';

export interface PageCreditCardProps {
  /** Service title */
  serviceTitle: string;
  /** Session duration in minutes */
  durationMinutes: number;
  /** Total credits in package */
  totalCredits: number;
  /** Remaining credits */
  creditsRemaining: number;
  /** Credit status */
  status: CreditStatus;
  /** Whether credits are expiring soon */
  isExpiringSoon: boolean;
  /** Expiration date */
  expiresAt: Date;
  /** Purchase date */
  purchasedAt: Date;
  /** Declarative href for booking (preferred over onBook) */
  bookHref?: string;
  /** Callback when book button is clicked (use bookHref instead when possible) */
  onBook?: () => void;
  /** Animation delay index */
  animationDelay?: number;
  /** Date formatter function */
  formatDate?: (date: Date) => string;
}

// =============================================================================
// Helpers
// =============================================================================

function getDaysUntilExpiration(expiresAt: Date): number {
  const now = new Date();
  const expDate = new Date(expiresAt);
  const diffTime = expDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function defaultFormatDate(date: Date): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// =============================================================================
// Component
// =============================================================================

export function PageCreditCard({
  serviceTitle,
  durationMinutes,
  totalCredits,
  creditsRemaining,
  status,
  isExpiringSoon,
  expiresAt,
  purchasedAt,
  bookHref,
  onBook,
  animationDelay = 0,
  formatDate = defaultFormatDate,
}: PageCreditCardProps) {
  const usagePercent = Math.round(
    ((totalCredits - creditsRemaining) / totalCredits) * 100
  );
  const remainingPercent = 100 - usagePercent;
  const daysLeft = getDaysUntilExpiration(expiresAt);
  const isExpiring = isExpiringSoon && status === 'active';
  const isActive = status === 'active' && creditsRemaining > 0;

  const getStatusClass = () => {
    if (isExpiring) return 'portal-credit-item-expiring';
    if (status === 'depleted') return 'portal-credit-item-depleted';
    if (status === 'expired') return 'portal-credit-item-expired';
    return '';
  };

  const getBadgeClass = () => {
    if (status === 'active') {
      return isExpiring
        ? 'portal-credit-item-badge-warning'
        : 'portal-credit-item-badge-active';
    }
    if (status === 'expired') return 'portal-credit-item-badge-expired';
    return 'portal-credit-item-badge-depleted';
  };

  const getBadgeText = () => {
    if (status === 'active') {
      return isExpiring ? `${daysLeft} dias restantes` : 'Ativo';
    }
    if (status === 'expired') return 'Expirado';
    return 'Esgotado';
  };

  return (
    <div
      className={`portal-credit-item ${getStatusClass()}`}
      style={{ animationDelay: `${animationDelay * 50}ms` }}
    >
      {isExpiring && <div className="portal-credit-item-pulse" />}

      <div className="portal-credit-item-header">
        <div className="portal-credit-item-service">
          <div className="portal-credit-item-service-icon">
            <PageIcon name="package" className="w-4 h-4" />
          </div>
          <div>
            <span className="portal-credit-item-service-name">
              {serviceTitle}
            </span>
            <span className="portal-credit-item-service-duration">
              <PageIcon name="clock" className="w-3 h-3" />
              {durationMinutes} min/sessao
            </span>
          </div>
        </div>

        <span className={`portal-credit-item-badge ${getBadgeClass()}`}>
          {getBadgeText()}
        </span>
      </div>

      <div className="portal-credit-item-progress-section">
        <div className="portal-credit-item-progress-header">
          <span className="portal-credit-item-progress-used">
            {totalCredits - creditsRemaining} de {totalCredits} usados
          </span>
          <span className="portal-credit-item-progress-remaining">
            {creditsRemaining} restante{creditsRemaining !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="portal-progress">
          <div
            className={`portal-progress-bar ${isActive ? 'portal-progress-bar-shimmer' : ''}`}
            style={{ width: `${remainingPercent}%` }}
          />
        </div>
      </div>

      <div className="portal-credit-item-footer">
        <div className="portal-credit-item-date">
          <PageIcon name="calendar" className="w-3.5 h-3.5" />
          <span>Comprado em {formatDate(purchasedAt)}</span>
        </div>

        {isActive && (bookHref || onBook) && (
          bookHref ? (
            <Link href={bookHref} className="portal-credit-item-book-btn">
              <PageIcon name="zap" className="w-4 h-4" />
              Agendar
            </Link>
          ) : (
            <button className="portal-credit-item-book-btn" onClick={onBook}>
              <PageIcon name="zap" className="w-4 h-4" />
              Agendar
            </button>
          )
        )}
      </div>
    </div>
  );
}
