-- ============================================================================
-- CarOS — atomically promote one owned vehicle to primary
-- ============================================================================
-- Keep the two row changes in one Postgres transaction and serialize changes
-- per owner. The function is SECURITY INVOKER so the existing RLS policies and
-- column-level UPDATE grants remain the authorization boundary.
create or replace function public.set_primary_vehicle(p_vehicle_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  affected_rows integer;
begin
  if actor_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  -- Avoid a race between two concurrent requests for the same user's garage.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(actor_id::text));

  update public.vehicles
     set is_primary = false
   where owner_id = actor_id
     and is_primary;

  update public.vehicles
     set is_primary = true
   where id = p_vehicle_id
     and owner_id = actor_id;

  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    -- Raising rolls back the earlier clear as well; do not expose whether an
    -- inaccessible vehicle exists to the caller.
    raise exception 'Vehicle not found or not owned by user'
      using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.set_primary_vehicle(uuid) from public, anon;
grant execute on function public.set_primary_vehicle(uuid) to authenticated;
