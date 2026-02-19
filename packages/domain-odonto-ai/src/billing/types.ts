import type { BaseEntity, PaymentStatus, ClaimStatus, MoneyAmount } from '../shared';

export type PaymentMethod = 'cash' | 'credit-card' | 'debit-card' | 'pix' | 'bank-transfer' | 'insurance';

export interface InvoiceInfo extends BaseEntity {
  number: string;
  patientName: string;
  patientId: string;
  items: InvoiceItem[];
  total: MoneyAmount;
  status: PaymentStatus;
  dueDate: string;
  paidDate?: string;
  paymentMethod?: PaymentMethod;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: MoneyAmount;
  total: MoneyAmount;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: MoneyAmount;
  method: PaymentMethod;
  reference?: string;
}

export interface InsuranceClaimInfo extends BaseEntity {
  claimNumber: string;
  patientName: string;
  insuranceProvider: string;
  procedures: string[];
  claimedAmount: MoneyAmount;
  approvedAmount?: MoneyAmount;
  status: ClaimStatus;
  submittedDate: string;
  resolvedDate?: string;
}

export interface BillingStatsData {
  totalRevenue: MoneyAmount;
  pendingPayments: MoneyAmount;
  overduePayments: MoneyAmount;
  insuranceClaims: number;
  collectionRate: number;
}

export interface InsuranceVerificationData {
  provider: string;
  policyNumber: string;
  holderName: string;
  verified: boolean;
  verifiedDate?: string;
  coverageDetails?: string;
  eligibilityStatus: 'eligible' | 'ineligible' | 'pending' | 'expired';
}
