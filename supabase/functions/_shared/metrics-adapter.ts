import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { MetricsPort } from './prompts/types.ts';

const PROMPT_VERSION = Deno.env.get('PROMPT_VERSION') || '1.0.0';

export { PROMPT_VERSION };

export function createSupabaseMetrics(supabaseUrl: string, serviceKey: string): MetricsPort {
  const supabase = createClient(supabaseUrl, serviceKey);
  return {
    async log(execution) {
      try {
        await supabase.from('prompt_executions').insert({
          prompt_id: execution.promptId,
          prompt_version: execution.promptVersion,
          model: execution.model,
          tokens_in: execution.tokensIn,
          tokens_out: execution.tokensOut,
          estimated_cost: execution.estimatedCost,
          latency_ms: execution.latencyMs,
          success: execution.success,
          error: execution.error ?? null,
        });
      } catch (e) {
        // Don't let metrics logging fail the actual request
        console.error('[metrics] Failed to log execution:', e);
      }
    },
  };
}
