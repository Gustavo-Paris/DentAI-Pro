import type { TreatmentType } from '@/lib/treatment-config';

// Re-export TreatmentType for convenience (canonical source: @/lib/treatment-config)
export type { TreatmentType } from '@/lib/treatment-config';

// Interface for pending teeth from database - allows Json type for tooth_bounds
export interface PendingTooth {
  id: string;
  session_id: string;
  user_id: string;
  tooth: string;
  priority: string | null;
  treatment_indication: string | null;
  indication_reason: string | null;
  cavity_class: string | null;
  restoration_size: string | null;
  substrate: string | null;
  substrate_condition: string | null;
  enamel_condition: string | null;
  depth: string | null;
  tooth_region: string | null;
  tooth_bounds: unknown; // Json type from database
  created_at?: string;
}

export interface SubmitTeethPayload {
  selectedTeeth: string[];
  toothTreatments: Record<string, TreatmentType>;
  pendingTeeth: PendingTooth[];
}
