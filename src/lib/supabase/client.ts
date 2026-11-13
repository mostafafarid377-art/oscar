import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/**
 * Read the public Supabase credentials from the Vite environment.
 *
 * `VITE_SUPABASE_ANON_KEY` must be the public anon/publishable key. It is
 * embedded in the client bundle by design — RLS, not key secrecy, is what
 * protects the data. A service-role key must never appear here.
 */
export function readSupabaseConfig(): SupabaseConfig | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!url || !anonKey) return null;
  // Guard against the most dangerous copy-paste mistake in a frontend repo.
  if (isServiceRoleKey(anonKey)) {
    // eslint-disable-next-line no-console
    console.error(
      '[CarOS] VITE_SUPABASE_ANON_KEY looks like a service-role key. ' +
        'Refusing to start the Supabase client. Use the anon/publishable key.',
    );
    return null;
  }
  return { url, anonKey };
}

/**
 * A Supabase JWT payload carries its role in the `role` claim. The anon key's
 * payload reads `"role":"anon"`; a service key reads `"role":"service_role"`.
 * We only need to decode the payload, never verify it.
 */
export function isServiceRoleKey(key: string): boolean {
  try {
    const payload = key.split('.')[1];
    if (!payload) return false;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return (JSON.parse(json) as { role?: string }).role === 'service_role';
  } catch {
    return false;
  }
}

export const supabaseConfig = readSupabaseConfig();

/** True when real credentials are present, i.e. the app can talk to Supabase. */
export const IS_BACKEND_CONNECTED = supabaseConfig !== null;

/**
 * The client is `null` when credentials are missing, which lets the whole app
 * fall back to demo mode instead of crashing at import time.
 */
export const supabase: SupabaseClient<Database> | null = supabaseConfig
  ? createClient<Database>(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // required for email confirmation + recovery links
        flowType: 'pkce',
      },
    })
  : null;

export const BACKEND_STATUS = IS_BACKEND_CONNECTED
  ? 'Supabase connected'
  : 'Demo mode — Supabase credentials not configured';

/** Narrowing helper so callers do not repeat the null check. */
export function requireSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    );
  }
  return supabase;
}
