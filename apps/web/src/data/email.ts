import { supabase } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EmailTemplate =
  | 'welcome'
  | 'credit-warning'
  | 'weekly-digest'
  | 'account-deleted';

export interface SendEmailResult {
  success: boolean;
  template: EmailTemplate;
}

// ---------------------------------------------------------------------------
// Edge function call
// ---------------------------------------------------------------------------

/**
 * Sends a transactional email via the `send-email` edge function.
 *
 * The edge function resolves user email/name from the auth token,
 * so no PII needs to be passed from the frontend.
 *
 * @param template  Template identifier
 * @param data      Optional template-specific data (e.g. remaining credits)
 */
export async function sendEmail(
  template: EmailTemplate,
  data?: Record<string, unknown>,
): Promise<SendEmailResult> {
  const { data: result, error } = await supabase.functions.invoke('send-email', {
    body: { template, data },
  });

  if (error) throw error;
  return result as SendEmailResult;
}
