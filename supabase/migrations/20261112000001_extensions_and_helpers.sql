-- ============================================================================
-- CarOS Phase 1 — extensions and shared helpers
-- ============================================================================
-- Everything that follows assumes `auth.users` exists (Supabase managed).
-- Run migrations in filename order.

create extension if not exists "pgcrypto" with schema extensions;

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
-- Central helper so every table keeps `updated_at` honest without relying on
-- the client to send it (a client could otherwise forge timestamps).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Trigger helper: stamps updated_at on UPDATE.';
