import { supabase } from './client';
import { withQuery } from './utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EmailTemplate =
  | 'welcome'
  | 'credit-warning'
  | 'weekly-digest'
  | 'account-deleted'
  | 'payment-received'
  | 'payment-failed';

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
  const result = await withQuery(() =>
    supabase.functions.invoke('send-email', {
      body: { template, data },
    }),
  );
  return result as SendEmailResult;
}
