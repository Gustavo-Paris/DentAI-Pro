import type { BaseEntity, PrescriptionStatus } from '../shared';

export interface PrescriptionInfo extends BaseEntity {
  prescriptionNumber: string;
  patientName: string;
  patientId: string;
  professionalName: string;
  professionalRegistration: string;
  medications: MedicationItem[];
  status: PrescriptionStatus;
  issuedDate: string;
  validUntil: string;
  notes?: string;
  signedAt?: string;
  signedBy?: string;
}

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity?: number;
}

export interface MedicationSearchResult {
  id: string;
  name: string;
  activeIngredient: string;
  presentation: string;
  manufacturer?: string;
}

export interface DigitalSignatureData {
  signedBy: string;
  registration: string;
  signedAt: string;
  verified: boolean;
  signatureHash?: string;
}
