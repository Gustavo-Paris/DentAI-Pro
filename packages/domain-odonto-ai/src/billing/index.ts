/**
 * Billing subdomain
 *
 * Invoices, payment tracking, insurance claims, and financial reports.
 *
 * @example
 * ```tsx
 * import { PageInvoiceCard } from '@parisgroup-ai/domain-odonto-ai/billing';
 * ```
 */

// Types
export type {
  PaymentMethod,
  InvoiceInfo,
  InvoiceItem,
  PaymentRecord,
  InsuranceClaimInfo,
  BillingStatsData,
  InsuranceVerificationData,
} from './types';

// Components
export { PageInvoiceCard } from './PageInvoiceCard';
export type { PageInvoiceCardProps } from './PageInvoiceCard';

export { PagePaymentTracker } from './PagePaymentTracker';
export type { PagePaymentTrackerProps } from './PagePaymentTracker';

export { PageInsuranceClaim } from './PageInsuranceClaim';
export type { PageInsuranceClaimProps } from './PageInsuranceClaim';

export { PageBillingStats } from './PageBillingStats';
export type { PageBillingStatsProps } from './PageBillingStats';

export { PagePaymentMethodBadge } from './PagePaymentMethodBadge';
export type { PagePaymentMethodBadgeProps } from './PagePaymentMethodBadge';

export { PageInsuranceVerification } from './PageInsuranceVerification';
export type { PageInsuranceVerificationProps } from './PageInsuranceVerification';
