-- ============================================================================
-- CarOS Phase 1 — vehicle_members (sharing groundwork)
-- ============================================================================
-- Phase 1 prepares the relationship but ships NO sharing UI. Policies are
-- deliberately conservative: a member may read the vehicle, but may not
-- modify ownership, delete the vehicle, or escalate their own role.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'vehicle_member_role') then
    create type public.vehicle_member_role as enum ('viewer', 'mechanic');
  end if;
end
$$;

create table if not exists public.vehicle_members (
  id         uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       public.vehicle_member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  unique (vehicle_id, user_id)
);

comment on table public.vehicle_members is
  'Grants another user read access to a vehicle. No UI in Phase 1.';

create index if not exists vehicle_members_user_id_idx on public.vehicle_members (user_id);
create index if not exists vehicle_members_vehicle_id_idx on public.vehicle_members (vehicle_id);

-- ---------------------------------------------------------------------------
-- Helper: does the current user own this vehicle?
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER to avoid infinite recursion when policies on vehicles and
-- vehicle_members reference each other through RLS.
create or replace function public.is_vehicle_owner(p_vehicle_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.vehicles v
    where v.id = p_vehicle_id
      and v.owner_id = auth.uid()
  );
$$;

create or replace function public.is_vehicle_member(p_vehicle_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.vehicle_members m
    where m.vehicle_id = p_vehicle_id
      and m.user_id = auth.uid()
  );
$$;

revoke all on function public.is_vehicle_owner(uuid) from public;
revoke all on function public.is_vehicle_member(uuid) from public;
grant execute on function public.is_vehicle_owner(uuid) to authenticated;
grant execute on function public.is_vehicle_member(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Members may not be owners, and may not grant themselves membership.
-- Enforced in a trigger because RLS cannot see the "other" side cleanly.
-- ---------------------------------------------------------------------------
create or replace function public.vehicle_members_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
begin
  select owner_id into v_owner from public.vehicles where id = new.vehicle_id;

  if v_owner is null then
    raise exception 'vehicle not found' using errcode = '23503';
  end if;

  if new.user_id = v_owner then
    raise exception 'the owner cannot also be a member'
      using errcode = '23514';
  end if;

  -- Only the vehicle owner may create or change a membership row.
  if auth.uid() is distinct from v_owner then
    raise exception 'only the vehicle owner may manage members'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists vehicle_members_guard on public.vehicle_members;
create trigger vehicle_members_guard
  before insert or update on public.vehicle_members
  for each row execute function public.vehicle_members_guard();
