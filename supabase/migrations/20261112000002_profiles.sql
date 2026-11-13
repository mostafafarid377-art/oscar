-- ============================================================================
-- CarOS Phase 1 — profiles
-- ============================================================================
create table if not exists public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  full_name          text check (full_name is null or char_length(full_name) between 1 and 120),
  avatar_url         text,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'ar')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table public.profiles is
  'One row per auth user. id is the same UUID as auth.users.id.';

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Provision a profile automatically on signup.
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER because the trigger runs in the auth schema context and
-- must insert into public.profiles regardless of the caller's RLS grants.
-- search_path is pinned to defeat search_path hijacking.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, preferred_language)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    case
      when coalesce(new.raw_user_meta_data ->> 'preferred_language', '') in ('en', 'ar')
        then new.raw_user_meta_data ->> 'preferred_language'
      else 'en'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
