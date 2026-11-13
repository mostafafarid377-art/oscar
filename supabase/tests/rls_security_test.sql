-- ============================================================================
-- CarOS Phase 1 — RLS security tests
-- ============================================================================
-- HOW TO RUN
--   Supabase SQL Editor: paste and execute. Results appear in the "results"
--   table at the end. Every row must read PASS.
--   Or with psql against a scratch database:
--       psql "$DATABASE_URL" -f supabase/tests/rls_security_test.sql
--
-- WHAT IT PROVES
--   Two distinct users (Alice, Bob) are created. Bob must not be able to see,
--   modify, or delete Alice's vehicle, and must not be able to grant himself
--   membership or escalate his role.
--
-- SAFETY
--   Wrapped in a transaction that is ROLLED BACK at the end, so running it
--   against a real project leaves no test users or vehicles behind.
--
-- NOTE: this needs a real Supabase project. It cannot run in an environment
-- without Postgres (it was NOT executed in the development sandbox).
-- ============================================================================

begin;

create temp table results (
  n serial,
  check_name text,
  expected text,
  actual text,
  status text
) on commit drop;

-- ---------------------------------------------------------------------------
-- Fixtures: two users
-- ---------------------------------------------------------------------------
do $$
declare
  alice uuid := '11111111-1111-1111-1111-111111111111';
  bob   uuid := '22222222-2222-2222-2222-222222222222';
begin
  -- Insert straight into auth.users; the on_auth_user_created trigger will
  -- create the matching public.profiles rows.
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data
  ) values
    (alice, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'alice.rls@example.com', crypt('test-password', gen_salt('bf')), now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     jsonb_build_object('full_name','Alice Owner')),
    (bob, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'bob.rls@example.com', crypt('test-password', gen_salt('bf')), now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     jsonb_build_object('full_name','Bob Intruder'))
  on conflict (id) do nothing;
end $$;

-- Alice gets a vehicle. Inserted with RLS bypassed (we are superuser here)
-- so the fixture exists regardless of who is "logged in".
insert into public.vehicles (id, owner_id, make, model, year, mileage, is_primary, vin)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'Hyundai', 'Elantra', 2018, 128450, true, 'KMHD141CAGT204871'
);

/* ---------------------------------------------------------------------------
   Helpers that simulate a logged-in user by setting the JWT claims that
   auth.uid() reads, then switching to the `authenticated` role.
   --------------------------------------------------------------------------- */
create or replace function pg_temp.act_as(p_user uuid)
returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', p_user::text, 'role', 'authenticated')::text,
    true
  );
end $$;

create or replace function pg_temp.act_as_admin()
returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

create or replace function pg_temp.record(
  p_name text, p_expected text, p_actual text
) returns void language plpgsql as $$
begin
  insert into results (check_name, expected, actual, status)
  values (p_name, p_expected, p_actual,
          case when p_expected = p_actual then 'PASS' else 'FAIL' end);
end $$;

