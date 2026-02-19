import type { BaseEntity, TreatmentStatus, ToothNumber, ToothCondition, ToothSurface, MoneyAmount } from '../shared';

export interface TreatmentPlanInfo extends BaseEntity {
  patientId: string;
  patientName: string;
  title: string;
  status: TreatmentStatus;
  procedures: ProcedureInfo[];
  totalCost: MoneyAmount;
  insuranceCoverage?: MoneyAmount;
  startDate?: string;
  estimatedEndDate?: string;
}

export interface ProcedureInfo extends BaseEntity {
  name: string;
  code: string;
  tooth?: ToothNumber;
  surfaces?: ToothSurface[];
  status: TreatmentStatus;
  cost: MoneyAmount;
  notes?: string;
  performedBy?: string;
  performedDate?: string;
}

export interface ClinicalNoteData {
  id: string;
  date: string;
  author: string;
  content: string;
  procedureId?: string;
  toothNumbers?: ToothNumber[];
}

export interface OdontogramTooth {
  number: ToothNumber;
  condition: ToothCondition;
  surfaces?: Record<ToothSurface, ToothCondition>;
  notes?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  required: boolean;
}

export interface CostEstimateItem {
  procedure: string;
  cost: MoneyAmount;
  insuranceCoverage?: MoneyAmount;
  patientResponsibility: MoneyAmount;
}
