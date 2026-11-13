
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function isValidSupabaseUrl(value: string): boolean {
  try {
    const parsed = new URL(value);

    const isLocal =
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1';

    const isSupabaseHost = parsed.hostname.endsWith('.supabase.co');

    return (
      (parsed.protocol === 'https:' ||
        (isLocal && parsed.protocol === 'http:')) &&
      (isSupabaseHost || isLocal) &&
      parsed.username === '' &&
      parsed.password === '' &&
      (parsed.pathname === '' || parsed.pathname === '/') &&
      parsed.search === '' &&
      parsed.hash === ''
    );
  } catch {
    return false;
  }
}

export function isServiceRoleKey(key: string): boolean {
  if (key.startsWith('sb_secret_')) return true;

  try {
    const payload = key.split('.')[1];
    if (!payload) return false;

    const base64 = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const json = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));

    return (
      (JSON.parse(json) as { role?: string }).role === 'service_role'
    );
  } catch {
    return false;
  }
}

export function isValidPublicKey(key: string): boolean {
  if (key.startsWith('sb_publishable_')) {
    return /^sb_publishable_[A-Za-z0-9_-]+$/.test(key);
  }

  if (key.startsWith('sb_secret_')) return false;

  try {
    const parts = key.split('.');
    if (parts.length !== 3 || parts.some((part) => !part)) return false;

    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '='));
    const claims = JSON.parse(json) as { role?: string };

    return claims.role === 'anon';
  } catch {
    return false;
  }
}

export function readSupabaseConfig(): SupabaseConfig | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!url || !anonKey) return null;

  if (!isValidSupabaseUrl(url)) {
    console.error(
      '[CarOS] Invalid VITE_SUPABASE_URL. Use your Supabase project URL, without /rest/v1/.',
    );
    return null;
  }

  if (isServiceRoleKey(anonKey)) {
    console.error(
      '[CarOS] A Supabase secret/service-role key was detected. Use a publishable or legacy anon key instead.',
    );
    return null;
  }

  if (!isValidPublicKey(anonKey)) {
    console.error(
      '[CarOS] Invalid VITE_SUPABASE_ANON_KEY format. Use a valid sb_publishable_ key or legacy anon JWT.',
    );
    return null;
  }

  return { url, anonKey };
}

export const supabaseConfig = readSupabaseConfig();

export const IS_BACKEND_CONNECTED = supabaseConfig !== null;

export const supabase: SupabaseClient<Database> | null = supabaseConfig
  ? createClient<Database>(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null;

export const BACKEND_STATUS = IS_BACKEND_CONNECTED
  ? 'Supabase connected'
  : 'Demo mode — Supabase credentials not configured';

export function requireSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    );
  }

  return supabase;
}
