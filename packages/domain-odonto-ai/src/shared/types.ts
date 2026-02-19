/**
 * Shared dental domain types
 *
 * Common types used across all odonto subdomains.
 */

// =============================================================================
// Tooth & Dental Types
// =============================================================================

/** FDI tooth number (11-48) */
export type ToothNumber = number;

/** Tooth numbering system */
export type ToothNumberingSystem = 'fdi' | 'universal' | 'palmer';

/** Dental quadrant */
export type DentalQuadrant = 'upper-right' | 'upper-left' | 'lower-left' | 'lower-right';

/** Tooth surface for charting */
export type ToothSurface = 'mesial' | 'distal' | 'buccal' | 'lingual' | 'occlusal' | 'incisal';

/** Tooth condition status */
export type ToothCondition =
  | 'healthy'
  | 'caries'
  | 'filled'
  | 'crown'
  | 'missing'
  | 'implant'
  | 'root-canal'
  | 'bridge'
  | 'veneer'
  | 'fracture'
  | 'extraction-indicated';

// =============================================================================
// Status Enums
// =============================================================================

/** Patient lifecycle status */
export type PatientStatus = 'active' | 'inactive' | 'archived';

/** Appointment lifecycle status */
export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'no-show';

/** Treatment plan status */
export type TreatmentStatus = 'planned' | 'in-progress' | 'completed' | 'cancelled';

/** Payment status */
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'refunded';

/** Insurance claim status */
export type ClaimStatus = 'draft' | 'submitted' | 'approved' | 'denied' | 'appealed';

/** Stock level for inventory */
export type StockLevel = 'adequate' | 'low' | 'critical' | 'out-of-stock';

/** Prescription lifecycle */
export type PrescriptionStatus = 'draft' | 'signed' | 'dispensed' | 'expired';

/** Dental image modality */
export type DentalImageType =
  | 'periapical'
  | 'panoramic'
  | 'bitewing'
  | 'cephalometric'
  | 'intraoral-photo'
  | 'cbct';

// =============================================================================
// Common Types
// =============================================================================

/** Professional role in the clinic */
export type ProfessionalRole = 'dentist' | 'hygienist' | 'assistant' | 'receptionist' | 'admin';

/** Monetary amount with currency */
export interface MoneyAmount {
  value: number;
  currency: string;
}

/** Base entity with audit fields */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}
