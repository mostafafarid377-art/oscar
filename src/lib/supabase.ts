/**
 * Placeholder for the future Supabase integration (Phase 1).
 *
 * Phase 0 intentionally ships with no backend: nothing here connects, and
 * the app runs entirely on local demo state. The module exists so the data
 * layer already has a single seam to swap in a real client.
 */
export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function readSupabaseConfig(): SupabaseConfig | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export const IS_BACKEND_CONNECTED = false;

export const BACKEND_PHASE_LABEL = 'Phase 0 — frontend prototype, no backend connected';
