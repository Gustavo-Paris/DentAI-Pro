import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { env } from '@/lib/env';
import { TIMING } from '@/lib/constants';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: (url, options) => {
      const controller = new AbortController();
      const isFunctionCall = typeof url === 'string' && url.includes('/functions/v1/');
      const timeoutMs = isFunctionCall ? TIMING.FUNCTION_TIMEOUT : TIMING.API_TIMEOUT;
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
    },
  },
});