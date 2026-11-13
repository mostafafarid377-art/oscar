import { requireSupabase } from '@/lib/supabase';
import type { VehicleRow } from '@/types/database';
import { vehicleToRow, type VehicleWriteInput } from '@/lib/supabase/mappers';

/**
 * Thin data-access layer for the `vehicles` table.
 *
 * Every function relies on RLS for authorisation — we never filter by owner_id
 * on the client as a security measure, only as an optimisation. If a policy
 * were missing, these calls would still return only the caller's rows.
 */

export async function listVehicles(): Promise<VehicleRow[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('vehicles')
    .select('*')
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createVehicle(input: VehicleWriteInput): Promise<VehicleRow> {
  const sb = requireSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // First vehicle for a user automatically becomes the primary one.
  const { count, error: countError } = await sb
    .from('vehicles')
    .select('id', { count: 'exact', head: true });
  if (countError) throw new Error(countError.message);

  const { data, error } = await sb
    .from('vehicles')
    .insert({
      ...vehicleToRow(input),
      owner_id: user.id,
      is_primary: (count ?? 0) === 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateVehicle(
  id: string,
  input: VehicleWriteInput,
): Promise<VehicleRow> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('vehicles')
    .update(vehicleToRow(input))
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteVehicle(id: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from('vehicles').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/**
 * Promote a vehicle to primary.
 *
 * The partial unique index `vehicles_one_primary_per_owner` allows only one
 * row with is_primary = true per owner, so the old primary must be cleared
 * first. Two statements are not atomic over PostgREST, so we clear first and
 * restore the previous primary if the promote step fails.
 */
export async function setPrimaryVehicle(id: string): Promise<void> {
  const sb = requireSupabase();

  const { data: current, error: readError } = await sb
    .from('vehicles')
    .select('id')
    .eq('is_primary', true)
    .maybeSingle();
  if (readError) throw new Error(readError.message);

  if (current?.id === id) return;

  if (current) {
    const { error: clearError } = await sb
      .from('vehicles')
      .update({ is_primary: false })
      .eq('id', current.id);
    if (clearError) throw new Error(clearError.message);
  }

  const { error: promoteError } = await sb
    .from('vehicles')
    .update({ is_primary: true })
    .eq('id', id);

  if (promoteError) {
    // Best-effort rollback so the user is not left with no primary vehicle.
    if (current) {
      await sb.from('vehicles').update({ is_primary: true }).eq('id', current.id);
    }
    throw new Error(promoteError.message);
  }
}
