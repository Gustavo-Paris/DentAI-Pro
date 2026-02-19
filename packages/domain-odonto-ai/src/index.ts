/**
 * @parisgroup-ai/domain-odonto-ai
 *
 * Odonto AI domain components for PageShell.
 *
 * Provides specialized components for dental clinic management:
 * - patients: Patient cards, profiles, medical history, dental charts
 * - appointments: Scheduling, calendar views, reminders
 * - treatments: Treatment plans, procedures, odontograms
 * - billing: Invoices, payments, insurance claims
 * - dashboard: Clinic overview, daily agenda, KPIs
 * - settings: Clinic configuration, professional profiles
 * - inventory: Dental supplies, stock alerts, purchase orders
 * - imaging: X-rays, panoramic images, intraoral photos
 * - prescriptions: Prescription generation, medication database
 *
 * @example Subpath import (recommended for tree-shaking)
 * ```tsx
 * import { PagePatientCard } from '@parisgroup-ai/domain-odonto-ai/patients';
 * import { PageAppointmentCard } from '@parisgroup-ai/domain-odonto-ai/appointments';
 * ```
 *
 * @packageDocumentation
 */

// =============================================================================
// Shared Types
// =============================================================================

export * from './shared';

// =============================================================================
// Patients
// =============================================================================

export * from './patients';

// =============================================================================
// Appointments
// =============================================================================

export * from './appointments';

// =============================================================================
// Treatments
// =============================================================================

export * from './treatments';

// =============================================================================
// Billing
// =============================================================================

export * from './billing';

// =============================================================================
// Dashboard
// =============================================================================

export * from './dashboard';

// =============================================================================
// Settings
// =============================================================================

export * from './settings';

// =============================================================================
// Inventory
// =============================================================================

export * from './inventory';

// =============================================================================
// Imaging
// =============================================================================

export * from './imaging';

// =============================================================================
// Prescriptions
// =============================================================================

export * from './prescriptions';
