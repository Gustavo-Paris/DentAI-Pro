import type { BaseEntity, PatientStatus, ToothNumber, ToothCondition } from '../shared';

export interface PatientInfo extends BaseEntity {
  name: string;
  email?: string;
  phone?: string;
  birthDate: string;
  photoUrl?: string;
  status: PatientStatus;
  lastVisit?: string;
  nextAppointment?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
}

export interface MedicalRecord {
  id: string;
  date: string;
  type: 'condition' | 'allergy' | 'medication' | 'surgery';
  description: string;
  severity?: 'low' | 'medium' | 'high';
  active: boolean;
}

export interface DentalChartTooth {
  number: ToothNumber;
  condition: ToothCondition;
  notes?: string;
  lastTreated?: string;
}

export interface PatientAlert {
  id: string;
  type: 'allergy' | 'medical-condition' | 'overdue-treatment' | 'payment-due' | 'general';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description?: string;
}
