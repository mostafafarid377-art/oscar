/**
 * Demo / production separation rules.
 *
 * Extracted from the store so they can be tested without React. The invariant
 * these enforce: a vehicle that came from Supabase must never be shown demo
 * maintenance records, documents, or notifications that were invented for the
 * sample Elantra/Corolla/Sportage.
 */

interface HasVehicleId {
  vehicleId?: string;
}

/**
 * In live mode, keep only rows whose vehicle is a real (Supabase) vehicle.
 * In demo mode, everything is demo data and passes through untouched.
 */
export function visibleForSource<T extends HasVehicleId>(
  rows: T[],
  source: 'live' | 'demo',
  liveVehicleIds: Set<string>,
): T[] {
  if (source === 'demo') return rows;
  return rows.filter((row) => Boolean(row.vehicleId) && liveVehicleIds.has(row.vehicleId!));
}

/**
 * Notifications without a vehicle (system messages) stay visible in live mode;
 * those attached to a demo vehicle must not.
 */
export function visibleNotificationsForSource<T extends HasVehicleId>(
  rows: T[],
  source: 'live' | 'demo',
  liveVehicleIds: Set<string>,
): T[] {
  if (source === 'demo') return rows;
  return rows.filter(
    (row) => !row.vehicleId || liveVehicleIds.has(row.vehicleId),
  );
}

/**
 * Which data source should the app actually use?
 *
 * Live requires both: credentials configured AND a signed-in session. Anything
 * else falls back to demo so the screens never render empty by accident.
 */
export function resolveDataSource(args: {
  liveAvailable: boolean;
  signedIn: boolean;
  preference: 'live' | 'demo';
}): 'live' | 'demo' {
  if (!args.liveAvailable || !args.signedIn) return 'demo';
  return args.preference;
}
