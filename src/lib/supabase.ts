/**
 * Re-export barrel for the Supabase seam.
 *
 * Phase 0 shipped a placeholder here. Phase 1 replaces it with a real client
 * while keeping this import path stable for the rest of the app.
 */
export {
  supabase,
  supabaseConfig,
  IS_BACKEND_CONNECTED,
  BACKEND_STATUS,
  readSupabaseConfig,
  requireSupabase,
  isServiceRoleKey,
  type SupabaseConfig,
} from './supabase/client';

export const BACKEND_PHASE_LABEL = 'Phase 1 — Supabase authentication and vehicle garage';
