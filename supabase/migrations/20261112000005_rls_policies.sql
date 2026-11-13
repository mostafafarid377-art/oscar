-- ============================================================================
-- CarOS Phase 1 — Row Level Security
-- ============================================================================
-- Rule of thumb used throughout: `auth.uid()` is the only trusted identity
-- source. Nothing trusts a user_id sent by the client.

alter table public.profiles        enable row level security;
alter table public.vehicles        enable row level security;
alter table public.vehicle_members enable row level security;

-- NOTE: RLS is enabled but deliberately NOT forced.
--
-- The helper functions `is_vehicle_owner()` and `is_vehicle_member()` are
-- SECURITY DEFINER and are called from each other's policies:
--
--   vehicles SELECT  -> is_vehicle_member()  -> vehicle_members RLS
--   vehicle_members  -> is_vehicle_owner()   -> vehicles RLS
--
-- With `force row level security` the table owner (postgres, which is how
-- SECURITY DEFINER functions execute) would itself be subject to RLS, and
-- Postgres would abort with "infinite recursion detected in policy".
-- Leaving RLS unforced means these two helper functions see the real table
-- state and short-circuit the cycle. Every access path from the client still
-- goes through RLS because `authenticated` is not the table owner.

-- ===========================================================================
-- profiles
-- ===========================================================================
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- No INSERT policy: rows are created exclusively by the
-- `handle_new_user` SECURITY DEFINER trigger, so a client can never forge a
-- profile for someone else.
drop policy if exists "profiles: no client insert" on public.profiles;

-- No DELETE policy: profile removal follows the auth user cascade.

-- ===========================================================================
-- vehicles
-- ===========================================================================
drop policy if exists "vehicles: owner reads own" on public.vehicles;
create policy "vehicles: owner reads own"
  on public.vehicles for select
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "vehicles: member reads shared" on public.vehicles;
create policy "vehicles: member reads shared"
  on public.vehicles for select
  to authenticated
  using (public.is_vehicle_member(id));

drop policy if exists "vehicles: owner inserts" on public.vehicles;
create policy "vehicles: owner inserts"
  on public.vehicles for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "vehicles: owner updates" on public.vehicles;
create policy "vehicles: owner updates"
  on public.vehicles for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "vehicles: owner deletes" on public.vehicles;
create policy "vehicles: owner deletes"
  on public.vehicles for delete
  to authenticated
  using (owner_id = (select auth.uid()));

-- ===========================================================================
-- vehicle_members
-- ===========================================================================
-- A member can see their own membership row (so the client can tell whether
-- it is looking at a shared vehicle), and the owner can see all rows for
-- their vehicles (needed to revoke access later).
drop policy if exists "vehicle_members: read own or owned" on public.vehicle_members;
create policy "vehicle_members: read own or owned"
  on public.vehicle_members for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_vehicle_owner(vehicle_id)
  );

-- Only the owner may add a member. The `vehicle_members_guard` trigger
-- additionally guarantees the owner cannot add themselves or escalate.
drop policy if exists "vehicle_members: owner inserts" on public.vehicle_members;
create policy "vehicle_members: owner inserts"
  on public.vehicle_members for insert
  to authenticated
  with check (public.is_vehicle_owner(vehicle_id));

drop policy if exists "vehicle_members: owner updates" on public.vehicle_members;
create policy "vehicle_members: owner updates"
  on public.vehicle_members for update
  to authenticated
  using (public.is_vehicle_owner(vehicle_id))
  with check (public.is_vehicle_owner(vehicle_id));

drop policy if exists "vehicle_members: owner deletes" on public.vehicle_members;
create policy "vehicle_members: owner deletes"
  on public.vehicle_members for delete
  to authenticated
  using (public.is_vehicle_owner(vehicle_id));

-- Members can always leave a vehicle they were invited to, without needing
-- owner rights. This cannot be used to escalate: it only deletes their own row.
drop policy if exists "vehicle_members: leave own membership" on public.vehicle_members;
create policy "vehicle_members: leave own membership"
  on public.vehicle_members for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ===========================================================================
-- Column-level hardening
-- ===========================================================================
-- Belt and braces: even if a policy were loosened later, members must never be
-- able to write these columns. UPDATE is granted per-column for `authenticated`
-- and RLS narrows the rows further.
revoke update on public.vehicles from authenticated;
grant update (
  make, model, year, trim, engine_type, engine_capacity, transmission,
  fuel_type, mileage, photo_url, license_plate, vin, is_primary
) on public.vehicles to authenticated;

-- owner_id and created_at are intentionally absent from that column list, so
-- ownership cannot be reassigned through a normal client update.
