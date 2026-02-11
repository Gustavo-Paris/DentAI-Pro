import { supabase } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DataExport {
  export_metadata: {
    exported_at: string;
    user_id: string;
    user_email: string;
    format_version: string;
    lgpd_reference: string;
  };
  profile: unknown;
  evaluations: unknown[];
  patients: unknown[];
  drafts: unknown[];
  credit_usage: unknown[];
  subscription: unknown;
  inventory: unknown[];
  payment_history: unknown[];
  partial_errors?: string[];
}

export interface DeleteAccountResult {
  success: boolean;
  message: string;
  deleted: string[];
  errors?: string[];
}

// ---------------------------------------------------------------------------
// Edge function calls
// ---------------------------------------------------------------------------

/**
 * Exports all user data as JSON (LGPD Art. 18, V — Portabilidade).
 * The edge function returns the full payload; this helper triggers
 * a browser download of the JSON file.
 */
export async function exportData(): Promise<DataExport> {
  const { data, error } = await supabase.functions.invoke('data-export', {
    body: {},
  });

  if (error) throw error;
  return data as DataExport;
}

/**
 * Permanently deletes the user account and all associated data
 * (LGPD Art. 18, VI — Eliminação).
 *
 * @param confirmation Must be exactly "EXCLUIR MINHA CONTA"
 */
export async function deleteAccount(confirmation: string): Promise<DeleteAccountResult> {
  const { data, error } = await supabase.functions.invoke('delete-account', {
    body: { confirmation },
  });

  if (error) throw error;
  return data as DeleteAccountResult;
}
