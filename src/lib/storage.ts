/**
 * Small typed wrapper around localStorage.
 * Everything stored here is non-sensitive demo data for the prototype.
 * This is NOT secure cloud persistence.
 */
export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or disabled — the prototype keeps working in memory.
  }
}

export function removeStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

export const STORAGE_KEYS = {
  vehicles: 'caros.demo.vehicles',
  records: 'caros.demo.records',
  documents: 'caros.demo.documents',
  notifications: 'caros.demo.notifications',
  profile: 'caros.demo.profile',
  settings: 'caros.demo.settings',
  chats: 'caros.demo.chats',
  session: 'caros.demo.session',
  primaryVehicle: 'caros.demo.primaryVehicle',
} as const;
