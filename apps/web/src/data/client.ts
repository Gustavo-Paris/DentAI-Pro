/**
 * Data client — single point of access to the Supabase SDK.
 *
 * Every data module (evaluations.ts, patients.ts, …) imports `supabase`
 * from here rather than from the integrations folder. If we ever swap
 * backends, this is the only import that needs to change.
 */

export { supabase } from '@/integrations/supabase/client';
export type { Database } from '@/integrations/supabase/types';