-- ===========================================================================
-- 1. Alice sees her own vehicle
-- ===========================================================================
select pg_temp.act_as('11111111-1111-1111-1111-111111111111');
select pg_temp.record(
  '1. owner can read own vehicle',
  '1',
  (select count(*)::text from public.vehicles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
);

-- ===========================================================================
-- 2. Bob sees nothing of Alice's
-- ===========================================================================
select pg_temp.act_as('22222222-2222-2222-2222-222222222222');
select pg_temp.record(
  '2. stranger cannot read others vehicle',
  '0',
  (select count(*)::text from public.vehicles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
);
select pg_temp.record(
  '3. stranger sees no vehicles at all',
  '0',
  (select count(*)::text from public.vehicles)
);

-- ===========================================================================
-- 4. Bob cannot update Alice's vehicle
-- ===========================================================================
update public.vehicles set mileage = 1 where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
select pg_temp.record(
  '4. stranger update affected no rows',
  '0',
  (select count(*)::text from public.vehicles where mileage = 1)
);

-- ===========================================================================
-- 5. Bob cannot delete Alice's vehicle
-- ===========================================================================
delete from public.vehicles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
select pg_temp.record(
  '5. stranger delete left the vehicle intact',
  '1',
  (select count(*)::text from public.vehicles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
);

-- ===========================================================================
-- 6. Bob cannot grant himself membership
-- ===========================================================================
do $$
begin
  insert into public.vehicle_members (vehicle_id, user_id, role)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          '22222222-2222-2222-2222-222222222222', 'mechanic');
  perform pg_temp.record('6. stranger cannot self-grant membership', 'blocked', 'allowed');
exception
  when others then
    perform pg_temp.record('6. stranger cannot self-grant membership', 'blocked', 'blocked');
end $$;

-- ===========================================================================
-- 7. Bob cannot forge a vehicle owned by Alice
-- ===========================================================================
do $$
begin
  insert into public.vehicles (owner_id, make, model, year, mileage)
  values ('11111111-1111-1111-1111-111111111111', 'Toyota', 'Corolla', 2022, 100);
  perform pg_temp.record('7. cannot insert a vehicle on behalf of another user', 'blocked', 'allowed');
exception
  when others then
    perform pg_temp.record('7. cannot insert a vehicle on behalf of another user', 'blocked', 'blocked');
end $$;

-- ===========================================================================
-- 8. Owner cannot be reassigned by the owner (immutability trigger)
-- ===========================================================================
select pg_temp.act_as('11111111-1111-1111-1111-111111111111');
do $$
begin
  update public.vehicles
     set owner_id = '22222222-2222-2222-2222-222222222222'
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  perform pg_temp.record('8. owner_id cannot be reassigned', 'blocked', 'allowed');
exception
  when others then
    perform pg_temp.record('8. owner_id cannot be reassigned', 'blocked', 'blocked');
end $$;

select pg_temp.act_as_admin();

-- ===========================================================================
-- 9. Profiles are private
-- ===========================================================================
select pg_temp.act_as('22222222-2222-2222-2222-222222222222');
select pg_temp.record(
  '9. user sees only their own profile',
  '1',
  (select count(*)::text from public.profiles)
);
select pg_temp.record(
  '10. stranger cannot read another profile',
  '0',
  (select count(*)::text from public.profiles
    where id = '11111111-1111-1111-1111-111111111111')
);

-- ===========================================================================
-- 11. One primary vehicle per owner
-- ===========================================================================
select pg_temp.act_as('11111111-1111-1111-1111-111111111111');
do $$
begin
  insert into public.vehicles (owner_id, make, model, year, mileage, is_primary)
  values ('11111111-1111-1111-1111-111111111111', 'Kia', 'Sportage', 2021, 500, true);
  perform pg_temp.record('11. second primary vehicle is rejected', 'blocked', 'allowed');
exception
  when unique_violation then
    perform pg_temp.record('11. second primary vehicle is rejected', 'blocked', 'blocked');
end $$;

select pg_temp.act_as_admin();

-- ===========================================================================
-- 12. Owner can successfully add a member; member can read the vehicle
-- ===========================================================================
insert into public.vehicle_members (vehicle_id, user_id, role)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '22222222-2222-2222-2222-222222222222', 'viewer');

select pg_temp.act_as('22222222-2222-2222-2222-222222222222');
select pg_temp.record(
  '12. invited member can read the shared vehicle',
  '1',
  (select count(*)::text from public.vehicles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
);

-- ===========================================================================
-- 13. A member still cannot delete or modify ownership
-- ===========================================================================
delete from public.vehicles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
select pg_temp.act_as_admin();
select pg_temp.record(
  '13. member cannot delete the shared vehicle',
  '1',
  (select count(*)::text from public.vehicles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
);

select pg_temp.act_as('22222222-2222-2222-2222-222222222222');
do $$
begin
  update public.vehicles
     set is_primary = true
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  perform pg_temp.record('14. member cannot change vehicle settings', 'blocked', 'allowed');
exception
  when others then
    perform pg_temp.record('14. member cannot change vehicle settings', 'blocked', 'blocked');
end $$;

-- ===========================================================================
-- 15. A member cannot escalate their own role
-- ===========================================================================
do $$
begin
  update public.vehicle_members
     set role = 'mechanic'
   where user_id = '22222222-2222-2222-2222-222222222222';
  perform pg_temp.record('15. member cannot escalate their own role', 'blocked', 'allowed');
exception
  when others then
    perform pg_temp.record('15. member cannot escalate their own role', 'blocked', 'blocked');
end $$;

select pg_temp.act_as_admin();

-- ---------------------------------------------------------------------------
-- Report
-- ---------------------------------------------------------------------------
select n, check_name, expected, actual, status from results order by n;

-- Leave no trace.
rollback;
