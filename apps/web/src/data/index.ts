/**
 * Data client barrel export.
 *
 * Usage:
 *   import { evaluations, patients, profiles } from '@/data';
 *   const rows = await evaluations.list({ userId, page: 0 });
 */

export * as evaluations from './evaluations';
export * as patients from './patients';
export * as profiles from './profiles';
export * as inventory from './inventory';
export * as subscriptions from './subscriptions';
export * as drafts from './drafts';
export * as payments from './payments';

// Re-export client for edge cases where direct access is needed
export { supabase } from './client';
export type { Database } from './client';
