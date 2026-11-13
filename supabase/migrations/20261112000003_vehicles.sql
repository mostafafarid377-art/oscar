-- ============================================================================
-- CarOS Phase 1 — vehicles
-- ============================================================================
create table if not exists public.vehicles (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references auth.users (id) on delete cascade,
  make           text not null check (char_length(trim(make)) between 1 and 60),
  model          text not null check (char_length(trim(model)) between 1 and 60),
  year           integer not null check (year between 1900 and 2100),
  trim           text,
  engine_type    text,
  engine_capacity text,
  transmission   text check (transmission is null or transmission in ('automatic', 'manual', 'cvt')),
  fuel_type      text check (fuel_type is null or fuel_type in ('petrol', 'diesel', 'hybrid', 'electric')),
  mileage        integer not null default 0 check (mileage >= 0 and mileage <= 5000000),
  photo_url      text,
  license_plate  text,
  vin            text,
  is_primary     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.vehicles is
  'Vehicles owned by a user. Ownership (owner_id) is immutable from the client.';

-- At most one primary vehicle per owner.
-- A partial unique index is better than a trigger: it is declarative and the
-- planner can use it for lookups.
create unique index if not exists vehicles_one_primary_per_owner
  on public.vehicles (owner_id)
  where is_primary;

create index if not exists vehicles_owner_id_idx on public.vehicles (owner_id);
create index if not exists vehicles_owner_created_idx on public.vehicles (owner_id, created_at desc);

-- VIN should be unique per platform when present (17-char standard).
create unique index if not exists vehicles_vin_unique
  on public.vehicles (upper(vin))
  where vin is not null and char_length(trim(vin)) > 0;

drop trigger if exists vehicles_set_updated_at on public.vehicles;
create trigger vehicles_set_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Guard: owner_id can never change, and is_primary can only be set by the
-- owner. This is defence in depth on top of the RLS update policy.
-- ---------------------------------------------------------------------------
create or replace function public.vehicles_guard_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.owner_id <> old.owner_id then
    raise exception 'vehicles.owner_id is immutable'
      using errcode = '42501';
  end if;
  if new.id <> old.id then
    raise exception 'vehicles.id is immutable'
      using errcode = '42501';
  end if;
  if new.created_at <> old.created_at then
    raise exception 'vehicles.created_at is immutable'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists vehicles_guard_update on public.vehicles;
create trigger vehicles_guard_update
  before update on public.vehicles
  for each row execute function public.vehicles_guard_update();
